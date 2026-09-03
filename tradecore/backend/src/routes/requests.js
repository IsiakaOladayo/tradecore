const router = require('express').Router();
const db     = require('../lib/db');
const auth   = require('../middleware/auth');
const logger = require('../lib/logger');

const ADVANCE_RATE = 80.00; // % of invoice amount advanced
const FEE_RATE     = 2.50;  // % fee on the advanced amount

// GET /api/requests — list finance requests
router.get('/', auth, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT fr.*, i.invoice_number, i.debtor_name, i.amount AS invoice_amount, i.currency
      FROM finance_requests fr
      JOIN invoices i ON fr.invoice_id = i.id
      WHERE fr.business_id = $1
    `;
    const params = [req.business.businessId];

    if (status) {
      query += ` AND fr.status = $${params.length + 1}`;
      params.push(status.toUpperCase());
    }

    query += ` ORDER BY fr.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);
    const count  = await db.query(
      'SELECT COUNT(*) FROM finance_requests WHERE business_id = $1',
      [req.business.businessId]
    );

    res.json({ requests: result.rows, total: parseInt(count.rows[0].count), page: parseInt(page) });
  } catch (err) { next(err); }
});

// GET /api/requests/:id
router.get('/:id', auth, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT fr.*, i.invoice_number, i.debtor_name, i.amount AS invoice_amount, i.currency
       FROM finance_requests fr
       JOIN invoices i ON fr.invoice_id = i.id
       WHERE fr.id = $1 AND fr.business_id = $2`,
      [req.params.id, req.business.businessId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Finance request not found' });
    res.json({ request: result.rows[0] });
  } catch (err) { next(err); }
});

// POST /api/requests — submit a finance request against an invoice
router.post('/', auth, async (req, res, next) => {
  try {
    const { invoice_id, requested_amount } = req.body;
    if (!invoice_id || !requested_amount) {
      return res.status(400).json({ error: 'invoice_id and requested_amount are required' });
    }

    // Confirm invoice belongs to this business and is eligible
    const invoiceResult = await db.query(
      'SELECT * FROM invoices WHERE id = $1 AND business_id = $2',
      [invoice_id, req.business.businessId]
    );
    const invoice = invoiceResult.rows[0];
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (invoice.status !== 'PENDING') {
      return res.status(400).json({ error: `Invoice is ${invoice.status} and cannot be financed` });
    }

    // Check no existing open request for this invoice
    const existingResult = await db.query(
      `SELECT id FROM finance_requests
       WHERE invoice_id = $1 AND status NOT IN ('DECLINED','REPAID')`,
      [invoice_id]
    );
    if (existingResult.rows.length > 0) {
      return res.status(409).json({ error: 'An active finance request already exists for this invoice' });
    }

    const maxAdvance = (parseFloat(invoice.amount) * ADVANCE_RATE) / 100;
    if (parseFloat(requested_amount) > maxAdvance) {
      return res.status(400).json({
        error: `Maximum advance is ${ADVANCE_RATE}% of invoice value (${maxAdvance.toFixed(2)} ${invoice.currency})`
      });
    }

    const feeAmount      = (parseFloat(requested_amount) * FEE_RATE) / 100;
    const disbursedAmount = parseFloat(requested_amount) - feeAmount;

    const result = await db.query(
      `INSERT INTO finance_requests
         (invoice_id, business_id, requested_amount, advance_rate, fee_rate, fee_amount, disbursed_amount)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [invoice_id, req.business.businessId, requested_amount,
       ADVANCE_RATE, FEE_RATE, feeAmount.toFixed(2), disbursedAmount.toFixed(2)]
    );

    // Move invoice to UNDER_REVIEW
    await db.query(
      `UPDATE invoices SET status = 'UNDER_REVIEW', updated_at = NOW() WHERE id = $1`,
      [invoice_id]
    );

    await db.query(
      `INSERT INTO audit_log (business_id, action, resource, resource_id, metadata)
       VALUES ($1,'finance_request.submitted','finance_request',$2,$3)`,
      [req.business.businessId, result.rows[0].id, { requested_amount, fee_amount: feeAmount }]
    );

    logger.info('Finance request submitted', {
      businessId: req.business.businessId,
      requestId:  result.rows[0].id,
    });

    res.status(201).json({ request: result.rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
