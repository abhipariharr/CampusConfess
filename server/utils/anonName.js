const ADJECTIVES = [
  'Silent','Mystic','Shadow','Cosmic','Crystal','Electric','Phantom','Neon',
  'Astral','Ghost','Velvet','Blazing','Frozen','Hidden','Lunar','Solar',
  'Vivid','Hollow','Ember','Storm','Drift','Prism','Rogue','Serene',
  'Wild','Ancient','Digital','Crimson','Azure','Golden',
];

const ANIMALS = [
  'Tiger','Wolf','Fox','Eagle','Raven','Panther','Falcon','Viper','Lynx',
  'Hawk','Panda','Otter','Cobra','Owl','Bear','Jaguar','Crane','Hyena',
  'Manta','Gecko','Narwhal','Bison','Kestrel','Axolotl','Okapi','Quokka',
];

const CHAT_LABELS = [
  'Wandering Fox','Mystery Wolf','Silent Eagle','Neon Panda','Cosmic Otter',
  'Shadow Crane','Velvet Raven','Ghost Lynx','Ember Owl','Storm Hawk',
  'Prism Bear','Lunar Viper','Rogue Falcon','Azure Tiger','Golden Gecko',
];

async function generateAnonUsername(db) {
  let username;
  let unique = false;
  let attempts = 0;
  while (!unique && attempts < 20) {
    const adj    = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    const num    = Math.floor(Math.random() * 9000) + 1000;
    username     = `Anon${adj}${animal}${num}`;
    const [rows] = await db.query('SELECT id FROM users WHERE anon_username = ?', [username]);
    if (rows.length === 0) unique = true;
    attempts++;
  }
  return username;
}

function getChatLabel() {
  return CHAT_LABELS[Math.floor(Math.random() * CHAT_LABELS.length)];
}

module.exports = { generateAnonUsername, getChatLabel };
