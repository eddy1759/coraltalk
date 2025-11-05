import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { RetrievalModule } from '../retrieval/retrieval.module';
import { LLMModule } from '../llm/llm.module';
import { StrictKBStrategy } from './strategies/strict-kb.strategy';
import { HybridStrategy } from './strategies/hybrid.strategy';

@Module({
  imports: [ConfigModule, RetrievalModule, LLMModule],
  controllers: [ChatController],
  providers: [ChatService, StrictKBStrategy, HybridStrategy],
})
export class ChatModule {}
