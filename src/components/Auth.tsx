import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Moon } from 'lucide-react';
import { isValidEmail, validatePassword } from '../lib/validation';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const friendlyError = (err: unknown): string => {
    const msg: string = err instanceof Error ? err.message : String(err ?? '');
    if (/invalid login credentials/i.test(msg)) {
      return 'Incorrect email or password. Please try again.';
    }
    if (/user already registered/i.test(msg)) {
      return 'An account with this email already exists. Try signing in instead.';
    }
    if (/email not confirmed/i.test(msg)) {
      return 'Please confirm your email address (check your inbox) before signing in.';
    }
    if (/password/i.test(msg) && msg.length < 120) return msg;
    return msg || 'An unexpected error occurred. Please try again.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    const pwError = validatePassword(password);
    if (pwError) {
      setError(pwError);
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(cleanEmail, password);
        // With "Confirm email" enabled in Supabase Auth, there is no active
        // session yet — tell the user what to do next instead of hanging.
        setInfo('Account created! Check your email for a confirmation link, then sign in.');
        setIsSignUp(false);
      } else {
        await signIn(cleanEmail, password);
      }
    } catch (err: unknown) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-gradient flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20">
        <div className="flex items-center justify-center mb-6">
          <Moon className="w-10 h-10 text-blue-300" />
        </div>

        <h1 className="text-2xl font-bold text-center text-white mb-2">
          SleepSphere
        </h1>
        <p className="text-center text-blue-200 mb-6">
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="auth-email" className="block text-sm font-medium text-blue-100 mb-2">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-sm font-medium text-blue-100 mb-2">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              placeholder="••••••••"
            />
            {isSignUp && (
              <p className="text-xs text-blue-200/70 mt-1">At least 6 characters.</p>
            )}
          </div>

          {error && (
            <div role="alert" className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {info && (
            <div role="status" className="bg-green-500/20 border border-green-500/50 rounded-lg p-3">
              <p className="text-green-200 text-sm">{info}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-semibold py-3 rounded-lg transition shadow-lg hover:shadow-xl"
          >
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(''); setInfo(''); }}
            className="text-blue-300 hover:text-blue-200 text-sm transition"
          >
            {isSignUp
              ? 'Already have an account? Sign In'
              : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
