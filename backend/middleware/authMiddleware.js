// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }

  if (!token) {
    return res.status(401).json({ msg: 'No hay token, autorización denegada' });
  }
  
  // Limpia comillas si el token las tuviera
  if (token.startsWith('"') && token.endsWith('"')) {
    token = token.replace(/^"|"$/g, '');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // CORRECCIÓN CLAVE: Asignamos el objeto `user` del payload a `req.user`.
    // Esto asegura que `req.user.username` esté siempre disponible.
    req.user = decoded.user;

    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token no es válido' });
  }
};