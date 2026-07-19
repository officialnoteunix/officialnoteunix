import sanitizeHtml from 'sanitize-html';

// Strip ALL HTML — used for user-generated plain-text fields (note titles/descriptions,
// comments, contact messages). Prevents stored XSS if the client ever renders them as HTML.
export function sanitizeText(value) {
  if (typeof value !== 'string') return value;
  return sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  }).trim();
}

// Allow a safe subset of formatting tags — used for admin broadcast emails only.
export function sanitizeRichHtml(value) {
  if (typeof value !== 'string') return value;
  return sanitizeHtml(value, {
    allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'span', 'div'],
    allowedAttributes: { a: ['href', 'target', 'rel'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' }),
    },
  });
}
