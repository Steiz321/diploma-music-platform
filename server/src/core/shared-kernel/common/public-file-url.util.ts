// Public URL of a stored file: <PUBLIC_FILES_BASE_URL>/<key>
export const buildPublicFileUrl = (
  key: string,
  baseUrl: string = process.env.PUBLIC_FILES_BASE_URL ?? '',
): string => `${baseUrl.replace(/\/+$/, '')}/${key}`;
