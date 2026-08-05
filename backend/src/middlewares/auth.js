import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'SACH_Kavach_2026';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ error: "Missing identity token" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Session expired or invalid signature" });
    }
    req.user = user;
    next();
  });
};
