const router = require('express').Router();
const db     = require('../lib/db');
const auth   = require('../middleware/auth');

// GET /api/dashboard — summary stats for the logged-in business
router.get('/', auth, async (req, res, next) => {
  try {
    const bId = req.business.businessId;

    const [invoices, requests, transactions, recent] = await Promise.all([
      db.query(
        `SELECT status, COUNT(*) as count, COALESCE(SUM(amount),0) as total
         FROM invoices WHERE business_id = $1 GROUP BY status`, [bId]
      ),
      db.query(
        `SELECT status, COUNT(*) as count, COALESCE(SUM(requested_amount),0) as total
         FROM finance_requests WHERE business_id = $1 GROUP BY status`, [bId]
      ),
      db.query(
        `SELECT COALESCE(SUM(CASE WHEN type='DISBURSEMENT' THEN amount ELSE 0 END),0) AS total_disbursed,
                COALESCE(SUM(CASE WHEN type='REPAYMENT'    THEN amount ELSE 0 END),0) AS total_repaid
         FROM transactions WHERE business_id = $1`, [bId]
      ),
      db.query(
        `SELECT i.invoice_number, i.debtor_name, i.amount, i.currency, i.status, i.created_at
         FROM invoices i WHERE i.business_id = $1
         ORDER BY i.created_at DESC LIMIT 5`, [bId]
      ),
    ]);

    res.json({
      invoices:     invoices.rows,
      requests:     requests.rows,
      transactions: transactions.rows[0],
      recent_invoices: recent.rows,
    });
  } catch (err) { next(err); }
});

module.exports = router;
