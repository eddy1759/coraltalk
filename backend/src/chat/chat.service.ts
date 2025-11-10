import { Injectable, Logger } from '@nestjs/common';
import { VectorStoreService } from '../retrieval/vector-store.service';
import { StrictKBStrategy } from './strategies/strict-kb.strategy';
import { HybridStrategy } from './strategies/hybrid.strategy';
import { ChatQueryDto } from './dto/chat-query.dto';
import { Observable, from, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { SSEEvent } from '../common/types/sse.types';
import { RetrievalResult } from '../common/types/sse.types';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private vectorStoreService: VectorStoreService,
    private strictStrategy: StrictKBStrategy,
    private hybridStrategy: HybridStrategy,
  ) {}

  handleQuery(dto: ChatQueryDto): Observable<SSEEvent> {
    const { query, useGeneralLLM } = dto;

    this.logger.log(
      `Handling query: "${query.substring(0, 50)}..." | Mode: ${
        useGeneralLLM ? 'Hybrid' : 'Strict'
      }`,
    );

    const retrieval$: Observable<RetrievalResult[]> = from(
      this.vectorStoreService.search(query),
    );

    return retrieval$.pipe(
      switchMap((results: RetrievalResult[]) => {
        const retrievalTime = Date.now();
        this.logger.debug(
          `Retrieved ${
            results.length
          } chunks in ${retrievalTime}ms | Top score: ${results[0]?.score.toFixed(3) || 'N/A'}`,
        );

        const strategy = useGeneralLLM
          ? this.hybridStrategy
          : this.strictStrategy;

        return strategy.generateResponse(query, results);
      }),
      catchError((error) => {
        this.logger.error('Error handling query:', error);
        return of({
          // eslint-disable-next-line @typescript-eslint/prefer-as-const
          event: 'error' as 'error',
          data: 'An error occurred while processing your query. Please try again.',
        });
      }),
    );
  }

  /**
   * Get chat statistics (optional - for monitoring)
   */
  async getStats() {
    return await this.vectorStoreService.getStats();
  }
}
