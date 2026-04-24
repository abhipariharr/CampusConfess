const bcrypt = require('bcryptjs');

bcrypt.hash('Admin@1234', 12).then(hash => {
  console.log("HASH:", hash);
});