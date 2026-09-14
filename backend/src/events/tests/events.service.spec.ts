import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { Subject } from 'rxjs';
import { EventsService } from '../events.service';
import { AppDomainEvent, NoteUpdatedEvent } from '../types/domain-event.type';

describe('EventsService', () => {
  let service: EventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventsService],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('emit and subscribe', () => {
    it('should broadcast emitted events to all subscribers when no filters applied', (done) => {
      const mockEvent: NoteUpdatedEvent = {
        id: 'event-1',
        type: 'NOTE_UPDATED',
        aggregateId: 'note-1',
        userId: 'user-1',
        timestamp: new Date(),
        payload: {
          id: 'note-1',
          status: 'COMPLETED',
          aiTitle: 'Test Title',
        },
      };

      service.subscribe().subscribe((event) => {
        expect(event).toEqual(mockEvent);
        done();
      });

      service.emit(mockEvent);
    });

    it('should filter events by userId correctly', () => {
      const user1Received: AppDomainEvent[] = [];
      const user2Received: AppDomainEvent[] = [];

      service.subscribe('user-1').subscribe((event) => {
        user1Received.push(event);
      });

      service.subscribe('user-2').subscribe((event) => {
        user2Received.push(event);
      });

      const eventUser1: NoteUpdatedEvent = {
        id: 'evt-1',
        type: 'NOTE_UPDATED',
        aggregateId: 'note-1',
        userId: 'user-1',
        timestamp: new Date(),
        payload: { id: 'note-1', status: 'COMPLETED' },
      };

      const eventUser2: NoteUpdatedEvent = {
        id: 'evt-2',
        type: 'NOTE_UPDATED',
        aggregateId: 'note-2',
        userId: 'user-2',
        timestamp: new Date(),
        payload: { id: 'note-2', status: 'COMPLETED' },
      };

      service.emit(eventUser1);
      service.emit(eventUser2);

      expect(user1Received).toHaveLength(1);
      expect(user1Received[0].id).toBe('evt-1');

      expect(user2Received).toHaveLength(1);
      expect(user2Received[0].id).toBe('evt-2');
    });

    it('should filter events by eventType correctly', () => {
      const noteUpdatedReceived: AppDomainEvent[] = [];

      service.subscribe(undefined, 'NOTE_UPDATED').subscribe((event) => {
        noteUpdatedReceived.push(event);
      });

      const event1: AppDomainEvent = {
        id: 'evt-1',
        type: 'NOTE_UPDATED',
        aggregateId: 'note-1',
        userId: 'user-1',
        timestamp: new Date(),
        payload: { id: 'note-1', status: 'COMPLETED' },
      };

      const event2: AppDomainEvent = {
        id: 'evt-2',
        type: 'NOTE_CREATED',
        aggregateId: 'note-2',
        userId: 'user-1',
        timestamp: new Date(),
        payload: { id: 'note-2', status: 'COMPLETED' },
      };

      service.emit(event1);
      service.emit(event2);

      expect(noteUpdatedReceived).toHaveLength(1);
      expect(noteUpdatedReceived[0].id).toBe('evt-1');
    });

    it('should filter events by both userId and eventType', () => {
      const received: AppDomainEvent[] = [];

      service.subscribe('user-1', 'NOTE_UPDATED').subscribe((event) => {
        received.push(event);
      });

      const matchingEvent: AppDomainEvent = {
        id: 'evt-match',
        type: 'NOTE_UPDATED',
        aggregateId: 'note-1',
        userId: 'user-1',
        timestamp: new Date(),
        payload: { id: 'note-1', status: 'COMPLETED' },
      };

      const wrongUserEvent: AppDomainEvent = {
        id: 'evt-wrong-user',
        type: 'NOTE_UPDATED',
        aggregateId: 'note-2',
        userId: 'user-2',
        timestamp: new Date(),
        payload: { id: 'note-2', status: 'COMPLETED' },
      };

      const wrongTypeEvent: AppDomainEvent = {
        id: 'evt-wrong-type',
        type: 'NOTE_ARCHIVED',
        aggregateId: 'note-1',
        userId: 'user-1',
        timestamp: new Date(),
        payload: { id: 'note-1', status: 'COMPLETED' },
      };

      service.emit(matchingEvent);
      service.emit(wrongUserEvent);
      service.emit(wrongTypeEvent);

      expect(received).toHaveLength(1);
      expect(received[0].id).toBe('evt-match');
    });

    it('should not deliver event to user-specific subscriber if event has no userId', () => {
      const received: AppDomainEvent[] = [];

      service.subscribe('user-1').subscribe((event) => {
        received.push(event);
      });

      const eventWithoutUser: AppDomainEvent = {
        id: 'evt-no-user',
        type: 'NOTE_UPDATED',
        aggregateId: 'note-1',
        timestamp: new Date(),
        payload: { id: 'note-1', status: 'COMPLETED' },
      };

      service.emit(eventWithoutUser);

      expect(received).toHaveLength(0);
    });
  });

  describe('error handling in emit', () => {
    it('should safely catch errors, log a warning, and not throw exception', () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

      const internalSubject = (
        service as unknown as { events$: Subject<AppDomainEvent> }
      ).events$;
      jest.spyOn(internalSubject, 'next').mockImplementation(() => {
        throw new Error('RxJS Subject Error');
      });

      const mockEvent: NoteUpdatedEvent = {
        id: 'event-err',
        type: 'NOTE_UPDATED',
        aggregateId: 'note-1',
        userId: 'user-1',
        timestamp: new Date(),
        payload: { id: 'note-1', status: 'COMPLETED' },
      };

      expect(() => service.emit(mockEvent)).not.toThrow();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Failed to emit event [id=event-err, type=NOTE_UPDATED]: RxJS Subject Error',
        ),
      );
    });
  });
});
