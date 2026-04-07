const BAD_WORDS = [
  'fuck','shit','bitch','asshole','cunt','dick','pussy','bastard',
  'nigger','faggot','retard','whore','slut','rape','kill yourself',
  'kys','go die','hate you','stupid idiot',
];

function containsBadWords(text) {
  const lower = text.toLowerCase();
  return BAD_WORDS.some(word => lower.includes(word));
}

function filterBadWords(text) {
  let filtered = text;
  const lower  = text.toLowerCase();
  BAD_WORDS.forEach(word => {
    if (lower.includes(word)) {
      const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      filtered = filtered.replace(regex, '*'.repeat(word.length));
    }
  });
  return filtered;
}

module.exports = { containsBadWords, filterBadWords };
