function sanitizeContent(text) {
  if (!text) return text;

  // 📧 Emails
  text = text.replace(
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    '[hidden email]'
  );

  // 📱 Phone numbers
  text = text.replace(
    /(?:\+91[- ]?)?[6-9]\d{9}\b/g,
    '[hidden number]'
  );

  // 🔗 Links
  text = text.replace(
    /(https?:\/\/[^\s]+)|(https\/\/[^\s]+)|(www\.[^\s]+)/gi,
    '[hidden link]'
  );

  return text;
}

module.exports = sanitizeContent;