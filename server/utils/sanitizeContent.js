function sanitizeContent(text) {
  if (!text) return text;

  // 📧 Emails
  text = text.replace(
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    '[Sharig emails are not allowed. let it be Anonymous please]'
  );

  // 📱 Phone numbers
  text = text.replace(
    /(?:\+91[- ]?)?[6-9]\d{9}\b/g,
    '[Sharig number are not allowed. let it be Anonymous please]'
  );

  // 🔗 Links
  text = text.replace(
    /(https?:\/\/[^\s]+)|(https\/\/[^\s]+)|(www\.[^\s]+)/gi,
    '[Sharig Links are not allowed. let it be Anonymous please]'
  );

// 🔗 Hide common links/domains
text = text.replace(
  /\b\S+\.(com|in|net|org|gg|me|io)\b/gi,
  '[Sharig Links are not allowed. let it be Anonymous please]'
);

  return text;
}

module.exports = sanitizeContent;