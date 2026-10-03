export class CheckSongLikeQuery {
  constructor(
    public readonly userId: number,
    public readonly songId: number,
  ) {}
}
