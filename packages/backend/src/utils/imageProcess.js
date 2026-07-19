import sharp from 'sharp';

const MAX_DIMENSION = 2000;
const WEBP_QUALITY = 82;
const THUMB_SIZE = 400;

// Resize (if larger) and re-encode an image buffer to compressed WebP.
export async function compressImageBuffer(buffer, { maxDimension = MAX_DIMENSION, quality = WEBP_QUALITY } = {}) {
  const image = sharp(buffer, { failOn: 'none' });
  const metadata = await image.metadata();
  const resizeOpts = {};
  if (metadata.width && metadata.width > maxDimension) resizeOpts.width = maxDimension;
  if (metadata.height && metadata.height > maxDimension) resizeOpts.height = maxDimension;
  return image
    .rotate()
    .resize(resizeOpts)
    .webp({ quality, effort: 4 })
    .toBuffer();
}

// Produce a small square-ish thumbnail buffer.
export async function makeThumbnailBuffer(buffer, size = THUMB_SIZE) {
  return sharp(buffer, { failOn: 'none' })
    .rotate()
    .resize(size, size, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80, effort: 4 })
    .toBuffer();
}

// Returns true if a buffer looks like a decodable raster image.
export async function isProcessableImage(buffer) {
  try {
    const meta = await sharp(buffer, { failOn: 'none' }).metadata();
    return !!meta.format;
  } catch {
    return false;
  }
}
