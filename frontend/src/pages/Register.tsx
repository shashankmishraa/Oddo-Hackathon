import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Truck, ShieldAlert } from 'lucide-react';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [roleName, setRoleName] = useState('Driver');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Form Validations
    if (!fullName || !email || !password || !confirmPassword || !contactNumber || !roleName) {
      setError('All fields are required.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    // Password strength check
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter.');
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter.');
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number.');
      return;
    }

    // Password match check
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Phone format check (10 to 15 digits)
    if (!/^\+?[0-9]{10,15}$/.test(contactNumber)) {
      setError('Please enter a valid contact number (10 to 15 digits).');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        fullName,
        email,
        password,
        confirmPassword,
        contactNumber,
        roleName,
      });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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
            Create Account
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Register a new TransitOps operational account
          </p>
        </div>

        <div className="bg-[#0c0f24]/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black/40">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center space-x-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400">
                <ShieldAlert size={18} className="shrink-0" />
                <p className="font-medium text-xs leading-normal">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-450 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ishan Shirode"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-450 mb-1.5">
                  Operator Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@transitops.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm transition-all duration-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-450 mb-1.5">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    required
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-450 mb-1.5">
                    Operational Role
                  </label>
                  <select
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm transition-all duration-200"
                  >
                    <option value="Fleet Manager">Fleet Manager</option>
                    <option value="Dispatcher">Dispatcher</option>
                    <option value="Safety Officer">Safety Officer</option>
                    <option value="Financial Analyst">Financial Analyst</option>
                    <option value="Driver">Driver</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-450 mb-1.5">
                  Security Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-450 mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm transition-all duration-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#070913] focus:ring-primary shadow-lg shadow-primary/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
              ) : (
                'Register Account'
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-800/80 pt-4 text-center">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
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
export default Register;
