import { Observable } from 'rxjs';
import { SSEEvent, RetrievalResult } from '../../common/types/sse.types';

export interface ResponseStrategy {
  generateResponse(
    query: string,
    retrievalResults: RetrievalResult[],
  ): Observable<SSEEvent>;
}
