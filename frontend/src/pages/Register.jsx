import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, Loader2, Pen, ArrowRight, Sparkles, Check, X } from 'lucide-react';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const result = await register(username, email, password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  // Password strength
  const passwordChecks = [
    { label: 'At least 6 characters', ok: password.length >= 6 },
    { label: 'Contains uppercase', ok: /[A-Z]/.test(password) },
    { label: 'Contains number', ok: /\d/.test(password) },
  ];
  const strengthPct = password.length === 0 ? 0 : (passwordChecks.filter(c => c.ok).length / passwordChecks.length) * 100;
  const strengthColor = strengthPct <= 33 ? 'bg-red-500' : strengthPct <= 66 ? 'bg-yellow-500' : 'bg-emerald-500';

  return (
    <div className="min-h-screen flex">
      {/* ─── LEFT: Animated Gradient Panel ─── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-blue-700 animate-gradient bg-[length:200%_200%]">
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px)',
            backgroundSize: '32px 32px'
          }}
        />
        <div className="absolute top-16 right-12 w-28 h-28 border-2 border-white/20 rounded-full animate-float-slow" />
        <div className="absolute top-48 left-12 w-20 h-20 border-2 border-white/15 rounded-2xl rotate-45 animate-float" />
        <div className="absolute bottom-40 right-20 w-14 h-14 bg-white/10 rounded-xl animate-float-slow" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-16 left-28 w-20 h-20 border-2 border-white/10 rounded-full animate-blob" />
        <div className="absolute top-1/4 right-1/4 w-36 h-36 bg-white/5 rounded-full blur-xl animate-blob" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12">
          <div className="animate-fade-in-up">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 animate-pulse-glow">
              <Pen className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl font-extrabold text-white mb-4 leading-tight">
              Join the creative<br />
              <span className="text-purple-200">community</span>
            </h2>
            <p className="text-purple-100/80 text-lg max-w-md leading-relaxed">
              Create your free account and start collaborating with your team on unlimited whiteboards.
            </p>
          </div>

          <div className="mt-10 space-y-3 animate-fade-in-up delay-300">
            {[
              'Free forever — no credit card',
              'Unlimited rooms & participants',
              'Camera, chat & screen sharing',
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-2 text-white/80 text-sm">
                <Sparkles className="w-4 h-4 text-purple-200" />
                {feat}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── RIGHT: Register Form ─── */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Pen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
              CollabBoard
            </span>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 p-8 border border-gray-100 dark:border-gray-700/50">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Account</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Join the collaborative whiteboard</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-xl text-sm animate-fade-in-up flex items-center gap-2">
                <span className="flex-shrink-0">⚠️</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-700 transition-all outline-none"
                    placeholder="Your name"
                    required
                    minLength={3}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-700 transition-all outline-none"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-700 transition-all outline-none"
                    placeholder="Create a password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {/* Password strength */}
                {password.length > 0 && (
                  <div className="mt-2 space-y-2 animate-fade-in-up">
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full ${strengthColor} rounded-full transition-all duration-500`}
                        style={{ width: `${strengthPct}%` }} />
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {passwordChecks.map(c => (
                        <span key={c.label} className={`text-[11px] flex items-center gap-1 ${c.ok ? 'text-emerald-500' : 'text-gray-400'}`}>
                          {c.ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          {c.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-700 transition-all outline-none"
                    placeholder="Confirm your password"
                    required
                  />
                  {confirmPassword.length > 0 && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      {password === confirmPassword ? (
                        <Check className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <X className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white dark:bg-gray-800 text-gray-400 font-medium">Or continue with</span>
              </div>
            </div>

            <button
              onClick={loginWithGoogle}
              className="w-full py-3 px-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white font-medium transition-all hover:-translate-y-0.5 flex items-center justify-center gap-3 shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-violet-600 hover:text-violet-700 dark:text-violet-400 font-semibold hover:underline transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
