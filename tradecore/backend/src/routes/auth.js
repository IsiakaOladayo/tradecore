const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../lib/db');
const logger  = require('../lib/logger');
const auth    = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, registration_no, email, password, country, sector, phone } = req.body;
    if (!name || !registration_no || !email || !password) {
      return res.status(400).json({ error: 'name, registration_no, email, and password are required' });
    }

    const exists = await db.query(
      'SELECT id FROM businesses WHERE email = $1 OR registration_no = $2',
      [email.toLowerCase(), registration_no]
    );
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'Account with this email or registration number already exists' });
    }

    const hash = await bcrypt.hash(password, 12);
    const result = await db.query(
      `INSERT INTO businesses (name, registration_no, email, password_hash, country, sector, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email, country, verified`,
      [name, registration_no, email.toLowerCase(), hash, country || 'Nigeria', sector, phone]
    );

    const business = result.rows[0];
    const token = jwt.sign(
      { businessId: business.id, email: business.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    logger.info('Business registered', { businessId: business.id, email });
    res.status(201).json({ token, business });
  } catch (err) { next(err); }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await db.query(
      'SELECT * FROM businesses WHERE email = $1',
      [email?.toLowerCase()]
    );

    const business = result.rows[0];
    const valid = business
      ? await bcrypt.compare(password, business.password_hash)
      : await bcrypt.compare(password, '$2a$12$invalidhash');

    if (!business || !valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { businessId: business.id, email: business.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    logger.info('Business login', { businessId: business.id });
    res.json({
      token,
      business: {
        id: business.id, name: business.name,
        email: business.email, country: business.country,
        sector: business.sector, verified: business.verified,
      }
    });
  } catch (err) { next(err); }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, country, sector, phone, verified, created_at FROM businesses WHERE id = $1',
      [req.business.businessId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Business not found' });
    res.json({ business: result.rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
