import { PartialType } from '@nestjs/swagger';
import { CreatePlaylistRequest } from './create-playlist.request';

export class UpdatePlaylistRequest extends PartialType(CreatePlaylistRequest) {}
