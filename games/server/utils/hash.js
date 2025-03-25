const crypto = require('crypto');

function hashPassword(pw) {
 return new Promise((res) => {
  const hashed = crypto.createHash('sha256').update(pw).digest('hex');
  res(hashed);
 });
}

async function comparePassword(input, hash) {
 const inputHash = await hashPassword(input);
 return inputHash === hash;
}

module.exports = { hashPassword, comparePassword };
