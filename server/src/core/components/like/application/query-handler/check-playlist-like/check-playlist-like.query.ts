export class CheckPlaylistLikeQuery {
  constructor(
    public readonly userId: number,
    public readonly playlistId: number,
  ) {}
}
