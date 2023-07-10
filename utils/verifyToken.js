const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;

// verify the token
const verifyToken = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }
  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Token is not valid." });
  }
};

// verify if user or Admin
const authenticateUser = (req, res, next) => {
  const { userId } = req.params;

  // Verify if the authenticated user is the same as the user being updated
  if (req.user.userId !== userId && !req.user.isAdmin) {
    return res
      .status(403)
      .json({ message: "Forbidden. Insufficient privileges." });
  }

  next();
};

// verify if user is an admin
const authenticateAdmin = (req, res, next) => {
  const { isAdmin } = req.user;

  if (!isAdmin) {
    return res
      .status(403)
      .json({ message: "Forbidden. Only admins can access this resource." });
  }

  next();
};

module.exports = {
  verifyToken,
  authenticateUser,
  authenticateAdmin,
};
