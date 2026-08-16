import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'em', 'u', 's', 'b', 'i', 'code', 'pre', 'blockquote',
  'ul', 'ol', 'li', 'br', 'hr', 'a', 'img', 'table', 'thead',
  'tbody', 'tr', 'th', 'td',
];

export function sanitizeHtml(dirty?: string | null): string {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'title', 'colspan', 'rowspan',
    ],
    ALLOW_DATA_ATTR: false,
  });
}

export function safeUrl(url?: string | null): string {
  if (!url) return '';
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
  } catch {
    return '';
  }
  return '';
}
