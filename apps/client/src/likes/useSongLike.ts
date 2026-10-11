import { useSyncExternalStore } from "react";
import songApi from "../api/song";
import { likeStore } from "./likeStore";

/**
 * Like state of any song, the same in every view; re-renders on every like.
 * `serverValue` is the song's is_liked.
 */
export function useLikes() {
  useSyncExternalStore(likeStore.subscribe, likeStore.version);

  const toggle = async (songId: number, serverValue: boolean) => {
    try {
      await likeStore.toggle(songId, serverValue, () =>
        songApi.likeSong(songId)
      );
    } catch (error) {
      console.error("Error liking song:", error);
    }
  };

  return {
    isLiked: likeStore.isLiked,
    isLiking: likeStore.isPending,
    toggle,
  };
}

/** Like state of one song (null: no song, e.g. nothing is playing) */
export function useSongLike(songId: number | null, serverValue: boolean) {
  const likes = useLikes();
  return {
    isLiked: songId !== null && likes.isLiked(songId, serverValue),
    isLiking: songId !== null && likes.isLiking(songId),
    toggle: () => (songId === null ? undefined : likes.toggle(songId, serverValue)),
  };
}
