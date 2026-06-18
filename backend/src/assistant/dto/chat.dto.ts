import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ChatMessageDto {
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @IsString()
  @MinLength(1)
  content!: string;
}

export class ChatDto {
  /** Conversation so far, oldest first; the last entry is the new user turn. */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages!: ChatMessageDto[];

  /** Optional system instruction prepended to the conversation. */
  @IsOptional()
  @IsString()
  system?: string;

  /** The project the user is currently viewing (for tool context). */
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  projectName?: string;
}
