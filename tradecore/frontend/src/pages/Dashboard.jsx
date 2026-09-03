import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/store';

function StatCard({ label, value, sub, color = 'green' }) {
  const colors = {
    green:  'bg-green-50 text-green-700 border-green-200',
    blue:   'bg-blue-50 text-blue-700 border-blue-200',
    amber:  'bg-amber-50 text-amber-700 border-amber-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
      {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
    </div>
  );
}

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

export default function Dashboard() {
  const [data, setData]     = useState(null);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/api/dashboard')
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-sm text-gray-500 mt-8 text-center">Loading dashboard...</div>;
  if (error)   return <div className="text-sm text-red-500 mt-8 text-center">{error}</div>;

  const invoiceTotal  = data.invoices.reduce((s, r) => s + parseFloat(r.total), 0);
  const invoiceCount  = data.invoices.reduce((s, r) => s + parseInt(r.count), 0);
  const activeRequest = data.requests.find(r => r.status === 'DISBURSED');
  const totalDisbursed = parseFloat(data.transactions?.total_disbursed || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your invoice finance overview</p>
        </div>
        <Link
          to="/invoices/new"
          className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          + New Invoice
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total invoices"    value={invoiceCount}                             sub={`₦${invoiceTotal.toLocaleString()} total value`} color="green"  />
        <StatCard label="Total disbursed"   value={`₦${totalDisbursed.toLocaleString()}`}   sub="across all finance requests"                     color="blue"   />
        <StatCard label="Active requests"   value={activeRequest ? activeRequest.count : 0}  sub="currently funded"                                color="purple" />
        <StatCard label="Total repaid"      value={`₦${parseFloat(data.transactions?.total_repaid || 0).toLocaleString()}`} sub="lifetime repayments" color="amber" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-medium text-gray-900">Recent invoices</h2>
          <Link to="/invoices" className="text-xs text-green-600 hover:text-green-700">View all</Link>
        </div>
        {data.recent_invoices.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500">No invoices yet.</p>
            <Link to="/invoices/new" className="text-sm text-green-600 hover:text-green-700 mt-2 inline-block">Upload your first invoice</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-medium">Debtor</th>
                <th className="text-right px-5 py-3 font-medium">Amount</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_invoices.map(inv => (
                <tr key={inv.invoice_number} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">{inv.debtor_name}</td>
                  <td className="px-5 py-3 text-right text-gray-700">
                    {inv.currency} {parseFloat(inv.amount).toLocaleString()}
                  </td>
                  <td className="px-5 py-3">{badge(inv.status)}</td>
                  <td className="px-5 py-3 text-gray-400">{new Date(inv.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
