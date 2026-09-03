import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/store';

const ADVANCE_RATE = 0.80;
const FEE_RATE     = 0.025;

export default function NewRequest() {
  const [params]  = useSearchParams();
  const navigate  = useNavigate();

  const invoiceId     = params.get('invoice_id')     || '';
  const invoiceAmount = parseFloat(params.get('amount') || '0');
  const invoiceNumber = params.get('invoice_number') || '';
  const maxAdvance    = invoiceAmount * ADVANCE_RATE;

  const [amount, setAmount]   = useState(maxAdvance.toFixed(2));
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const requested  = parseFloat(amount) || 0;
  const fee        = requested * FEE_RATE;
  const disbursed  = requested - fee;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (requested > maxAdvance) {
      return setError(`Maximum you can request is ₦${maxAdvance.toLocaleString()}`);
    }
    setLoading(true);
    try {
      await api('/api/requests', {
        method: 'POST',
        body:   JSON.stringify({ invoice_id: invoiceId, requested_amount: requested }),
      });
      navigate('/requests');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <Link to="/invoices" className="text-sm text-gray-500 hover:text-gray-700">← Back to invoices</Link>
        <h1 className="text-xl font-semibold text-gray-900 mt-3">Request finance</h1>
        <p className="text-sm text-gray-500 mt-0.5">Get an advance against your invoice</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 font-medium mb-1">Invoice</p>
          <p className="text-sm font-medium text-gray-900">{invoiceNumber}</p>
          <p className="text-sm text-gray-500">Value: NGN {invoiceAmount.toLocaleString()}</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount to request (max NGN {maxAdvance.toLocaleString()})
            </label>
            <input
              required type="number" min="1" max={maxAdvance} step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-400 mt-1">Maximum is 80% of the invoice value</p>
          </div>

          {requested > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
              <p className="text-xs font-medium text-green-800">Finance breakdown</p>
              <div className="space-y-1 text-sm text-green-700">
                <div className="flex justify-between">
                  <span>Requested amount</span>
                  <span>NGN {requested.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Processing fee (2.5%)</span>
                  <span className="text-red-600">- NGN {fee.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-green-200 pt-2 mt-2">
                  <span>You receive</span>
                  <span>NGN {disbursed.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit" disabled={loading || !invoiceId}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit request'}
            </button>
            <Link
              to="/invoices"
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
