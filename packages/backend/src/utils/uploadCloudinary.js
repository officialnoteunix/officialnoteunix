import cloudinary from '../config/cloudinary.js';
import { MIME_TO_EXT } from './constants.js';
import { compressImageBuffer, makeThumbnailBuffer, isProcessableImage } from './imageProcess.js';

export function uploadBuffer(buffer, options = {}) {
  const { folder = 'noteunix/notes', resourceType = 'auto', transformation } = options;
  const uploadOptions = { folder, resource_type: resourceType };
  // NOTE: `format`/`quality` are delivery (transformation) params, not valid as
  // raw upload options. Passing `format: 'auto'` on upload (esp. for PDF/raw files
  // with resource_type 'auto') causes "Invalid extension in transformation: auto".
  // Optimization (f_auto,q_auto) is applied at delivery time via the URL instead.
  if (transformation) uploadOptions.transformation = transformation;
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (err, result) => {
        if (err) {
          const e = new Error(err.message || 'Cloudinary upload failed');
          e.status = err.http_code || 500;
          return reject(e);
        }
        resolve(result);
      }
    );
    stream.on('error', (err) => {
      const e = new Error(err.message || 'Cloudinary stream error');
      e.status = 500;
      reject(e);
    });
    stream.end(buffer);
  });
}

// Append Cloudinary auto-optimization segments (f_auto,q_auto) to an image delivery URL.
// Only safe for image resources; raw (PDF/doc) URLs are returned unchanged.
export function optimizeImageUrl(url) {
  if (!url || !/image\/upload\//.test(url)) return url;
  if (url.includes('/upload/f_auto')) return url;
  return url.replace('/upload/', '/upload/f_auto,q_auto/');
}

export async function uploadFiles(uploadedFiles, folder = 'noteunix/notes') {
  for (const f of uploadedFiles) {
    const isArchive = ['application/zip', 'application/x-zip-compressed', 'application/x-7z-compressed', 'application/x-rar-compressed'].includes(f.mimetype);
    if (isArchive) {
      const err = new Error(`"${f.originalname}" is a compressed archive. Please upload the uncompressed file directly (PDF, DOCX, etc.)`);
      err.status = 400;
      throw err;
    }
  }
  return Promise.all(uploadedFiles.map(async (f) => {
    const isImage = f.mimetype?.startsWith('image/');
    let buffer = f.buffer;
    let fileType = MIME_TO_EXT[f.mimetype] || 'bin';
    let size = f.size;
    if (isImage && (await isProcessableImage(f.buffer))) {
      try {
        buffer = await compressImageBuffer(f.buffer);
        fileType = 'webp';
        size = buffer.length;
      } catch {
        // Fall back to original buffer if sharp fails.
        buffer = f.buffer;
      }
    }
    const result = await uploadBuffer(buffer, { folder, resourceType: isImage ? 'auto' : 'raw' });
    return {
      url: isImage ? optimizeImageUrl(result.secure_url) : result.secure_url,
      fileType,
      fileSize: size,
      publicId: result.public_id || '',
    };
  }));
}

export async function uploadThumbnail(buffer) {
  let thumb = buffer;
  if (await isProcessableImage(buffer)) {
    try {
      thumb = await makeThumbnailBuffer(buffer);
    } catch {
      thumb = buffer;
    }
  }
  const result = await uploadBuffer(thumb, {
    folder: 'noteunix/thumbnails',
    resourceType: 'image',
    transformation: [{ width: 400, height: 400, crop: 'limit', fetch_format: 'auto', quality: 'auto' }],
  });
  return result.secure_url;
}

export async function deleteFile(publicId) {
  await cloudinary.uploader.destroy(publicId);
}

export async function deleteNoteFiles(note) {
  const urls = [];
  if (note.files?.length) note.files.forEach(f => { if (f.url) urls.push(f.url); });
  if (note.thumbnailUrl) urls.push(note.thumbnailUrl);
  await Promise.all(urls.map(url => {
    const publicId = extractPublicId(url);
    return publicId ? deleteFile(publicId).catch(() => {}) : Promise.resolve();
  }));
}

export function extractPublicId(fileUrl) {
  const parts = fileUrl.split('/upload/');
  if (parts[1]) {
    return parts[1].replace(/\.[^.]+$/, '');
  }
  return null;
}
