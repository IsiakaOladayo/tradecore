import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/store';

function badge(status) {
  const map = {
    PENDING:      'bg-gray-100 text-gray-600',
    UNDER_REVIEW: 'bg-blue-100 text-blue-700',
    APPROVED:     'bg-green-100 text-green-700',
    FUNDED:       'bg-purple-100 text-purple-700',
    REPAID:       'bg-teal-100 text-teal-700',
    REJECTED:     'bg-red-100 text-red-700',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [filter, setFilter]     = useState('');

  useEffect(() => {
    setLoading(true);
    const q = filter ? `?status=${filter}` : '';
    api(`/api/invoices${q}`)
      .then(d => { setInvoices(d.invoices); setTotal(d.total); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [filter]);

  const statuses = ['', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'FUNDED', 'REPAID', 'REJECTED'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total invoices</p>
        </div>
        <Link
          to="/invoices/new"
          className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          + New Invoice
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              filter === s
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading invoices...</div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-red-500">{error}</div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500 mb-2">No invoices found.</p>
            <Link to="/invoices/new" className="text-sm text-green-600 hover:text-green-700">Upload your first invoice</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="text-left px-5 py-3 font-medium">Invoice #</th>
                <th className="text-left px-5 py-3 font-medium">Debtor</th>
                <th className="text-right px-5 py-3 font-medium">Amount</th>
                <th className="text-left px-5 py-3 font-medium">Due date</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-gray-600">{inv.invoice_number}</td>
                  <td className="px-5 py-3 font-medium text-gray-900">{inv.debtor_name}</td>
                  <td className="px-5 py-3 text-right text-gray-700">
                    {inv.currency} {parseFloat(inv.amount).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-gray-500">{new Date(inv.due_date).toLocaleDateString()}</td>
                  <td className="px-5 py-3">{badge(inv.status)}</td>
                  <td className="px-5 py-3">
                    {inv.status === 'PENDING' && (
                      <Link
                        to={`/requests/new?invoice_id=${inv.id}&amount=${inv.amount}&invoice_number=${inv.invoice_number}`}
                        className="text-xs text-green-600 hover:text-green-700 font-medium"
                      >
                        Request finance
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
