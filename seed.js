require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./server/config/db');
const { generateAnonUsername } = require('./server/utils/anonName');

async function seed() {
  console.log('🌱 Seeding CampusConfess database...\n');

  // ─── Admin user ────────────────────────────────────────
  const adminHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@1234', 12);
  const [adminRows] = await db.query('SELECT id FROM users WHERE email = ?', [process.env.ADMIN_EMAIL]);
  let adminId;
  if (adminRows.length === 0) {
    const [r] = await db.query(
      'INSERT INTO users (email, password_hash, real_name, anon_username, role) VALUES (?,?,?,?,?)',
      [process.env.ADMIN_EMAIL || 'admin@campus.local', adminHash, process.env.ADMIN_REAL_NAME || 'Platform Admin', 'AnonAdmin0001', 'admin']
    );
    adminId = r.insertId;
    console.log('✅ Admin user created:', process.env.ADMIN_EMAIL);
  } else {
    adminId = adminRows[0].id;
    console.log('ℹ️  Admin user already exists, skipping.');
  }

  // ─── Demo users ────────────────────────────────────────
  const demoUsers = [
    { email: 'alice@demo.edu', name: 'Alice Johnson', interests: ['music', 'art', 'movies'] },
    { email: 'bob@demo.edu',   name: 'Bob Smith',     interests: ['gaming', 'tech', 'music'] },
    { email: 'carol@demo.edu', name: 'Carol Davis',   interests: ['books', 'art', 'travel'] },
    { email: 'dave@demo.edu',  name: 'Dave Wilson',   interests: ['sports', 'gaming', 'tech'] },
    { email: 'eve@demo.edu',   name: 'Eve Martinez',  interests: ['music', 'travel', 'books'] },
  ];

  const demoHash = await bcrypt.hash('Demo@1234', 12);
  const userIds = [];

  for (const u of demoUsers) {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [u.email]);
    if (existing.length === 0) {
      const anon = await generateAnonUsername(db);
      const colors = ['#7c3aed', '#06b6d4', '#ec4899', '#f59e0b', '#10b981'];
      const color  = colors[Math.floor(Math.random() * colors.length)];
      const [r] = await db.query(
        'INSERT INTO users (email, password_hash, real_name, anon_username, avatar_color) VALUES (?,?,?,?,?)',
        [u.email, demoHash, u.name, anon, color]
      );
      userIds.push(r.insertId);
      for (const interest of u.interests) {
        await db.query('INSERT IGNORE INTO user_interests (user_id, interest) VALUES (?,?)', [r.insertId, interest]);
      }
      console.log(`✅ Created demo user: ${anon} (${u.email})`);
    } else {
      userIds.push(existing[0].id);
      console.log(`ℹ️  ${u.email} already exists`);
    }
  }

  // ─── Demo confessions ──────────────────────────────────
  const confessions = [
    { content: 'I cried during the biology exam because I realized I actually understood everything for the first time in my life. Weird feeling.', tags: 'funny,study' },
    { content: 'I have a crush on someone in my CS class but they are so far out of my league it is almost funny 😭', tags: 'love,rant' },
    { content: 'Accidentally called my professor "mom" in front of the whole class. I need to transfer universities.', tags: 'funny,embarrassing' },
    { content: 'I have been pretending to understand calculus for two semesters. Nobody knows.', tags: 'study,rant' },
    { content: 'The library at midnight hits differently. There is something sacred about that silence.', tags: 'thoughts' },
    { content: 'Finished an assignment 10 minutes before the deadline after 3 all-nighters. The dopamine hit was unreal.', tags: 'study,funny' },
    { content: 'Sometimes I wonder if I chose the right major. Then I remember I chose it because the labs look cool.', tags: 'thoughts,rant' },
    { content: 'I volunteer at the campus food bank every Saturday. Never told anyone because I do not want it to seem performative.', tags: 'wholesome' },
  ];

  for (let i = 0; i < confessions.length; i++) {
    const uid = userIds[i % userIds.length];
    const [existing] = await db.query('SELECT id FROM confessions WHERE content = ?', [confessions[i].content]);
    if (existing.length === 0) {
      await db.query('INSERT INTO confessions (user_id, content, tags) VALUES (?,?,?)',
        [uid, confessions[i].content, confessions[i].tags]);
    }
  }
  console.log('✅ Demo confessions seeded');

  console.log('\n🎉 Seeding complete!\n');
  console.log('─────────────────────────────────────────────');
  console.log('Admin login:  admin@campus.local / Admin@1234');
  console.log('Demo logins:  alice@demo.edu / Demo@1234');
  console.log('─────────────────────────────────────────────\n');
  process.exit(0);
}

seed().catch(err => { console.error('Seed error:', err); process.exit(1); });
