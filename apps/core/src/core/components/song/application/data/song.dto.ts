import { User } from 'src/core/components/user/application/data/user.dto';
import { TranscriptionStatus } from 'src/core/shared-kernel/data/enum/transcription-status.enum';
import { TranscriptionResult } from 'src/core/shared-kernel/ports/transcription-service.interface';

export class Song {
  id: number;
  name: string;
  description: string;
  cover_url?: string;
  user_id: number;
  text?: string;
  audio: string;
  listens: number;
  transcription?: TranscriptionResult | null;
  transcription_status: TranscriptionStatus;
  language?: string | null;
  created_at: Date;
  deleted_at?: Date;

  user?: User;
}
