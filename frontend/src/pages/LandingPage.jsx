import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useState, useEffect, useRef } from 'react';
import {
  Pen, Users, MessageSquare, Share2, Shield, Zap,
  ArrowRight, Moon, Sun, Monitor, Sparkles, Layers,
  Github, Twitter, Linkedin, ChevronRight, Star,
  Video, Palette, Globe, Lock, Mic
} from 'lucide-react';

/* ═══════════════════════════════════════
   ANIMATED COUNTER HOOK
   ═══════════════════════════════════════ */
const useCounter = (target, duration = 2000, startOnView = true) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!startOnView) { setStarted(true); return; }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setStarted(true); obs.disconnect(); }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [startOnView]);

  useEffect(() => {
    if (!started) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);

  return { count, ref };
};

/* ═══════════════════════════════════════
   TYPEWRITER HOOK
   ═══════════════════════════════════════ */
const useTypewriter = (text, speed = 50, delay = 600) => {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    let i = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) clearInterval(interval);
      }, speed);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, speed, delay]);
  return displayed;
};

/* ═══════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════ */
const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const subtitle = useTypewriter(
    'A powerful, real-time collaborative whiteboard where teams draw, brainstorm, and bring ideas to life.',
    30,
    800
  );

  const stat1 = useCounter(500, 2200);
  const stat2 = useCounter(10, 1800);
  const stat3 = useCounter(99, 2000);

  const features = [
    {
      icon: <Pen className="w-6 h-6" />,
      title: 'Smart Drawing Tools',
      description: 'Pencil, pen, marker, highlighter, eraser, shapes, arrows and text with adjustable sizes.',
      color: 'from-violet-500 to-purple-600',
      bg: 'bg-violet-50 dark:bg-violet-950/30',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Real-Time Collaboration',
      description: 'Draw together with live cursors. Every stroke syncs instantly across all participants.',
      color: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: 'Built-in Chat & Files',
      description: 'Integrated real-time messaging with file sharing and emoji reactions.',
      color: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      icon: <Video className="w-6 h-6" />,
      title: 'Video & Camera',
      description: 'Built-in camera feeds for face-to-face collaboration while drawing together.',
      color: 'from-pink-500 to-rose-500',
      bg: 'bg-pink-50 dark:bg-pink-950/30',
    },
    {
      icon: <Share2 className="w-6 h-6" />,
      title: 'Screen Sharing',
      description: 'Share your screen directly in the whiteboard for seamless presentations.',
      color: 'from-orange-500 to-amber-500',
      bg: 'bg-orange-50 dark:bg-orange-950/30',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Private & Secure Rooms',
      description: 'Password-protected rooms with per-user permission controls for hosts.',
      color: 'from-rose-500 to-pink-500',
      bg: 'bg-rose-50 dark:bg-rose-950/30',
    },
    {
      icon: <Palette className="w-6 h-6" />,
      title: 'Sticky Notes & Laser',
      description: 'Draggable sticky notes and laser pointer tool for presentations and brainstorming.',
      color: 'from-yellow-500 to-orange-500',
      bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Instant Sync',
      description: 'WebSocket-powered sync ensures zero-lag collaboration across the globe.',
      color: 'from-indigo-500 to-blue-500',
      bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Keyboard Shortcuts',
      description: 'Power-user shortcuts for every tool. Press ? in the whiteboard to see them all.',
      color: 'from-teal-500 to-emerald-500',
      bg: 'bg-teal-50 dark:bg-teal-950/30',
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Create or Join a Room',
      description: 'Sign up in seconds, then create a new whiteboard room or join an existing one with a room code.',
      icon: <Sparkles className="w-6 h-6" />,
    },
    {
      step: '02',
      title: 'Invite Your Team',
      description: 'Share the unique room ID with your teammates. They can join instantly from anywhere.',
      icon: <Users className="w-6 h-6" />,
    },
    {
      step: '03',
      title: 'Collaborate in Real-Time',
      description: 'Draw, chat, share screens, and video call together. Every stroke syncs instantly.',
      icon: <Zap className="w-6 h-6" />,
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Product Designer at Figma',
      text: 'CollabBoard has completely replaced our physical whiteboards. The real-time sync is flawless and the drawing tools feel incredibly natural.',
      rating: 5,
      color: 'from-violet-500 to-purple-500',
    },
    {
      name: 'Marcus Rodriguez',
      role: 'Engineering Lead at Stripe',
      text: 'We use CollabBoard for all our sprint planning sessions. The sticky notes feature and screen sharing make remote standups feel like being in the same room.',
      rating: 5,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      name: 'Emily Nakamura',
      role: 'Teacher at Stanford',
      text: 'My students love the interactive whiteboard. The video call integration means I can teach and draw simultaneously. Game changer for online education.',
      rating: 5,
      color: 'from-emerald-500 to-teal-500',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white overflow-hidden">
      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="h-[2px] bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500 animate-gradient" />
        <div className="bg-white/70 dark:bg-gray-950/70 backdrop-blur-2xl border-b border-gray-200/40 dark:border-gray-800/40 shadow-sm shadow-gray-200/20 dark:shadow-black/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <Pen className="w-5 h-5 text-white transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white dark:border-gray-950 animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-extrabold bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                    CollabBoard
                  </span>
                  <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 -mt-0.5 tracking-wider uppercase">
                    Real-time Whiteboard
                  </span>
                </div>
              </Link>

              <div className="hidden md:flex items-center gap-1">
                {[
                  { href: '#features', label: 'Features' },
                  { href: '#how-it-works', label: 'How It Works' },
                  { href: '#testimonials', label: 'Testimonials' },
                ].map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="relative px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 group"
                  >
                    {link.label}
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full transition-all duration-300 group-hover:w-3/4" />
                  </a>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTheme}
                  className="relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/80 text-gray-500 dark:text-gray-400 transition-all duration-200 hover:scale-105 active:scale-95"
                  aria-label="Toggle theme"
                >
                  <div className="relative w-5 h-5">
                    {isDark ? (
                      <Sun className="w-5 h-5 transition-transform duration-300 hover:rotate-45" />
                    ) : (
                      <Moon className="w-5 h-5 transition-transform duration-300 hover:-rotate-12" />
                    )}
                  </div>
                </button>

                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700/60 mx-1 hidden sm:block" />

                {isAuthenticated ? (
                  <Link
                    to="/dashboard"
                    className="group inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-95"
                  >
                    Dashboard
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="group inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-95"
                    >
                      Get Started
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 overflow-hidden">
        {/* Floating blobs */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl animate-blob" />
          <div className="absolute top-40 right-1/4 w-96 h-96 bg-violet-400/20 dark:bg-violet-600/10 rounded-full blur-3xl animate-blob" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-pink-400/15 dark:bg-pink-600/8 rounded-full blur-3xl animate-blob" style={{ animationDelay: '4s' }} />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-96 bg-gradient-to-t from-blue-50/50 dark:from-blue-950/20 to-transparent" />
        </div>
        {/* Dot grid overlay */}
        <div className="absolute inset-0 -z-10 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        {/* Floating decorative shapes */}
        <div className="absolute top-32 left-[8%] w-12 h-12 border-2 border-blue-300/30 dark:border-blue-500/20 rounded-xl animate-float-slow opacity-60" style={{ animationDelay: '0s' }} />
        <div className="absolute top-48 right-[10%] w-8 h-8 bg-violet-400/20 dark:bg-violet-500/15 rounded-full animate-float-slow opacity-50" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-72 left-[15%] w-6 h-6 border-2 border-emerald-300/30 dark:border-emerald-500/20 rounded-full animate-float" style={{ animationDelay: '0.8s' }} />
        <div className="absolute bottom-40 right-[18%] w-10 h-10 border-2 border-pink-300/25 dark:border-pink-500/15 rotate-45 animate-float-slow opacity-50" style={{ animationDelay: '2.5s' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="animate-fade-in-down inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200/50 dark:border-blue-800/50 text-blue-700 dark:text-blue-300 text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4 animate-pulse" />
              Real-time collaborative whiteboard
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
            </div>

            <h1 className="animate-fade-in-up text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
              <span className="block">Collaborate &</span>
              <span className="block bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_200%]">
                Create Together
              </span>
            </h1>

            <p className="animate-fade-in-up delay-200 text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed min-h-[56px]">
              {subtitle}<span className="inline-block w-[2px] h-5 bg-violet-500 ml-0.5 align-middle animate-pulse" />
            </p>

            <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to={isAuthenticated ? '/dashboard' : '/register'}
                className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white text-lg font-semibold rounded-2xl shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:-translate-y-1 hover:scale-[1.02]"
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

            {/* ─── ANIMATED COUNTER STATS ─── */}
            <div className="mt-16 flex items-center justify-center gap-8 sm:gap-16 animate-fade-in-up delay-500">
              <div ref={stat1.ref} className="text-center group cursor-default">
                <div className="text-2xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent transition-transform group-hover:scale-110">
                  {stat1.count}+
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">Teams</div>
              </div>
              <div className="w-px h-10 bg-gray-200 dark:bg-gray-700" />
              <div ref={stat2.ref} className="text-center group cursor-default">
                <div className="text-2xl sm:text-4xl font-extrabold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent transition-transform group-hover:scale-110">
                  {stat2.count}K+
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">Boards Created</div>
              </div>
              <div className="w-px h-10 bg-gray-200 dark:bg-gray-700" />
              <div ref={stat3.ref} className="text-center group cursor-default">
                <div className="text-2xl sm:text-4xl font-extrabold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent transition-transform group-hover:scale-110">
                  {stat3.count}.9%
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">Uptime</div>
              </div>
            </div>
          </div>

          {/* Hero Canvas Preview */}
          <div className="mt-20 mx-auto max-w-5xl animate-fade-in-up delay-600">
            <div className="relative rounded-2xl overflow-hidden border border-gray-200/80 dark:border-gray-700/80 shadow-2xl shadow-gray-900/10 dark:shadow-black/30 hover:shadow-3xl transition-shadow duration-500">
              {/* Browser top bar */}
              <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 ml-3">
                  <div className="max-w-md mx-auto bg-white dark:bg-gray-700 rounded-lg px-4 py-1.5 text-xs text-gray-500 dark:text-gray-400 text-center flex items-center justify-center gap-2">
                    <Lock className="w-3 h-3 text-emerald-500" />
                    collabboard.app/room/ABC123
                  </div>
                </div>
              </div>
              {/* Canvas area */}
              <div className="bg-white dark:bg-gray-900 p-8 sm:p-12 min-h-[300px] sm:min-h-[400px] relative">
                <svg className="w-full h-full absolute inset-0" viewBox="0 0 800 400" fill="none">
                  <path d="M100,200 Q200,100 300,200 T500,200" stroke="url(#blueGrad)" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7">
                    <animate attributeName="stroke-dashoffset" from="400" to="0" dur="3s" fill="freeze" />
                    <animate attributeName="stroke-dasharray" values="0 400;400 0" dur="3s" fill="freeze" />
                  </path>
                  <path d="M150,250 Q250,150 350,250 T550,250" stroke="url(#purpleGrad)" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5">
                    <animate attributeName="stroke-dashoffset" from="400" to="0" dur="3s" begin="0.5s" fill="freeze" />
                    <animate attributeName="stroke-dasharray" values="0 400;400 0" dur="3s" begin="0.5s" fill="freeze" />
                  </path>
                  <rect x="450" y="80" width="200" height="120" rx="12" stroke="#8b5cf6" strokeWidth="2" fill="#8b5cf620" opacity="0">
                    <animate attributeName="opacity" from="0" to="1" dur="0.5s" begin="1.5s" fill="freeze" />
                  </rect>
                  <circle cx="200" cy="150" r="50" stroke="#3b82f6" strokeWidth="2" fill="#3b82f620" opacity="0">
                    <animate attributeName="opacity" from="0" to="1" dur="0.5s" begin="1s" fill="freeze" />
                  </circle>
                  <text x="490" y="135" fill="#8b5cf6" fontSize="14" fontWeight="600" opacity="0">
                    <animate attributeName="opacity" from="0" to="1" dur="0.5s" begin="2s" fill="freeze" />
                    Brainstorm
                  </text>
                  <text x="490" y="160" fill="#8b5cf680" fontSize="11" opacity="0">
                    <animate attributeName="opacity" from="0" to="1" dur="0.5s" begin="2.2s" fill="freeze" />
                    Ideas go here ✨
                  </text>
                  {/* Cursor indicators */}
                  <g transform="translate(320, 180)">
                    <circle r="4" fill="#10b981">
                      <animate attributeName="cx" values="0;8;0" dur="4s" repeatCount="indefinite" />
                    </circle>
                    <rect x="8" y="-8" width="52" height="18" rx="9" fill="#10b981" />
                    <text x="14" y="5" fill="white" fontSize="10" fontWeight="500">Alice</text>
                  </g>
                  <g transform="translate(550, 130)">
                    <circle r="4" fill="#f59e0b">
                      <animate attributeName="cy" values="0;-6;0" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <rect x="8" y="-8" width="40" height="18" rx="9" fill="#f59e0b" />
                    <text x="14" y="5" fill="white" fontSize="10" fontWeight="500">Bob</text>
                  </g>
                  {/* Sticky note mockup */}
                  <g transform="translate(620, 260)" opacity="0">
                    <animate attributeName="opacity" from="0" to="1" dur="0.5s" begin="2.5s" fill="freeze" />
                    <rect width="100" height="80" rx="4" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1" />
                    <text x="10" y="25" fill="#92400E" fontSize="10" fontWeight="600">TODO:</text>
                    <text x="10" y="42" fill="#92400E" fontSize="9">Review designs</text>
                    <text x="10" y="56" fill="#92400E" fontSize="9">Ship by Friday</text>
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
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white dark:bg-gray-800 shadow-lg rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-700 animate-fade-in-up delay-700">
                  {['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'].map((c) => (
                    <div key={c} className="w-6 h-6 rounded-lg cursor-pointer hover:scale-110 transition-transform" style={{ backgroundColor: c }} />
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

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-20 sm:py-32 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-in-up">
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
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className={`group animate-fade-in-up relative p-6 rounded-2xl ${feature.bg} border border-gray-200/50 dark:border-gray-800/50 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl`}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} text-white shadow-lg mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
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

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-in-up">
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
              <div key={item.step} className="relative group animate-fade-in-up" style={{ animationDelay: `${index * 0.15}s` }}>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-blue-300 dark:from-blue-700 via-violet-300 dark:via-violet-700 to-transparent -translate-x-4 z-0" />
                )}
                <div className="relative z-10 p-6 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/80 hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 group-hover:border-blue-200 dark:group-hover:border-blue-800/50">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white text-lg font-bold mb-4 shadow-lg shadow-blue-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                    {item.icon}
                  </div>
                  <div className="text-xs font-bold text-blue-500 dark:text-blue-400 mb-2 tracking-wider">STEP {item.step}</div>
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

      {/* ─── TESTIMONIALS ─── */}
      <section id="testimonials" className="py-20 sm:py-32 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-50 dark:bg-pink-950/50 border border-pink-200/50 dark:border-pink-800/50 text-pink-700 dark:text-pink-300 text-sm font-medium mb-4">
              <Star className="w-4 h-4" />
              Testimonials
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Loved by{' '}
              <span className="bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                teams everywhere
              </span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              See what our users have to say about CollabBoard
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div
                key={t.name}
                className="animate-fade-in-up relative p-6 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/80 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                {/* Quote icon */}
                <div className="absolute top-4 right-4 text-4xl text-gray-100 dark:text-gray-700/50 font-serif leading-none select-none">"</div>

                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6 relative z-10">
                  "{t.text}"
                </p>

                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 sm:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden animate-fade-in-up">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-violet-600 to-purple-700 animate-gradient bg-[length:200%_200%]" />
            <div className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px)',
                backgroundSize: '32px 32px'
              }}
            />
            {/* Floating shapes inside CTA */}
            <div className="absolute top-6 left-6 w-16 h-16 border-2 border-white/20 rounded-full animate-float-slow" />
            <div className="absolute bottom-8 right-10 w-12 h-12 border-2 border-white/15 rounded-xl rotate-12 animate-float" />

            <div className="relative px-8 py-16 sm:px-16 sm:py-20 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to collaborate?
              </h2>
              <p className="text-blue-100 text-lg max-w-xl mx-auto mb-8">
                Join thousands of teams who use CollabBoard to brainstorm, plan, and create together in real-time.
              </p>
              <Link
                to={isAuthenticated ? '/dashboard' : '/register'}
                className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-700 text-lg font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 hover:scale-[1.02]"
              >
                Get Started — It's Free
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
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

            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Product</h4>
              <ul className="space-y-3">
                <li><a href="#features" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#testimonials" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Testimonials</a></li>
                <li><Link to="/register" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Get Started</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Connect</h4>
              <div className="flex gap-3">
                <a href="#" className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all hover:scale-110" aria-label="GitHub">
                  <Github className="w-5 h-5" />
                </a>
                <a href="#" className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all hover:scale-110" aria-label="Twitter">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all hover:scale-110" aria-label="LinkedIn">
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
