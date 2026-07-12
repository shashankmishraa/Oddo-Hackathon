import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Truck, ShieldAlert, Check } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setToken(null);
    setSubmitting(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      if (response.data?.success) {
        setToken(response.data.data.token);
      } else {
        setError(response.data?.message || 'Password reset request failed.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Request failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070913] px-4 py-12 sm:px-6 lg:px-8">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.06),transparent_65%)] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-xl shadow-primary/20">
            <Truck size={28} />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white">
            Forgot Password
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Enter your email to generate a secure reset token
          </p>
        </div>

        <div className="bg-[#0c0f24]/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black/40">
          {!token ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="flex items-center space-x-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400">
                  <ShieldAlert size={18} className="shrink-0" />
                  <p className="font-medium text-xs leading-normal">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Operator Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@transitops.com"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#070913] focus:ring-primary shadow-lg shadow-primary/20 transition-all duration-200 disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                ) : (
                  'Generate Reset Token'
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center space-x-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400">
                <Check size={18} className="shrink-0" />
                <p className="font-medium text-xs leading-normal">
                  Demo token generated! Copy the token below:
                </p>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-center">
                <code className="text-white font-mono font-bold select-all text-sm">{token}</code>
              </div>

              <button
                onClick={() => navigate(`/reset-password?token=${token}`)}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20"
              >
                Proceed to Reset Password
              </button>
            </div>
          )}

          <div className="mt-6 border-t border-slate-800/80 pt-4 text-center">
            <p className="text-xs text-slate-400">
              Remember your password?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ForgotPassword;
