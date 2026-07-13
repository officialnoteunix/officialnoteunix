export function getThumbnailUrl(cloudinaryUrl: string | undefined): string | undefined {
  if (!cloudinaryUrl) return undefined;
  const isImagePath = cloudinaryUrl.includes('/image/upload/');
  const isRawPath = cloudinaryUrl.includes('/raw/upload/');
  if (!isImagePath && !isRawPath) return cloudinaryUrl;
  if (isRawPath || !cloudinaryUrl.endsWith('.pdf')) return cloudinaryUrl;
  return cloudinaryUrl
    .replace('/image/upload/', '/image/upload/w_120,h_140,c_fill/')
    .replace('.pdf', '.jpg');
}
