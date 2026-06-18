import { Injectable } from '@nestjs/common';
import { McpService } from '../mcp/mcp.service';
import { ChatDto } from './dto/chat.dto';

// Configurable so the model/endpoint can change without code edits.
const API_BASE =
  process.env.GEMINI_API_URL ?? 'https://generativelanguage.googleapis.com/v1beta';
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
const MAX_ROUNDS = 6; // guard against tool-call loops

interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args?: Record<string, unknown> };
  thoughtSignature?: string; // Gemini-3: must be echoed back on the model turn
}
interface GeminiChunk {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
}

/** One streamed step: a text delta, a tool invocation, or a terminal error. */
export type ChatEvent =
  | { token: string }
  | { tool: { name: string; args: Record<string, unknown> } }
  | { error: string };

@Injectable()
export class AssistantService {
  constructor(private readonly mcp: McpService) {}

  /**
   * Stream a chat turn from Gemini, looping through any tool (function) calls
   * against the read-only MCP content layer. Yields text deltas, tool-use
   * markers, and errors so the controller can forward them over SSE.
   */
  async *streamChat(dto: ChatDto): AsyncGenerator<ChatEvent> {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      yield { error: 'GEMINI_API_KEY is not configured on the server.' };
      return;
    }

    const contents: unknown[] = dto.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    const tools = [{ functionDeclarations: this.mcp.declarations() }];
    const systemInstruction = { parts: [{ text: this.systemPrompt(dto) }] };

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const body = { contents, tools, systemInstruction };

      let res: Response;
      try {
        res = await fetch(`${API_BASE}/models/${MODEL}:streamGenerateContent?alt=sse`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify(body),
        });
      } catch (e) {
        yield { error: `Could not reach Gemini API: ${(e as Error).message}` };
        return;
      }
      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => '');
        yield { error: `Gemini API ${res.status}: ${text.slice(0, 500)}` };
        return;
      }

      // Stream this round: emit text deltas live, collect any function calls.
      // Keep the RAW parts (they carry Gemini-3 `thoughtSignature`s that must be
      // echoed back verbatim, or the next request 400s).
      const rawParts: GeminiPart[] = [];
      const calls: { name: string; args: Record<string, unknown> }[] = [];
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;
          let json: GeminiChunk;
          try {
            json = JSON.parse(payload) as GeminiChunk;
          } catch {
            continue;
          }
          for (const p of json.candidates?.[0]?.content?.parts ?? []) {
            rawParts.push(p);
            if (p.text) yield { token: p.text };
            if (p.functionCall) {
              calls.push({ name: p.functionCall.name, args: p.functionCall.args ?? {} });
            }
          }
        }
      }

      // No tool calls → the model produced its final answer; we're done.
      if (calls.length === 0) return;

      // Replay the model's turn verbatim (preserves thoughtSignatures), then run
      // each tool and feed the results back.
      contents.push({ role: 'model', parts: rawParts });

      const responseParts: unknown[] = [];
      for (const c of calls) {
        yield { tool: { name: c.name, args: c.args } };
        const result = await this.mcp.execute(c.name, c.args);
        responseParts.push({ functionResponse: { name: c.name, response: { result } } });
      }
      contents.push({ role: 'user', parts: responseParts });
      // Loop: the next round turns the tool results into an answer.
    }

    yield { error: 'Reached the tool-call limit without a final answer.' };
  }

  private systemPrompt(dto: ChatDto): string {
    const lines = [
      'You are an AI assistant embedded in the "TestPlatform" admin panel.',
      'You can READ the platform content through the provided tools (projects, tests, blocks, catalog groups and items). The tools are read-only — you cannot modify anything.',
      'When the user asks about their data, call the relevant tool(s) rather than guessing. Keep answers concise and well formatted.',
    ];
    if (dto.projectName || dto.projectId) {
      lines.push(
        `The user is currently working in project "${dto.projectName ?? '?'}" (id: ${dto.projectId ?? '?'}). Prefer this project unless they ask otherwise.`,
      );
    }
    return lines.join('\n');
  }
}
