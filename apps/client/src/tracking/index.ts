import { API_URL } from "../api/client";
import { createHttpSender, Tracker } from "./tracker";

export type { PlaybackSource, PlaybackEventType } from "./tracker";

/** The app-wide tracker; started once in main.tsx. */
export const tracker = new Tracker({
  send: createHttpSender(API_URL, () => localStorage.getItem("token")),
});
