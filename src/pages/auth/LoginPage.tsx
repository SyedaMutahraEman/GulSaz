import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { UserRole } from '../../types';
import {
  ArrowRight,
  Lock,
  Mail,
  AlertCircle,
  User,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

type AuthMode = 'login' | 'register';

export const LoginPage: React.FC = () => {
  const { login, register, isAuthenticated, role, isLoading } = useAuth();
  const navigate = useNavigate();
  const { settings } = useSettings();

  const [mode, setMode] = useState<AuthMode>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountRole, setAccountRole] = useState<UserRole>('admin');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(role === 'admin' ? '/admin' : '/pos', { replace: true });
    }
  }, [isAuthenticated, role, navigate, isLoading]);

  const goAfterAuth = (userRole: UserRole) => {
    navigate(userRole === 'admin' ? '/admin' : '/pos', { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (mode === 'register') {
      if (!name.trim()) {
        setError('Please enter your name');
        setSubmitting(false);
        return;
      }
      if (password.trim().length < 6) {
        setError('Password must be at least 6 characters');
        setSubmitting(false);
        return;
      }

      const res = await register({
        name,
        email,
        password,
        role: accountRole,
      });
      setSubmitting(false);

      if (res.success && res.user) {
        goAfterAuth(res.user.role);
      } else {
        setError(res.error || 'Could not create account');
      }
      return;
    }

    const res = await login(email, password);
    setSubmitting(false);

    if (res.success && res.user) {
      goAfterAuth(res.user.role);
    } else {
      setError(res.error || 'Invalid email or password');
    }
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
  };

  const brandName = settings.brandName || 'POS';
  const initials =
    brandName
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'POS';

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-[#111827] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-black text-xl tracking-wider rounded-lg shadow-md">
            {initials}
          </div>
        </div>
        <h2 className="mt-4 text-xl font-bold tracking-tight text-gray-900 uppercase">
          {brandName} <span className="text-gray-400 font-normal">| POS</span>
        </h2>
        <p className="mt-1 text-xs text-gray-500 uppercase tracking-wider font-semibold">
          {mode === 'register' ? 'Step 1 — Create your account' : 'Step 2 — Sign in to continue'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-white py-8 px-6 shadow-sm rounded-xl sm:px-10 border border-gray-200">
          {/* Mode tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                mode === 'register' ? 'bg-black text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                mode === 'login' ? 'bg-black text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign In
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <div className="relative rounded-lg">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoComplete="name"
                      className="block w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-900 focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                      placeholder="Your name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Account Type
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setAccountRole('admin')}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        accountRole === 'admin'
                          ? 'border-black bg-gray-50 ring-1 ring-black'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Admin</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1 leading-snug">
                        Manage products, stock, sales & settings
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAccountRole('employee')}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        accountRole === 'employee'
                          ? 'border-black bg-gray-50 ring-1 ring-black'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Employee</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1 leading-snug">
                        Use the POS terminal to sell items
                      </p>
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                  className="block w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-900 focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  className="block w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-900 focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                  placeholder={mode === 'register' ? 'At least 6 characters' : 'Enter your password'}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg text-xs font-bold uppercase tracking-wider text-white bg-black hover:bg-gray-800 shadow-md transition-all disabled:opacity-60"
              >
                <span>
                  {submitting
                    ? mode === 'register'
                      ? 'Creating Account...'
                      : 'Signing In...'
                    : mode === 'register'
                      ? 'Create Account'
                      : 'Sign In'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <p className="mt-5 text-center text-[11px] text-gray-500">
            {mode === 'register' ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-bold text-gray-900 underline underline-offset-2"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                New here?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="font-bold text-gray-900 underline underline-offset-2"
                >
                  Create an account
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
