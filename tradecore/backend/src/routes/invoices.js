const router = require('express').Router();
const db     = require('../lib/db');
const auth   = require('../middleware/auth');
const logger = require('../lib/logger');

// GET /api/invoices — list business invoices
router.get('/', auth, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM invoices WHERE business_id = $1';
    const params = [req.business.businessId];

    if (status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(status.toUpperCase());
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);
    const count  = await db.query(
      'SELECT COUNT(*) FROM invoices WHERE business_id = $1',
      [req.business.businessId]
    );

    res.json({ invoices: result.rows, total: parseInt(count.rows[0].count), page: parseInt(page) });
  } catch (err) { next(err); }
});

// GET /api/invoices/:id
router.get('/:id', auth, async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT * FROM invoices WHERE id = $1 AND business_id = $2',
      [req.params.id, req.business.businessId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ invoice: result.rows[0] });
  } catch (err) { next(err); }
});

// POST /api/invoices
router.post('/', auth, async (req, res, next) => {
  try {
    const { invoice_number, debtor_name, debtor_email, amount, currency, due_date, description } = req.body;

    if (!invoice_number || !debtor_name || !amount || !due_date) {
      return res.status(400).json({ error: 'invoice_number, debtor_name, amount, and due_date are required' });
    }
    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than zero' });
    }

    const result = await db.query(
      `INSERT INTO invoices (business_id, invoice_number, debtor_name, debtor_email, amount, currency, due_date, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.business.businessId, invoice_number, debtor_name, debtor_email,
       amount, currency || 'NGN', due_date, description]
    );

    await db.query(
      `INSERT INTO audit_log (business_id, action, resource, resource_id, metadata)
       VALUES ($1, 'invoice.created', 'invoice', $2, $3)`,
      [req.business.businessId, result.rows[0].id, { invoice_number, amount }]
    );

    logger.info('Invoice created', { businessId: req.business.businessId, invoiceId: result.rows[0].id });
    res.status(201).json({ invoice: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Invoice number already exists for this business' });
    }
    next(err);
  }
});

// PATCH /api/invoices/:id/status — internal use only in this MVP
router.patch('/:id/status', auth, async (req, res, next) => {
  try {
    const validStatuses = ['PENDING','UNDER_REVIEW','APPROVED','FUNDED','REPAID','REJECTED'];
    const { status } = req.body;
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Valid values: ${validStatuses.join(', ')}` });
    }

    const result = await db.query(
      `UPDATE invoices SET status = $1, updated_at = NOW()
       WHERE id = $2 AND business_id = $3 RETURNING *`,
      [status, req.params.id, req.business.businessId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Invoice not found' });

    res.json({ invoice: result.rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
