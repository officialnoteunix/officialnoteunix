const IS_PROD = process.env.NODE_ENV === 'production';

const MULTER_MESSAGES = {
  LIMIT_FILE_SIZE: 'File too large. Maximum size is 10 MB for PDFs and 5 MB for images.',
  LIMIT_UNEXPECTED_FILE: 'Unexpected file field.',
};

function sanitizeMessage(err) {
  if (IS_PROD) {
    if (err.status || err.statusCode) return err.message || 'Request failed';
    return 'Internal server error';
  }
  return err.message || 'Internal server error';
}

export default function errorHandler(err, req, res, next) {
  if (err.stack) console.error(err.stack);
  else console.error('Error:', err);

  if (err.name === 'SyntaxError' && err.status === 400 && 'body' in err) {
    return res.status(400).json({ success: false, message: 'Malformed JSON in request body' });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: `Invalid ${err.path}: ${err.value}` });
  }

  if (err.name === 'DocumentNotFoundError') {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  if (err.name === 'ValidationError') {
    const errors = {};
    if (err.errors) {
      for (const [field, detail] of Object.entries(err.errors)) {
        errors[field] = detail.message;
      }
    }
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    const value = err.keyValue?.[field];
    const msg = field
      ? `${field.charAt(0).toUpperCase() + field.slice(1)} "${value}" is already taken`
      : 'Duplicate entry';
    return res.status(409).json({ success: false, message: msg });
  }

  if (err.name === 'MulterError') {
    const msg = MULTER_MESSAGES[err.code] || `Upload error: ${err.message}`;
    return res.status(400).json({ success: false, message: msg });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
  }
  if (err.name === 'NotBeforeError') {
    return res.status(401).json({ success: false, message: 'Token not yet valid' });
  }

  const status = err.status || err.statusCode || 500;
  const message = sanitizeMessage(err);

  res.status(status).json({ success: false, message });
}
