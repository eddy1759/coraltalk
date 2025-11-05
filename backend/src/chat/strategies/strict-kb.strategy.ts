import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResponseStrategy } from './response-strategy.interface';
import { LLMService } from '../../llm/llm.service';
import { Observable } from 'rxjs';
import { SSEEvent, RetrievalResult } from '../../common/types/sse.types';
import { STRICT_PROMPT, NO_ANSWER_PHRASE } from './prompts';

@Injectable()
export class StrictKBStrategy implements ResponseStrategy {
  private readonly logger = new Logger(StrictKBStrategy.name);
  private readonly kbConfidenceThreshold: number;

  constructor(
    private llmService: LLMService,
    private configService: ConfigService,
  ) {
    this.kbConfidenceThreshold = this.configService.get<number>(
      'retrieval.strictKBConfidenceThreshold',
    )!;
  }

  generateResponse(
    query: string,
    results: RetrievalResult[],
  ): Observable<SSEEvent> {
    this.logger.debug(
      `Strict KB Strategy: Processing query with ${results.length} results`,
    );

    if (
      !results ||
      results.length === 0 ||
      (results[0].score ?? 0) < this.kbConfidenceThreshold
    ) {
      this.logger.debug(
        'No relevant context found or below threshold -> returning no-answer stream',
      );
      return this.createNoAnswerStream();
    }

    const context = this.buildContext(results, 5);

    const prompt = STRICT_PROMPT.replace('{context}', context).replace(
      '{question}',
      query,
    );

    return this.llmService.streamCompletion(
      prompt,
      'Internal Docs',
      results[0].score ?? 0,
      0.0,
    );
  }

  private createNoAnswerStream(): Observable<SSEEvent> {
    return new Observable((subscriber) => {
      subscriber.next({
        event: 'token',
        data: NO_ANSWER_PHRASE,
      });

      subscriber.next({
        event: 'citation',
        data: JSON.stringify({
          source: 'Internal Docs',
          confidence: 0,
          notes: 'no relevant context found',
        }),
      });

      subscriber.next({
        event: 'end',
        data: 'Stream complete',
      });

      subscriber.complete();
    });
  }

  private buildContext(results: RetrievalResult[], maxChunks = 5): string {
    return results
      .slice(0, maxChunks)
      .map((r, idx) => {
        const id = (r as any).chunkId ?? `chunk-${idx + 1}`;
        return `[Chunk ${idx + 1} | id:${id} | score:${(r.score ?? 0).toFixed(3)}]\n${r.content}`;
      })
      .join('\n\n---\n\n');
  }
}
