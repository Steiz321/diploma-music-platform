export const formatSongText = (text: string) => {
  return text.replace(/([.?!])\s+/g, '$1\n');
};
