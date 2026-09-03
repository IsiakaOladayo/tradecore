import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store';

export default function Register() {
  const [form, setForm] = useState({
    name: '', registration_no: '', email: '',
    password: '', country: 'Nigeria', sector: '', phone: '',
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate     = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const field = (label, key, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type} value={form[key]} placeholder={placeholder}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">TC</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Register your business</h1>
          <p className="text-gray-500 mt-1 text-sm">Start accessing invoice finance today</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {field('Business name', 'name', 'text', 'Acme Supplies Ltd')}
            {field('CAC Registration number', 'registration_no', 'text', 'RC-1234567')}
            {field('Business email', 'email', 'email', 'finance@acmesupplies.ng')}
            {field('Password', 'password', 'password', '••••••••')}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select
                  value={form.country}
                  onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {['Nigeria','Ghana','Kenya','South Africa'].map(c => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              {field('Sector', 'sector', 'text', 'Manufacturing')}
            </div>

            {field('Phone number', 'phone', 'tel', '+234 800 000 0000')}

            <button
              type="submit" disabled={loading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors mt-2"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-green-600 hover:text-green-700 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
