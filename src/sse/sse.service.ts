import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class SSEService {
  private eventSubjects: Record<string, Subject<MessageEvent>> = {};

  async deleteEvent(uuid: string) {
    delete this.eventSubjects[uuid];
  }

  emitEvent(uuid: string, data: object) {
    if (!this.eventSubjects[uuid]) {
      throw new Error(`No event stream found for uuid ${uuid}`);
    }
    this.eventSubjects[uuid].next({
      data,
    } as MessageEvent);
  }

  sse(uuid: string): Observable<MessageEvent> {
    if (!this.eventSubjects[uuid]) {
      this.eventSubjects[uuid] = new Subject<MessageEvent>();
    }
    console.log('opened', uuid);

    return this.eventSubjects[uuid].asObservable();
  }
}
