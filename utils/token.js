const jwt = require("jsonwebtoken");

const generateToken = (savedUser) => {
  return jwt.sign(
    { userId: savedUser._id, isAdmin: savedUser.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: "3d" }
  );
};

const generateResetToken = (payload, secret) => {
  return jwt.sign({ userId: payload.userId, email: payload.email }, secret, {
    expiresIn: "15m",
  });
};

module.exports = { generateToken, generateResetToken };
