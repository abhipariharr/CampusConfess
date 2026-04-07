const db = require('../config/db');

const MatchModel = {
  // Jaccard similarity: |A ∩ B| / |A ∪ B|
  jaccardSimilarity(a, b) {
    const setA = new Set(a);
    const setB = new Set(b);
    const intersection = [...setA].filter(x => setB.has(x));
    const union = new Set([...setA, ...setB]);
    return union.size === 0 ? 0 : intersection.length / union.size;
  },

  async computeMatches(userId) {
    // Get current user's interests
    const myInterests = await db.query(
      'SELECT interest FROM user_interests WHERE user_id = ?', [userId]
    ).then(([rows]) => rows.map(r => r.interest));

    // Get all other active users with interests
    const [others] = await db.query(
      `SELECT u.id, u.anon_username, u.avatar_color, u.bio,
              GROUP_CONCAT(ui.interest) AS interests
       FROM users u
       LEFT JOIN user_interests ui ON u.id = ui.user_id
       WHERE u.id != ? AND u.is_banned = 0
       GROUP BY u.id
       HAVING interests IS NOT NULL`,
      [userId]
    );

    const matches = others.map(user => {
      const theirInterests = user.interests ? user.interests.split(',') : [];
      const score = this.jaccardSimilarity(myInterests, theirInterests);
      const common = myInterests.filter(i => theirInterests.includes(i));
      return {
        userId:        user.id,
        anonUsername:  user.anon_username,
        avatarColor:   user.avatar_color,
        bio:           user.bio,
        score:         Math.round(score * 100),
        commonInterests: common,
        theirInterests,
      };
    });

    return matches
      .filter(m => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  },
};

module.exports = MatchModel;
