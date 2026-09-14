import { Injectable, Logger } from '@nestjs/common';
import { Observable, Subject, filter } from 'rxjs';
import { AppDomainEvent } from './types/domain-event.type';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  private readonly events$ = new Subject<AppDomainEvent>();

  emit(event: AppDomainEvent): void {
    try {
      this.events$.next(event);
    } catch (error) {
      this.logger.warn(
        `Failed to emit event [id=${event?.id}, type=${event?.type}]: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  subscribe(userId?: string, eventType?: string): Observable<AppDomainEvent> {
    return this.events$.asObservable().pipe(
      filter((event) => {
        if (userId && event.userId !== userId) {
          return false;
        }
        if (eventType && event.type !== eventType) {
          return false;
        }
        return true;
      }),
    );
  }
}
