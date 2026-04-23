const bcrypt = require('bcryptjs');

bcrypt.hash('NewPassword123', 12).then(hash => {
  console.log("HASH:", hash);
});