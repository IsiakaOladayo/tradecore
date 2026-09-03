import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/store';

export default function NewInvoice() {
  const [form, setForm] = useState({
    invoice_number: '', debtor_name: '', debtor_email: '',
    amount: '', currency: 'NGN', due_date: '', description: '',
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function set(key) {
    return e => setForm(f => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api('/api/invoices', {
        method: 'POST',
        body:   JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      });
      navigate('/invoices');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link to="/invoices" className="text-sm text-gray-500 hover:text-gray-700">← Back to invoices</Link>
        <h1 className="text-xl font-semibold text-gray-900 mt-3">Upload new invoice</h1>
        <p className="text-sm text-gray-500 mt-0.5">Add an invoice to request finance against</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice number <span className="text-red-500">*</span></label>
              <input
                required value={form.invoice_number} onChange={set('invoice_number')}
                placeholder="INV-2024-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due date <span className="text-red-500">*</span></label>
              <input
                required type="date" value={form.due_date} onChange={set('due_date')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Debtor name <span className="text-red-500">*</span></label>
            <input
              required value={form.debtor_name} onChange={set('debtor_name')}
              placeholder="Company or individual who owes you"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Debtor email</label>
            <input
              type="email" value={form.debtor_email} onChange={set('debtor_email')}
              placeholder="accounts@debtor.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice amount <span className="text-red-500">*</span></label>
              <input
                required type="number" min="1" step="0.01"
                value={form.amount} onChange={set('amount')}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={form.currency} onChange={set('currency')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {['NGN','GHS','KES','USD'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3} value={form.description} onChange={set('description')}
              placeholder="What goods or services does this invoice cover?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          {form.amount && parseFloat(form.amount) > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs font-medium text-green-800 mb-1">Finance estimate</p>
              <p className="text-sm text-green-700">
                You can request up to <strong>{form.currency} {(parseFloat(form.amount) * 0.8).toLocaleString()}</strong> (80% advance rate)
              </p>
              <p className="text-xs text-green-600 mt-1">2.5% fee applies on the advanced amount</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit" disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Uploading...' : 'Upload invoice'}
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
