import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

// Must run after AuthGuard: the limit is per user, not per IP.
@Injectable()
export class EventsThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return `user:${req.userAuth.user_id}`;
  }
}
