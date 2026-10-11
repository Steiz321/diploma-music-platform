import { ApiProperty } from '@nestjs/swagger';

class TastePreferenceDto {
  @ApiProperty({ example: 'mood:calm', description: '"group:value" tag' })
  key: string;

  @ApiProperty({ example: 0.8, description: 'weight of the tag, above 0' })
  value: number;
}

class UserTasteDto {
  @ApiProperty({ type: [TastePreferenceDto] })
  moods: TastePreferenceDto[];

  @ApiProperty({ type: [TastePreferenceDto] })
  topics: TastePreferenceDto[];
}

export class GetUserTasteResponse {
  @ApiProperty({
    type: UserTasteDto,
    nullable: true,
    description:
      'null: no listening history yet, or the Recommendations service did not answer in time',
  })
  taste: UserTasteDto | null;
}
