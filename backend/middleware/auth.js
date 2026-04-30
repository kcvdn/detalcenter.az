const { parseAuthToken } = require("../lib/token");

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token is required" });
  }

  const token = authHeader.slice("Bearer ".length).trim();
  const decoded = parseAuthToken(token);

  if (!decoded) {
    return res.status(401).json({ error: "Token is invalid" });
  }

  req.user = decoded;
  next();
};

const role = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }

    next();
  };
};

module.exports = {
  auth,
  role,
};
