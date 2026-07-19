const officeExts = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf', '.odt', '.ods', '.odp'];

export const officeTypes = new Set(['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'odt', 'ods', 'odp']);

export function isOfficeFile(fileType?: string): boolean {
  return fileType ? officeTypes.has(fileType.toLowerCase()) : false;
}

export function getThumbnailUrl(url: string | undefined, fileType?: string, thumbnailUrl?: string): string | undefined {
  if (thumbnailUrl) {
    return thumbnailUrl.replace('/upload/', '/upload/w_120,h_140,c_fill/');
  }
  if (!url) return undefined;
  if (officeExts.some(ext => url.toLowerCase().endsWith(ext))) {
    const base = url.includes('/raw/upload/')
      ? url.replace('/raw/upload/', '/image/upload/w_120,h_140,c_fill,f_pdf,pg_1/')
      : url.replace('/image/upload/', '/image/upload/w_120,h_140,c_fill,f_pdf,pg_1/');
    return base.replace(/\.\w+$/, '.jpg');
  }
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  if (imageExts.some(ext => url.endsWith(ext))) {
    return url.replace('/upload/', '/upload/w_120,h_140,c_fill/');
  }
  if (url.endsWith('.pdf') || fileType === 'pdf') {
    const base = url.includes('/raw/upload/')
      ? url.replace('/raw/upload/', '/image/upload/w_120,h_140,c_fill/')
      : url.replace('/image/upload/', '/image/upload/w_120,h_140,c_fill/');
    return base.replace('.pdf', '.jpg');
  }
  return undefined;
}

// Build a URL suitable for inline preview (iframe/embed) rather than download.
// For PDFs we append Cloudinary's `fl_inline` flag so the file is served with
// Content-Disposition: inline (otherwise bare PDF URLs prompt a download).
export function getPreviewUrl(url: string | undefined, fileType?: string): string | undefined {
  if (!url) return undefined;
  const ft = (fileType || '').toLowerCase();
  if (ft === 'pdf' || /\.pdf($|\?)/i.test(url)) {
    if (url.includes('/upload/') && !url.includes('fl_inline')) {
      return url.replace('/upload/', '/upload/fl_inline/');
    }
    return url;
  }
  if (isOfficeFile(ft)) {
    return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
  }
  return url;
}
