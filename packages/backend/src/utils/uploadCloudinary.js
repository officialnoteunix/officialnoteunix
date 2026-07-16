import cloudinary from '../config/cloudinary.js';
import { MIME_TO_EXT } from './constants.js';

export function uploadBuffer(buffer, options = {}) {
  const { folder = 'noteunix/notes', resourceType = 'auto' } = options;
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resourceType },
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

export async function uploadFiles(uploadedFiles, folder = 'noteunix/notes') {
  for (const f of uploadedFiles) {
    const isImage = f.mimetype?.startsWith('image/');
    const isArchive = ['application/zip', 'application/x-zip-compressed', 'application/x-7z-compressed', 'application/x-rar-compressed'].includes(f.mimetype);
    if (isArchive) {
      const err = new Error(`"${f.originalname}" is a compressed archive. Please upload the uncompressed file directly (PDF, DOCX, etc.)`);
      err.status = 400;
      throw err;
    }
  }
  return Promise.all(uploadedFiles.map(async (f) => {
    const isImage = f.mimetype?.startsWith('image/');
    const result = await uploadBuffer(f.buffer, { folder, resourceType: isImage ? 'auto' : 'raw' });
    return {
      url: result.secure_url,
      fileType: MIME_TO_EXT[f.mimetype] || 'bin',
      fileSize: f.size,
      publicId: result.public_id || '',
    };
  }));
}

export async function uploadThumbnail(buffer) {
  const result = await uploadBuffer(buffer, { folder: 'noteunix/thumbnails', resourceType: 'image' });
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
