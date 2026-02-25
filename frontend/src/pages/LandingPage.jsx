import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Pen, Users, MessageSquare, Share2, Shield, Zap,
  ArrowRight, Moon, Sun, Monitor, Sparkles, Layers,
  Github, Twitter, Linkedin, ChevronRight
} from 'lucide-react';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const features = [
    {
      icon: <Pen className="w-6 h-6" />,
      title: 'Drawing Tools',
      description: 'Pen, eraser, shapes, and color picker with adjustable brush sizes for precise drawing.',
      color: 'from-violet-500 to-purple-600',
      bg: 'bg-violet-50 dark:bg-violet-950/30',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Real-Time Collaboration',
      description: 'Draw together with your team in real-time. See live cursors and strokes as they happen.',
      color: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: 'Built-in Chat',
      description: 'Communicate with your collaborators using the integrated real-time chat panel.',
      color: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      icon: <Share2 className="w-6 h-6" />,
      title: 'Screen Sharing',
      description: 'Share your screen with participants for presentations and tutorials.',
      color: 'from-orange-500 to-amber-500',
      bg: 'bg-orange-50 dark:bg-orange-950/30',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Private Rooms',
      description: 'Create password-protected rooms for confidential brainstorming sessions.',
      color: 'from-rose-500 to-pink-500',
      bg: 'bg-rose-50 dark:bg-rose-950/30',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Instant Sync',
      description: 'WebSocket-powered sync ensures zero-lag collaboration across the globe.',
      color: 'from-yellow-500 to-orange-500',
      bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Create or Join a Room',
      description: 'Sign up in seconds, then create a new whiteboard room or join an existing one with a room code.',
    },
    {
      step: '02',
      title: 'Invite Your Team',
      description: 'Share the unique room ID with your teammates. They can join instantly from anywhere.',
    },
    {
      step: '03',
      title: 'Collaborate in Real-Time',
      description: 'Draw, chat, and share screens together. Every stroke syncs instantly across all devices.',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow">
                  <Pen className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white dark:border-gray-950 animate-pulse" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                CollabBoard
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                How It Works
              </a>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-all"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
                >
                  Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-96 h-96 bg-violet-400/20 dark:bg-violet-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-96 bg-gradient-to-t from-blue-50/50 dark:from-blue-950/20 to-transparent" />
        </div>
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 -z-10 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200/50 dark:border-blue-800/50 text-blue-700 dark:text-blue-300 text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              Real-time collaborative whiteboard
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
              <span className="block">Collaborate &</span>
              <span className="block bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                Create Together
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              A powerful, real-time collaborative whiteboard where teams can draw, brainstorm,
              and bring ideas to life — all in one beautiful, shared canvas.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to={isAuthenticated ? '/dashboard' : '/register'}
                className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white text-lg font-semibold rounded-2xl shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:-translate-y-0.5"
              >
                Start Drawing Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 px-8 py-4 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300 text-lg font-semibold rounded-2xl transition-all hover:-translate-y-0.5"
              >
                <Monitor className="w-5 h-5" />
                See Features
              </a>
            </div>

            {/* Stats */}
            <div className="mt-16 flex items-center justify-center gap-8 sm:gap-16">
              {[
                { value: 'Real-Time', label: 'Sync' },
                { value: '100%', label: 'Free' },
                { value: '∞', label: 'Rooms' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Image / Canvas Preview */}
          <div className="mt-20 mx-auto max-w-5xl">
            <div className="relative rounded-2xl overflow-hidden border border-gray-200/80 dark:border-gray-700/80 shadow-2xl shadow-gray-900/10 dark:shadow-black/30">
              {/* Browser-like top bar */}
              <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 ml-3">
                  <div className="max-w-md mx-auto bg-white dark:bg-gray-700 rounded-lg px-4 py-1.5 text-xs text-gray-500 dark:text-gray-400 text-center">
                    collabboard.app/room/ABC123
                  </div>
                </div>
              </div>
              {/* Canvas area */}
              <div className="bg-white dark:bg-gray-900 p-8 sm:p-12 min-h-[300px] sm:min-h-[400px] relative">
                {/* Simulated whiteboard content */}
                <svg className="w-full h-full absolute inset-0" viewBox="0 0 800 400" fill="none">
                  {/* Drawing strokes */}
                  <path d="M100,200 Q200,100 300,200 T500,200" stroke="url(#blueGrad)" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7" />
                  <path d="M150,250 Q250,150 350,250 T550,250" stroke="url(#purpleGrad)" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5" />
                  <rect x="450" y="80" width="200" height="120" rx="12" stroke="#8b5cf6" strokeWidth="2" fill="#8b5cf620" />
                  <circle cx="200" cy="150" r="50" stroke="#3b82f6" strokeWidth="2" fill="#3b82f620" />
                  <text x="490" y="135" fill="#8b5cf6" fontSize="14" fontWeight="600">Brainstorm</text>
                  <text x="490" y="160" fill="#8b5cf680" fontSize="11">Ideas go here ✨</text>
                  {/* Cursor indicators */}
                  <g transform="translate(320, 180)">
                    <circle r="4" fill="#10b981" />
                    <rect x="8" y="-8" width="52" height="18" rx="9" fill="#10b981" />
                    <text x="14" y="5" fill="white" fontSize="10" fontWeight="500">Alice</text>
                  </g>
                  <g transform="translate(550, 130)">
                    <circle r="4" fill="#f59e0b" />
                    <rect x="8" y="-8" width="40" height="18" rx="9" fill="#f59e0b" />
                    <text x="14" y="5" fill="white" fontSize="10" fontWeight="500">Bob</text>
                  </g>
                  <defs>
                    <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                    <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Floating toolbar mockup */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white dark:bg-gray-800 shadow-lg rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-700">
                  {['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'].map((color) => (
                    <div key={color} className="w-6 h-6 rounded-lg cursor-pointer hover:scale-110 transition-transform" style={{ backgroundColor: color }} />
                  ))}
                  <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
                  <Pen className="w-5 h-5 text-gray-500" />
                  <Layers className="w-5 h-5 text-gray-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-32 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-950/50 border border-violet-200/50 dark:border-violet-800/50 text-violet-700 dark:text-violet-300 text-sm font-medium mb-4">
              <Layers className="w-4 h-4" />
              Features
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything you need to{' '}
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                collaborate
              </span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Packed with powerful features designed for seamless team creativity
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className={`group relative p-6 rounded-2xl ${feature.bg} border border-gray-200/50 dark:border-gray-800/50 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} text-white shadow-lg mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/50 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-4">
              <Zap className="w-4 h-4" />
              How It Works
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Get started in{' '}
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                3 simple steps
              </span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              From sign-up to collaboration in under a minute
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((item, index) => (
              <div key={item.step} className="relative group">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-gray-200 dark:from-gray-700 to-transparent -translate-x-4 z-0" />
                )}
                <div className="relative z-10 p-6 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/80 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white text-lg font-bold mb-4 shadow-lg shadow-blue-500/20">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-violet-600 to-purple-700" />
            <div className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px)',
                backgroundSize: '32px 32px'
              }}
            />

            <div className="relative px-8 py-16 sm:px-16 sm:py-20 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to collaborate?
              </h2>
              <p className="text-blue-100 text-lg max-w-xl mx-auto mb-8">
                Join thousands of teams who use CollabBoard to brainstorm, plan, and create together in real-time.
              </p>
              <Link
                to={isAuthenticated ? '/dashboard' : '/register'}
                className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-700 text-lg font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5"
              >
                Get Started — It's Free
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <Link to="/" className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
                  <Pen className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                  CollabBoard
                </span>
              </Link>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm leading-relaxed">
                A real-time collaborative whiteboard for teams to draw, brainstorm,
                and create together from anywhere in the world.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Product</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#features" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <Link to="/register" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    Get Started
                  </Link>
                </li>
              </ul>
            </div>

            {/* Social */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Connect</h4>
              <div className="flex gap-3">
                <a href="#" className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all" aria-label="GitHub">
                  <Github className="w-5 h-5" />
                </a>
                <a href="#" className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all" aria-label="Twitter">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all" aria-label="LinkedIn">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} CollabBoard. All rights reserved.
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Built with ❤️ for collaborative creativity
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
