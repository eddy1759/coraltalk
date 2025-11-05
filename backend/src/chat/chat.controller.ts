import {
  Controller,
  Post,
  Body,
  Sse,
  HttpCode,
  HttpStatus,
  Logger,
  Get,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ChatService } from './chat.service';
import { ChatQueryDto } from './dto/chat-query.dto';
import { SSEEvent } from '../common/types/sse.types';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { ChatTestResponseDto } from './dto/chat-response.dto';

interface MessageEvent {
  data: string;
  type?: string;
}

@ApiTags('Chat')
@Controller('api/chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private chatService: ChatService) {}

  /**
   * SSE endpoint for streaming chat responses
   */

  @Post('stream')
  @Sse()
  @ApiOperation({
    summary: 'Start a new chat session (streaming)',
    description:
      'Sends a query and receives a Server-Sent Events (SSE) stream. This is the primary chat endpoint.',
  })
  @ApiBody({ type: ChatQueryDto })
  @ApiResponse({
    status: 200,
    description:
      'A stream of SSE events. Event types include "token", "citation", "end", and "error".',
  })
  @HttpCode(HttpStatus.OK)
  streamChat(@Body() dto: ChatQueryDto): Observable<MessageEvent> {
    this.logger.log(
      `Stream request: "${dto.query.substring(0, 50)}..." | LLM: ${dto.useGeneralLLM}`,
    );

    const eventStream: Observable<SSEEvent> = this.chatService.handleQuery(dto);

    return eventStream.pipe(
      map((event: SSEEvent): MessageEvent => {
        return {
          type: event.event,
          data: event.data,
        };
      }),
    );
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  @ApiOperation({
    summary: 'Health Check',
    description:
      'Check the status of the service and get stats about the vector store.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy and ready.',
  })
  async health() {
    const stats = await this.chatService.getStats();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      stats,
    };
  }

  /**
   * Test endpoint for non-streaming response (useful for debugging)
   */
  @Post('test')
  @ApiOperation({
    summary: 'Test RAG Pipeline (non-streaming)',
    description:
      'Sends a query and waits for all events to complete, returning a single JSON object. Ideal for debugging the RAG pipeline.',
  })
  @ApiBody({ type: ChatQueryDto })
  @ApiResponse({
    status: 200,
    description: 'The aggregated result of the chat stream.',
    type: ChatTestResponseDto,
  })
  async testChat(@Body() dto: ChatQueryDto): Promise<ChatTestResponseDto> {
    this.logger.log(`Test request: "${dto.query}"`);

    const eventStream = this.chatService.handleQuery(dto);

    return new Promise((resolve, reject) => {
      const events: SSEEvent[] = [];

      eventStream.subscribe({
        next: (event) => events.push(event),
        error: (error) =>
          reject(error instanceof Error ? error : new Error(String(error))),
        complete: () => {
          const message = events
            .filter((e) => e.event === 'token')
            .map((e) => e.data)
            .join('');

          const citationEvent = events.find((e) => e.event === 'citation');
          let citation: unknown = null;
          if (citationEvent) {
            try {
              citation = JSON.parse(citationEvent.data);
            } catch {
              citation = null;
            }
          }
          resolve({
            message,
            citation,
            events: events.length,
          });
        },
      });
    });
  }
}
