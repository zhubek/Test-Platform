import { Module } from '@nestjs/common';
import { McpModule } from '../mcp/mcp.module';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';

@Module({
  imports: [McpModule],
  controllers: [AssistantController],
  providers: [AssistantService],
})
export class AssistantModule {}
