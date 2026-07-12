import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Truck, ShieldAlert } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
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
            Transit<span className="text-primary">Ops</span> Terminal
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to access the fleet operation dashboard
          </p>
        </div>

        <div className="bg-[#0c0f24]/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black/40">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center space-x-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400">
                <ShieldAlert size={18} className="shrink-0" />
                <p className="font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Operator Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@transitops.com"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Security Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="relative w-full flex justify-center py-3 px-4 rounded-xl border border-transparent text-sm font-semibold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#070913] focus:ring-primary shadow-lg shadow-primary/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Access Dashboard'
              )}
            </button>
          </form>

          {/* Quick Login Helper Panel */}
          <div className="mt-8 border-t border-slate-800/80 pt-6 space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-3">
              Developer Demo Logins
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setEmail('admin@transitops.com');
                  setPassword('admin123');
                }}
                className="p-3 text-left rounded-xl bg-slate-900/30 border border-slate-800 hover:border-slate-700 transition-colors text-xs space-y-1"
              >
                <p className="font-semibold text-white">Administrator</p>
                <p className="text-slate-400">admin@transitops.com</p>
                <p className="text-primary font-medium">PW: admin123</p>
              </button>
              <button
                onClick={() => {
                  setEmail('dispatcher@transitops.com');
                  setPassword('dispatcher123');
                }}
                className="p-3 text-left rounded-xl bg-slate-900/30 border border-slate-800 hover:border-slate-700 transition-colors text-xs space-y-1"
              >
                <p className="font-semibold text-white">Dispatcher</p>
                <p className="text-slate-400">dispatcher@transitops.com</p>
                <p className="text-primary font-medium">PW: dispatcher123</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
