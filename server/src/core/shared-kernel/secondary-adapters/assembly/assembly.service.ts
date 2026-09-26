import { Injectable } from '@nestjs/common';
import { AssemblyServiceInterface } from '../../ports/assembly-service.interface';
import { ConfigService } from '@nestjs/config';
import { AssemblyAI } from 'assemblyai';
import { formatSongText } from '../../common/format-song-text.util';

@Injectable()
export class AssemblyService implements AssemblyServiceInterface {
  private assemblyClient: AssemblyAI;

  constructor(private readonly configService: ConfigService) {
    this.assemblyClient = new AssemblyAI({
      apiKey: this.configService.get('assembly.apiKey'),
    });
  }

  async songToText(songUrl: string): Promise<string> {
    const transcript = await this.assemblyClient.transcripts.transcribe({
      audio: songUrl,
      speech_model: 'slam-1',
    });

    return formatSongText(transcript.text);
  }
}
