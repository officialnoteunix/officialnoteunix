import multer from 'multer';

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
  return true;
}

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const imageFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
