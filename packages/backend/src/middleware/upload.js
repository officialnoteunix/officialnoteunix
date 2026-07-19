import multer from 'multer';
import { MAX_FILE_SIZE, MAX_IMAGE_SIZE } from '../utils/constants.js';

const storage = multer.memoryStorage();

const PDF_MAGIC = Buffer.from([0x25, 0x50, 0x44, 0x46]);
const IMAGE_MAGICS = {
  jpeg: Buffer.from([0xff, 0xd8, 0xff]),
  png: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
  gif: Buffer.from([0x47, 0x49, 0x46, 0x38]),
  webp: Buffer.from([0x52, 0x49, 0x46, 0x46]),
};

function startsWithMagic(buffer, magic) {
  return buffer.length >= magic.length && buffer.subarray(0, magic.length).equals(magic);
}

export function validatePdfBuffer(buffer) {
  return startsWithMagic(buffer, PDF_MAGIC);
}

export function validateImageBuffer(buffer, mimetype) {
  const type = mimetype.split('/')[1]?.toLowerCase();
  if (type === 'jpeg' || type === 'jpg') return startsWithMagic(buffer, IMAGE_MAGICS.jpeg);
  if (type === 'png') return startsWithMagic(buffer, IMAGE_MAGICS.png);
  if (type === 'gif') return startsWithMagic(buffer, IMAGE_MAGICS.gif);
  if (type === 'webp') return startsWithMagic(buffer, IMAGE_MAGICS.webp);
  return false;
}

const ALLOWED_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/rtf',
  'application/rtf',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.presentation',
  'application/vnd.oasis.opendocument.spreadsheet',
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
];

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_MIMES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
const ALLOWED_MEDIA_MIMES = [...ALLOWED_IMAGE_MIMES, ...ALLOWED_VIDEO_MIMES];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error('Unsupported file type. Allowed: PDF, DOCX, PPTX, XLSX, TXT, RTF, ODF, images');
    err.status = 400;
    cb(err, false);
  }
};

const imageFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, GIF, or WebP images are allowed'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

export const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: MAX_IMAGE_SIZE },
});

export const uploadMedia = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MEDIA_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM, OGG, MOV) are allowed'), false);
    }
  },
  limits: { fileSize: MAX_FILE_SIZE },
});
