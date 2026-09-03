import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/store';

function badge(status) {
  const map = {
    SUBMITTED:    'bg-blue-100 text-blue-700',
    UNDER_REVIEW: 'bg-amber-100 text-amber-700',
    APPROVED:     'bg-green-100 text-green-700',
    DISBURSED:    'bg-purple-100 text-purple-700',
    REPAID:       'bg-teal-100 text-teal-700',
    DECLINED:     'bg-red-100 text-red-700',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    api('/api/requests')
      .then(d => { setRequests(d.requests); setTotal(d.total); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Finance Requests</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total requests</p>
        </div>
        <Link
          to="/invoices"
          className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          + Request finance
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading requests...</div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-red-500">{error}</div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500 mb-2">No finance requests yet.</p>
            <Link to="/invoices" className="text-sm text-green-600 hover:text-green-700">
              Upload an invoice to get started
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="text-left px-5 py-3 font-medium">Invoice</th>
                <th className="text-left px-5 py-3 font-medium">Debtor</th>
                <th className="text-right px-5 py-3 font-medium">Requested</th>
                <th className="text-right px-5 py-3 font-medium">Disbursed</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-gray-600">{req.invoice_number}</td>
                  <td className="px-5 py-3 font-medium text-gray-900">{req.debtor_name}</td>
                  <td className="px-5 py-3 text-right text-gray-700">
                    {req.currency} {parseFloat(req.requested_amount).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-700">
                    {req.disbursed_amount
                      ? `${req.currency} ${parseFloat(req.disbursed_amount).toLocaleString()}`
                      : '—'}
                  </td>
                  <td className="px-5 py-3">{badge(req.status)}</td>
                  <td className="px-5 py-3 text-gray-400">{new Date(req.submitted_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
