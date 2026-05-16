function sanitizeContent(text) {
    if(!text) return text;

    // hide email
    text = text.replace(
        /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    '[Sharing email is not allowed, Let it be fun without it.]'
    );

    // hide phone number
    text = text.replace(
        /(?:\+91[- ]?)?[6-9]\d{9}\b/g,
    '[Sharing number is not allowed, Let it be fun without it.]'
    );

    // hide url
    text = text.replace(
        /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi,
    '[Sharing link is not allowed, Let it be fun without it.]'
    );

    return text;
}
module.exports = sanitizeContent;