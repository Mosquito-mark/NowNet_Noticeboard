/**
 * Sanitizes text by removing URLs and emojis as per system requirements.
 */
export function sanitizeContent(text: string): string {
  // Remove URLs (basic regex for http/https/www)
  // We replace them with [REDACTED_URL] or just remove them.
  // The user said "remove ability to hyperlink", so removing the text entirely is safest.
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
  let sanitized = text.replace(urlRegex, '[URL_REMOVED]');

  // Remove emojis
  // This regex covers most common emoji ranges
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F191}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F171}\u{1F17E}-\u{1F17F}\u{1F18E}\u{3030}\u{2B50}\u{2B55}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{3297}\u{3299}\u{1F201}\u{1F202}\u{1F21A}\u{1F22F}\u{1F232}-\u{1F23A}\u{1F250}\u{1F251}\u{1F300}-\u{1F320}\u{1F32D}-\u{1F335}\u{1F337}-\u{1F37C}\u{1F37E}-\u{1F393}\u{1F3A0}-\u{1F3CA}\u{1F3CF}-\u{1F3D3}\u{1F3E0}-\u{1F3F0}\u{1F3F4}\u{1F3F8}-\u{1F43E}\u{1F440}\u{1F442}-\u{1F4FC}\u{1F4FF}-\u{1F53D}\u{1F54B}-\u{1F54E}\u{1F550}-\u{1F567}\u{1F57A}\u{1F595}-\u{1F596}\u{1F5A4}\u{1F5FB}-\u{1F64F}\u{1F680}-\u{1F6C5}\u{1F6CC}\u{1F6D0}-\u{1F6D2}\u{1F6D5}\u{1F6EB}-\u{1F6EC}\u{1F6F4}-\u{1F6FA}\u{1F7E0}-\u{1F7EB}\u{1F808}-\u{1F80B}\u{1F90D}-\u{1F971}\u{1F973}-\u{1F976}\u{1F97A}\u{1F97C}-\u{1F9A2}\u{1F9A5}-\u{1F9AA}\u{1F9AE}-\u{1F9CA}\u{1F9CD}-\u{1F9FF}\u{1FA70}-\u{1FA73}\u{1FA78}-\u{1FA7A}\u{1FA80}-\u{1FA82}\u{1FA90}-\u{1FA95}]/gu;
  sanitized = sanitized.replace(emojiRegex, '');

  return sanitized;
}
