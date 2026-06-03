import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useState, useEffect, useRef, useMemo } from 'react';
import { reviewService } from '../services/reviewService';
import {
  Pen, Users, MessageSquare, Share2, Shield, Zap,
  ArrowRight, Moon, Sun, Monitor, Sparkles, Layers,
  Github, Twitter, Linkedin, ChevronRight, Star,
  Video, Palette, Globe, Lock, Mic, Send
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
   STATIC DATA (outside component to avoid re-creation)
   ═══════════════════════════════════════ */
const FEATURES = [
  {
    icon: 'Pen',
    title: 'Smart Drawing Tools',
    description: 'Pencil, pen, marker, highlighter, eraser, shapes, arrows and text with adjustable sizes.',
    color: 'bg-sky-500',
    bg: 'bg-sky-50 dark:bg-sky-950/20',
  },
  {
    icon: 'Users',
    title: 'Real-Time Collaboration',
    description: 'Draw together with live cursors. Every stroke syncs instantly across all participants.',
    color: 'bg-green-500',
    bg: 'bg-green-50 dark:bg-green-950/20',
  },
  {
    icon: 'MessageSquare',
    title: 'Built-in Chat & Files',
    description: 'Integrated real-time messaging with file sharing and emoji reactions.',
    color: 'bg-cyan-500',
    bg: 'bg-cyan-50 dark:bg-cyan-950/20',
  },
  {
    icon: 'Video',
    title: 'Video & Camera',
    description: 'Built-in camera feeds for face-to-face collaboration while drawing together.',
    color: 'bg-yellow-500',
    bg: 'bg-yellow-50 dark:bg-yellow-950/20',
  },
  {
    icon: 'Share2',
    title: 'Screen Sharing',
    description: 'Share your screen directly in the whiteboard for seamless presentations.',
    color: 'bg-sky-500',
    bg: 'bg-sky-50 dark:bg-sky-950/20',
  },
  {
    icon: 'Shield',
    title: 'Private & Secure Rooms',
    description: 'Password-protected rooms with per-user permission controls for hosts.',
    color: 'bg-green-500',
    bg: 'bg-green-50 dark:bg-green-950/20',
  },
  {
    icon: 'Palette',
    title: 'Sticky Notes & Laser',
    description: 'Draggable sticky notes and laser pointer tool for presentations and brainstorming.',
    color: 'bg-yellow-500',
    bg: 'bg-yellow-50 dark:bg-yellow-950/20',
  },
  {
    icon: 'Zap',
    title: 'Instant Sync',
    description: 'WebSocket-powered sync ensures zero-lag collaboration across the globe.',
    color: 'bg-cyan-500',
    bg: 'bg-cyan-50 dark:bg-cyan-950/20',
  },
  {
    icon: 'Globe',
    title: 'Keyboard Shortcuts',
    description: 'Power-user shortcuts for every tool. Press ? in the whiteboard to see them all.',
    color: 'bg-sky-500',
    bg: 'bg-sky-50 dark:bg-sky-950/20',
  },
];

const ICON_MAP = { Pen, Users, MessageSquare, Share2, Shield, Zap, Video, Palette, Globe };

const STEPS = [
  {
    step: '01',
    title: 'Create or Join a Room',
    description: 'Sign up in seconds, then create a new whiteboard room or join an existing one with a room code.',
    icon: 'Sparkles',
  },
  {
    step: '02',
    title: 'Invite Your Team',
    description: 'Share the unique room ID with your teammates. They can join instantly from anywhere.',
    icon: 'Users',
  },
  {
    step: '03',
    title: 'Collaborate in Real-Time',
    description: 'Draw, chat, share screens, and video call together. Every stroke syncs instantly.',
    icon: 'Zap',
  },
];

const STEP_ICON_MAP = { Sparkles, Users, Zap };

const STATIC_TESTIMONIALS = [
  {
    name: 'Sarah Chen',
    role: 'Product Designer at Figma',
    text: 'CollabBoard has completely replaced our physical whiteboards. The real-time sync is flawless and the drawing tools feel incredibly natural.',
    rating: 5,
    color: 'bg-sky-500',
  },
  {
    name: 'Marcus Rodriguez',
    role: 'Engineering Lead at Stripe',
    text: 'We use CollabBoard for all our sprint planning sessions. The sticky notes feature and screen sharing make remote standups feel like being in the same room.',
    rating: 5,
    color: 'bg-green-500',
  },
  {
    name: 'Emily Nakamura',
    role: 'Teacher at Stanford',
    text: 'My students love the interactive whiteboard. The video call integration means I can teach and draw simultaneously. Game changer for online education.',
    rating: 5,
    color: 'bg-cyan-500',
  },
];

/* ═══════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════ */
const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [userReviews, setUserReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState({ type: '', msg: '' });

  const fetchReviews = () => {
    reviewService.getReviews().then(res => {
      if (res && res.reviews) {
        setUserReviews(res.reviews);
      }
    }).catch(err => console.error("Error fetching reviews:", err));
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    setReviewLoading(true);
    setReviewFeedback({ type: '', msg: '' });
    try {
      await reviewService.createReview(reviewRating, reviewComment);
      setReviewFeedback({ type: 'success', msg: 'Thank you! Your review has been submitted.' });
      setReviewComment('');
      setReviewRating(5);
      fetchReviews(); // Refresh the reviews list
      setTimeout(() => setReviewFeedback({ type: '', msg: '' }), 4000);
    } catch (err) {
      setReviewFeedback({ type: 'error', msg: err.response?.data?.message || 'Failed to submit review' });
    } finally {
      setReviewLoading(false);
    }
  };

  const subtitle = useTypewriter(
    'A powerful whiteboard where teams draw, brainstorm, and bring ideas to life together on CollabBoard.',
    30,
    800
  );

  const stat1 = useCounter(500, 2200);
  const stat2 = useCounter(10, 1800);
  const stat3 = useCounter(99, 2000);

  // Use memoized references to the static data
  const features = FEATURES;
  const steps = STEPS;
  const testimonials = STATIC_TESTIMONIALS;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white overflow-hidden">
      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="h-[2px] bg-sky-500" />
        <div className="bg-white/70 dark:bg-gray-950/70 backdrop-blur-2xl border-b border-gray-200/40 dark:border-gray-800/40 shadow-sm shadow-gray-200/20 dark:shadow-black/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/25 group-hover:shadow-sky-500/40 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <Pen className="w-5 h-5 text-white transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white dark:border-gray-950 animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-extrabold text-sky-600 dark:text-sky-400 tracking-tight">
                    CollabBoard
                  </span>
                  <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 -mt-0.5 tracking-wider uppercase">
                    CollabBoard
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
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-sky-500 rounded-full transition-all duration-300 group-hover:w-3/4" />
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
                    className="group inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-95 cursor-pointer"
                  >
                    Dashboard
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl cursor-pointer"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="group inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-95 cursor-pointer"
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
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-sky-100/40 dark:bg-sky-950/15 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-96 h-96 bg-green-100/30 dark:bg-green-950/15 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-cyan-100/30 dark:bg-cyan-950/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-96 bg-slate-50/50 dark:bg-slate-900/10" />
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
            <div className="animate-fade-in-down inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-50 dark:bg-slate-900 border border-sky-200/50 dark:border-slate-800 text-sky-700 dark:text-sky-300 text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4 animate-pulse" />
              Collaborate & Create on CollabBoard
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
              </span>
            </div>

            <h1 className="animate-fade-in-up text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
              <span className="block">Collaborate &</span>
              <span className="block text-sky-500">
                Create Together
              </span>
            </h1>

            <p className="animate-fade-in-up delay-200 text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed min-h-[56px]">
              {subtitle}<span className="inline-block w-[2px] h-5 bg-sky-500 ml-0.5 align-middle animate-pulse" />
            </p>

            <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to={isAuthenticated ? '/dashboard' : '/register'}
                className="group inline-flex items-center gap-2 px-8 py-4 bg-sky-500 hover:bg-sky-600 text-white text-lg font-semibold rounded-2xl shadow-xl shadow-sky-500/20 hover:shadow-sky-500/30 transition-all hover:-translate-y-1 hover:scale-[1.02] cursor-pointer"
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Start Drawing Free'}
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
                <div className="text-2xl sm:text-4xl font-extrabold text-sky-500 transition-transform group-hover:scale-110">
                  {stat1.count}+
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">Teams</div>
              </div>
              <div className="w-px h-10 bg-gray-200 dark:bg-gray-700" />
              <div ref={stat2.ref} className="text-center group cursor-default">
                <div className="text-2xl sm:text-4xl font-extrabold text-green-500 transition-transform group-hover:scale-110">
                  {stat2.count}K+
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">Boards Created</div>
              </div>
              <div className="w-px h-10 bg-gray-200 dark:bg-gray-700" />
              <div ref={stat3.ref} className="text-center group cursor-default">
                <div className="text-2xl sm:text-4xl font-extrabold text-cyan-500 transition-transform group-hover:scale-110">
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
                  <path d="M100,200 Q200,100 300,200 T500,200" stroke="#38bdf8" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7">
                    <animate attributeName="stroke-dashoffset" from="400" to="0" dur="3s" fill="freeze" />
                    <animate attributeName="stroke-dasharray" values="0 400;400 0" dur="3s" fill="freeze" />
                  </path>
                  <path d="M150,250 Q250,150 350,250 T550,250" stroke="#4ade80" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5">
                    <animate attributeName="stroke-dashoffset" from="400" to="0" dur="3s" begin="0.5s" fill="freeze" />
                    <animate attributeName="stroke-dasharray" values="0 400;400 0" dur="3s" begin="0.5s" fill="freeze" />
                  </path>
                  <rect x="450" y="80" width="200" height="120" rx="12" stroke="#facc15" strokeWidth="2" fill="#facc1520" opacity="0">
                    <animate attributeName="opacity" from="0" to="1" dur="0.5s" begin="1.5s" fill="freeze" />
                  </rect>
                  <circle cx="200" cy="150" r="50" stroke="#2dd4bf" strokeWidth="2" fill="#2dd4bf20" opacity="0">
                    <animate attributeName="opacity" from="0" to="1" dur="0.5s" begin="1s" fill="freeze" />
                  </circle>
                  <text x="490" y="135" fill="#ca8a04" fontSize="14" fontWeight="600" opacity="0">
                    <animate attributeName="opacity" from="0" to="1" dur="0.5s" begin="2s" fill="freeze" />
                    Brainstorm
                  </text>
                  <text x="490" y="160" fill="#ca8a04b0" fontSize="11" opacity="0">
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
                  <defs></defs>
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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 dark:bg-slate-900 border border-sky-200/50 dark:border-slate-850 text-sky-750 dark:text-sky-300 text-sm font-medium mb-4">
              <Layers className="w-4 h-4" />
              Features
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything you need to{' '}
              <span className="text-sky-500">
                collaborate
              </span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Packed with powerful features designed for team creativity
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const IconComp = ICON_MAP[feature.icon];
              return (
              <div
                key={feature.title}
                className={`group animate-fade-in-up relative p-6 rounded-2xl ${feature.bg} border border-gray-200/50 dark:border-gray-800/50 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl`}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className={`inline-flex p-3 rounded-xl ${feature.color} text-white shadow-lg mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                  {IconComp && <IconComp className="w-6 h-6" />}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
            })}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-slate-900 border border-green-200/50 dark:border-slate-800 text-green-700 dark:text-green-300 text-sm font-medium mb-4">
              <Zap className="w-4 h-4" />
              How It Works
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Get started in{' '}
              <span className="text-green-500">
                3 simple steps
              </span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              From sign-up to collaboration in under a minute
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((item, index) => {
              const StepIcon = STEP_ICON_MAP[item.icon];
              return (
              <div key={item.step} className="relative group animate-fade-in-up" style={{ animationDelay: `${index * 0.15}s` }}>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-sky-200 dark:bg-slate-700 -translate-x-4 z-0" />
                )}
                <div className="relative z-10 p-6 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/80 hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 group-hover:border-blue-200 dark:group-hover:border-blue-800/50">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-500 text-white text-lg font-bold mb-4 shadow-lg shadow-sky-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                    {StepIcon && <StepIcon className="w-6 h-6" />}
                  </div>
                  <div className="text-xs font-bold text-sky-500 dark:text-sky-400 mb-2 tracking-wider">STEP {item.step}</div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
            })}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section id="testimonials" className="py-20 sm:py-32 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-slate-900 border border-green-200/50 dark:border-slate-800 text-green-700 dark:text-green-300 text-sm font-medium mb-4">
              <Star className="w-4 h-4" />
              Testimonials
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Loved by{' '}
              <span className="text-green-500">
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
                  <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
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

      {/* ─── USER REVIEWS (DYNAMIC) ─── */}
      <section className="py-20 sm:py-32 border-t border-gray-200/40 dark:border-gray-800/40 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-55 dark:bg-slate-900 border border-sky-200/50 dark:border-slate-800 text-sky-700 dark:text-sky-300 text-sm font-medium mb-4">
              <Star className="w-4 h-4" />
              User Reviews
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Feedback from our <span className="text-sky-500">community</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Hear directly from users who build and collaborate on CollabBoard
            </p>
          </div>

          {userReviews.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No reviews yet. Be the first to leave a review from your Dashboard!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {userReviews.map((r, i) => (
                <div
                  key={r._id || i}
                  className="animate-fade-in-up relative p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-gray-200/80 dark:border-gray-700/80 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
                  style={{ animationDelay: `${i * 0.12}s` }}
                >
                  <div className="absolute top-4 right-4 text-4xl text-gray-200 dark:text-gray-700/50 font-serif leading-none select-none">"</div>
                  
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: r.rating || 5 }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>

                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6 relative z-10">
                    "{r.comment}"
                  </p>

                  <div className="flex items-center gap-3">
                    {r.user?.avatar ? (
                      <img src={r.user.avatar} alt={r.user.username} className="w-10 h-10 rounded-full object-cover shadow-md" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {(r.user?.username || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{r.user?.username || 'Anonymous'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{r.user?.email || 'User'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── LEAVE A REVIEW (authenticated only) ─── */}
      {isAuthenticated && (
        <section className="py-16 sm:py-20 border-t border-gray-200/40 dark:border-gray-800/40 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-50 dark:bg-slate-900 border border-yellow-200/50 dark:border-slate-800 text-yellow-700 dark:text-yellow-300 text-sm font-medium mb-4">
                <Star className="w-4 h-4" />
                Share Your Experience
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">
                Leave a <span className="text-yellow-500">Review</span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Tell us what you think about CollabBoard
              </p>
            </div>

            <form
              onSubmit={handleSubmitReview}
              className="animate-fade-in-up bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 p-6 sm:p-8 shadow-lg"
            >
              {/* Feedback banners */}
              {reviewFeedback.type === 'success' && (
                <div className="mb-5 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-green-600 dark:text-green-400 rounded-xl text-sm flex items-center gap-2 animate-fade-in-up">
                  ✅ {reviewFeedback.msg}
                </div>
              )}
              {reviewFeedback.type === 'error' && (
                <div className="mb-5 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center gap-2 animate-fade-in-up">
                  ❌ {reviewFeedback.msg}
                </div>
              )}

              {/* Star Rating */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Rating
                </label>
                <div className="flex gap-2 text-3xl">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="hover:scale-125 transition-transform text-yellow-400 cursor-pointer focus:outline-none"
                      aria-label={`Rate ${star} stars`}
                    >
                      {star <= reviewRating ? '★' : '☆'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Review
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all resize-none"
                  placeholder="Share your experience using CollabBoard..."
                  maxLength={500}
                  required
                />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">{reviewComment.length}/500</p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={reviewLoading || !reviewComment.trim()}
                className="group w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 transition-all hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
              >
                {reviewLoading ? (
                  <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Send className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                )}
                {reviewLoading ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </section>
      )}

      {/* ─── CTA ─── */}
      <section className="py-20 sm:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden animate-fade-in-up">
            <div className="absolute inset-0 bg-sky-600" />
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
              <p className="text-blue-155 text-lg max-w-xl mx-auto mb-8 text-sky-100">
                Join thousands of teams who use CollabBoard to brainstorm, plan, and create together.
              </p>
              <Link
                to={isAuthenticated ? '/dashboard' : '/register'}
                className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-sky-700 hover:text-sky-850 text-lg font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 hover:scale-[1.02] cursor-pointer"
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Get Started — It\'s Free'}
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
                <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center">
                  <Pen className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold text-sky-600 dark:text-sky-400">
                  CollabBoard
                </span>
              </Link>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm leading-relaxed">
                A whiteboard platform for teams to draw, brainstorm,
                and create together from anywhere in the world.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Product</h4>
              <ul className="space-y-3">
                <li><a href="#features" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#testimonials" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Testimonials</a></li>
                <li><Link to={isAuthenticated ? '/dashboard' : '/register'} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">{isAuthenticated ? 'Dashboard' : 'Get Started'}</Link></li>
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
