const jwt = require("jsonwebtoken");
const UNAUTHORIZED_PATHS = require("../constants/publicPaths.js");
const ExpressError = require("../utils/expressError");

const authenticateToken = (req, res, next) => {
  const requestPath = req.path;
console.log("Authenticating request for path:", requestPath);
  // ✅ Allow if path matches or starts with any public path
  if (UNAUTHORIZED_PATHS.some((path) => requestPath.startsWith(path))) {
    return next();
  }

  // Allow Socket.IO polling/handshake HTTP requests to reach the Socket.IO server
  // Socket auth/verification is handled in the Socket.IO handshake itself (server-side)
  // Skip JWT enforcement for the polling path to avoid spurious "Invalid Session." logs
  // when socket clients connect (polling requests land on /socket.io/*).
  if (requestPath && requestPath.startsWith('/socket.io')) {
    return next();
  }

  const authHeader = req.header("Authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    throw new ExpressError("Invalid Session.", 403);
  }
    
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      throw new ExpressError("Invalid Session.", 403);
    }

    // Support tokens that use either `role` or `role_name` in the payload
    const roleName = decoded.role || decoded.role_name;
    req.user = {
      id: decoded.id,
      role_name: roleName,
      role: roleName,
    };

    next();
  });
};

module.exports = authenticateToken;
