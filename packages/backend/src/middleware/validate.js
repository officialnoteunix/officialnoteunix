import { sanitizeText } from '../utils/sanitize.js';

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        if (!errors[path]) errors[path] = [];
        errors[path].push(issue.message);
      }
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    req.validatedBody = result.data;
    next();
  };
}

// Strip HTML from the given string fields on req.body (defense against stored XSS).
// Apply BEFORE validate() so schemas operate on cleaned input.
export function sanitizeTextFields(...fields) {
  return (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      for (const field of fields) {
        if (typeof req.body[field] === 'string') {
          req.body[field] = sanitizeText(req.body[field]);
        }
      }
    }
    next();
  };
}

