const jwt = require('jsonwebtoken');

const ISSUER = 'tradecore-api';
const AUDIENCE = 'tradecore-web';
const EXPIRES_IN = '24h';

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    issuer: ISSUER,
    audience: AUDIENCE,
    expiresIn: EXPIRES_IN,
  });
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET, {
    algorithms: ['HS256'],
    issuer: ISSUER,
    audience: AUDIENCE,
  });
}

module.exports = { signToken, verifyToken, ISSUER, AUDIENCE, EXPIRES_IN };
