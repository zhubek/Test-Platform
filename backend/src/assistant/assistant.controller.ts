import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AssistantService } from './assistant.service';
import { ChatDto } from './dto/chat.dto';

// Authenticated-only proxy to the AI assistant. No resource policy — any
// logged-in admin may chat. Responds as Server-Sent Events (token deltas).
@Controller('assistant')
@UseGuards(JwtAuthGuard)
export class AssistantController {
  constructor(private readonly service: AssistantService) {}

  @Post('chat')
  async chat(@Body() dto: ChatDto, @Res() res: Response) {
    // @Res() puts the request in manual mode, so the global response-envelope
    // interceptor leaves this stream alone.
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // disable proxy buffering
    res.flushHeaders?.();

    const send = (event: string, data: unknown) =>
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

    try {
      for await (const ev of this.service.streamChat(dto)) {
        if ('error' in ev) send('error', { message: ev.error });
        else if ('tool' in ev) send('tool', ev.tool);
        else send('token', { token: ev.token });
      }
    } catch (e) {
      send('error', { message: (e as Error).message });
    } finally {
      send('done', {});
      res.end();
    }
  }
}
