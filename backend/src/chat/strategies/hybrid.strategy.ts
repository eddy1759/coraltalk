import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResponseStrategy } from './response-strategy.interface';
import { LLMService } from '../../llm/llm.service';
import { Observable } from 'rxjs';
import { SSEEvent, RetrievalResult } from '../../common/types/sse.types';
import {
  STRICT_PROMPT,
  AUGMENTED_PROMPT,
  GENERAL_PROMPT_WITH_CONTEXT,
} from './prompts';

@Injectable()
export class HybridStrategy implements ResponseStrategy {
  private readonly logger = new Logger(HybridStrategy.name);
  private readonly highConfidenceThreshold: number;
  private readonly lowConfidenceThreshold: number;
  private readonly maxContextChunks = 6;

  constructor(
    private llmService: LLMService,
    private configService: ConfigService,
  ) {
    this.highConfidenceThreshold = this.configService.get<number>(
      'retrieval.confidenceThresholdHigh',
    )!;
    this.lowConfidenceThreshold = this.configService.get<number>(
      'retrieval.confidenceThresholdLow',
    )!;
  }

  generateResponse(
    query: string,
    results: RetrievalResult[],
  ): Observable<SSEEvent> {
    const topScore =
      results && results.length > 0 ? (results[0].score ?? 0) : 0;

    this.logger.debug(
      `Hybrid Strategy: Top score ${topScore.toFixed(3)} (High: ${this.highConfidenceThreshold}, Low: ${this.lowConfidenceThreshold})`,
    );

    // High confidence, use KB only
    if (topScore >= this.highConfidenceThreshold) {
      return this.generateKBOnlyResponse(query, results);
    }

    // Medium confidence, augment KB with LLM
    if (topScore >= this.lowConfidenceThreshold) {
      return this.generateAugmentedResponse(query, results);
    }

    // Low confidence: Use general LLM knowledge
    return this.generateGeneralLLMResponse(query, results);
  }

  private generateKBOnlyResponse(
    query: string,
    results: RetrievalResult[],
  ): Observable<SSEEvent> {
    this.logger.debug('Using KB-only response (high confidence)');

    const context = this.buildContext(results, this.maxContextChunks);

    const prompt = STRICT_PROMPT.replace('{context}', context).replace(
      '{question}',
      query,
    );

    return this.llmService.streamCompletion(
      prompt,
      'Internal Docs',
      results[0].score,
    );
  }

  private generateAugmentedResponse(
    query: string,
    results: RetrievalResult[],
  ): Observable<SSEEvent> {
    this.logger.debug('Using augmented response (medium confidence)');

    const context = this.buildContext(results, this.maxContextChunks);

    const prompt = AUGMENTED_PROMPT.replace('{context}', context).replace(
      '{question}',
      query,
    );

    return this.llmService.streamCompletion(prompt, 'Hybrid', results[0].score);
  }

  private generateGeneralLLMResponse(
    query: string,
    results: RetrievalResult[],
  ): Observable<SSEEvent> {
    this.logger.debug('Using general LLM response (low confidence)');

    let context = '';
    if (results && results.length > 0) {
      context = this.buildContext(results, this.maxContextChunks);
    }

    const prompt = GENERAL_PROMPT_WITH_CONTEXT.replace(
      '{context}',
      context,
    ).replace('{question}', query);

    return this.llmService.streamCompletion(
      prompt,
      'General LLM',
      results[0]?.score || 0,
    );
  }

  private buildContext(results: RetrievalResult[], maxChunks = 5): string {
    if (!results || results.length === 0) return '';

    return results
      .slice(0, maxChunks)
      .map((r, idx) => {
        const id = (r as any).chunkId ?? `chunk-${idx + 1}`;
        return `[Chunk ${idx + 1} | id:${id} | score:${(r.score ?? 0).toFixed(3)}]\n${r.content}`;
      })
      .join('\n\n---\n\n');
  }
}
