import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

// Must run after AuthGuard: one listen per user–song pair per window,
// so a user can still play different songs back to back.
@Injectable()
export class ListenThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return `${req.userAuth.user_id}:${req.params.id}`;
  }
}
