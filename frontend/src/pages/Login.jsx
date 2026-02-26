import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, Loader2, Pen, ArrowRight, Sparkles } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* ─── LEFT: Animated Gradient Panel ─── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 via-violet-600 to-purple-700 animate-gradient bg-[length:200%_200%]">
        {/* Decorative shapes */}
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px)',
            backgroundSize: '32px 32px'
          }}
        />
        <div className="absolute top-20 left-10 w-32 h-32 border-2 border-white/20 rounded-full animate-float-slow" />
        <div className="absolute top-40 right-16 w-20 h-20 border-2 border-white/15 rounded-2xl rotate-12 animate-float" />
        <div className="absolute bottom-32 left-20 w-16 h-16 bg-white/10 rounded-xl animate-float-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 right-32 w-24 h-24 border-2 border-white/10 rounded-full animate-blob" />
        <div className="absolute top-1/3 left-1/3 w-40 h-40 bg-white/5 rounded-full blur-xl animate-blob" style={{ animationDelay: '3s' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12">
          <div className="animate-fade-in-up">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 animate-pulse-glow">
              <Pen className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl font-extrabold text-white mb-4 leading-tight">
              Welcome back to<br />
              <span className="text-blue-200">CollabBoard</span>
            </h2>
            <p className="text-blue-100/80 text-lg max-w-md leading-relaxed">
              Pick up where you left off. Your whiteboards and collaborations are waiting.
            </p>
          </div>

          {/* Feature badges */}
          <div className="mt-10 space-y-3 animate-fade-in-up delay-300">
            {[
              'Real-time drawing sync',
              'Built-in video & chat',
              'Unlimited whiteboards',
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-2 text-white/80 text-sm">
                <Sparkles className="w-4 h-4 text-blue-200" />
                {feat}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── RIGHT: Login Form ─── */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 sm:p-8">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Pen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              CollabBoard
            </span>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 p-8 border border-gray-100 dark:border-gray-700/50">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Sign in to your whiteboard account</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-xl text-sm animate-fade-in-up flex items-center gap-2">
                <span className="flex-shrink-0">⚠️</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-700 transition-all outline-none"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-700 transition-all outline-none"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 disabled:opacity-60 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
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
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold hover:underline transition-colors">
                Sign up free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
