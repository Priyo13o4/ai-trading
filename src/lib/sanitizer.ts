import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param html - The HTML content to sanitize
 * @param options - Optional configuration for DOMPurify
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string, options?: {
  allowedTags?: string[];
  allowedAttributes?: string[];
  strict?: boolean;
}): string {
  const defaultConfig = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'i', 'b', 
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'div', 'span',
      'table', 'thead', 'tbody', 'tr', 'td', 'th'
    ],
    ALLOWED_ATTR: ['class', 'id'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'onblur', 'style']
  };

  // Apply stricter rules if strict mode is enabled
  if (options?.strict) {
    defaultConfig.ALLOWED_TAGS = ['p', 'br', 'strong', 'em'];
    defaultConfig.ALLOWED_ATTR = [];
  }

  // Override with custom options if provided
  if (options?.allowedTags) {
    defaultConfig.ALLOWED_TAGS = options.allowedTags;
  }
  
  if (options?.allowedAttributes) {
    defaultConfig.ALLOWED_ATTR = options.allowedAttributes;
  }

  return DOMPurify.sanitize(html, defaultConfig);
}

/**
 * Escapes HTML entities to prevent XSS
 * @param text - The text to escape
 * @returns HTML-escaped string
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Validates and sanitizes user input for safe display
 * @param input - User input to validate
 * @param maxLength - Maximum allowed length
 * @returns Sanitized and validated string
 */
export function validateAndSanitizeInput(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Truncate if too long
  const truncated = input.slice(0, maxLength);
  
  // Escape HTML entities
  return escapeHtml(truncated);
}
