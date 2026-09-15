const jwt = require('jsonwebtoken');

/**
 * Exige un utilisateur connecté. Rejette avec 401 sinon.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Connexion requise.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, username: payload.username };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session invalide ou expirée.' });
  }
}

/**
 * Attache req.user si un token valide est présent, mais n'exige rien.
 * Utile pour les routes de consultation (accessibles sans compte).
 */
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: payload.sub, username: payload.username };
    } catch (err) {
      // Token invalide : on continue simplement sans utilisateur connecté
    }
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
