const bcrypt = require("bcryptjs");

function verifyRoomPassword(room, password) {
  if (!room.passwordHash) return true;
  try {
    return bcrypt.compareSync(password || "", room.passwordHash);
  } catch (err) {
    console.error("Password verification error:", err.message);
    return false;
  }
}

function hashPassword(password) {
  try {
    return bcrypt.hashSync(password, 10);
  } catch (err) {
    console.error("Password hashing error:", err.message);
    return null;
  }
}

module.exports = { verifyRoomPassword, hashPassword };
