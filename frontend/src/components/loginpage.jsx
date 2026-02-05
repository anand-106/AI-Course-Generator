import React, { useState, useEffect } from 'react';
import {
  User, Lock, Mail, Loader2, AlertCircle, CheckCircle2,
  Sparkles, BookOpen, BrainCircuit, GraduationCap,
  ArrowRight, ChevronRight, X, PlayCircle, Star, Quote
} from 'lucide-react';
import { FaGoogle, FaLinkedin, FaTwitter, FaGithub } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

// --- COMPONENTS ---

const Navbar = ({ onOpenAuth }) => (
  <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-lg border-b border-white/5">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-20">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-white/10">
            <Sparkles className="w-6 h-6 text-black" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">
            COURSEGEN
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
          <a href="#features" className="hover:text-white transition-colors duration-300">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors duration-300">How it Works</a>
          <a href="#testimonials" className="hover:text-white transition-colors duration-300">Motivation</a>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => onOpenAuth(true)}
            className="hidden md:block text-neutral-400 hover:text-white font-medium transition-colors duration-300"
          >
            Sign In
          </button>
          <button
            onClick={() => onOpenAuth(false)}
            className="px-6 py-2.5 bg-white text-black rounded-full font-bold hover:bg-neutral-200 transition-all transform hover:scale-105 shadow-lg shadow-white/5"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  </nav>
);

const Hero = ({ onOpenAuth }) => (
  <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-black">
    {/* Minimalist Background Elements */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none opacity-20">
      <div className="absolute top-20 left-10 w-[500px] h-[500px] bg-white rounded-full blur-[150px] animate-pulse" />
      <div className="absolute bottom-20 right-10 w-[400px] h-[400px] bg-neutral-800 rounded-full blur-[150px] animate-pulse delay-1000" />
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
      <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight animate-slide-up text-white">
        Master Any Subject <br />
        <span className="text-neutral-500">
          In Minutes.
        </span>
      </h1>

      <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-12 leading-relaxed animate-slide-up delay-100 font-light">
        Generate comprehensive, structured courses on any topic instantly.
        Powered by advanced AI for rapid mastery.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up delay-200">
        <button
          onClick={() => onOpenAuth(false)}
          className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-xl font-bold text-lg hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 shadow-xl shadow-white/5"
        >
          Start Learning Free
          <ArrowRight className="w-5 h-5" />
        </button>
        <button
          onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
          className="w-full sm:w-auto px-8 py-4 bg-neutral-900 text-white border border-white/10 rounded-xl font-bold text-lg hover:bg-neutral-800 transition-all flex items-center justify-center gap-2"
        >
          <PlayCircle className="w-5 h-5" />
          See How It Works
        </button>
      </div>

      {/* Stats - Monochrome */}
      <div className="mt-16 pt-8 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-8 animate-fade-in delay-300">
        {[
          { label: 'Courses Generated', value: '10k+' },
          { label: 'Active Learners', value: '5k+' },
          { label: 'Topics Covered', value: '∞' },
          { label: 'User Rating', value: '4.9/5' },
        ].map((stat, i) => (
          <div key={i} className="text-center">
            <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-xs text-neutral-500 uppercase tracking-widest font-medium">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Features = () => (
  <section id="features" className="py-24 bg-neutral-950 relative border-t border-white/5">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Why CourseGen?</h2>
        <p className="text-neutral-400 max-w-2xl mx-auto">Precision tools for modern learners.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {[
          {
            icon: <BrainCircuit className="w-8 h-8 text-white" />,
            title: "AI-Curated Content",
            desc: "Expertly structured modules generated instantly based on specific goals."
          },
          {
            icon: <PlayCircle className="w-8 h-8 text-white" />,
            title: "Smart Video Integration",
            desc: "Best tutorials from YouTube embedded directly into your lessons."
          },
          {
            icon: <GraduationCap className="w-8 h-8 text-white" />,
            title: "Interactive Quizzes",
            desc: "Test your knowledge after every module to ensure retention."
          }
        ].map((feature, i) => (
          <div key={i} className="p-8 rounded-2xl bg-black border border-white/10 hover:border-white/30 hover:bg-neutral-900 transition-all duration-300 group">
            <div className="w-16 h-16 rounded-xl bg-neutral-900 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-white/5">
              {feature.icon}
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
            <p className="text-neutral-400 leading-relaxed font-light">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const QuoteCard = ({ quote, author, active }) => (
  <div className={`absolute inset-0 transition-all duration-700 ease-in-out transform flex flex-col items-center justify-center px-4 ${active ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95 pointer-events-none'
    }`}>
    <Quote className="w-12 h-12 text-neutral-700 mb-6" />
    <p className="text-2xl md:text-4xl font-medium text-center text-white mb-8 max-w-4xl leading-tight">
      "{quote}"
    </p>
    <div className="flex items-center gap-3">
      <div className="w-8 h-px bg-white"></div>
      <span className="text-neutral-400 font-semibold tracking-wider uppercase text-sm">{author}</span>
      <div className="w-8 h-px bg-white"></div>
    </div>
  </div>
);

const MotivationCarousel = () => {
  const quotes = [
    { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
    { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
    { text: "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.", author: "Malcolm X" }
  ];
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % quotes.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="testimonials" className="py-24 relative overflow-hidden bg-black border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 relative h-[400px]">
        {quotes.map((q, i) => (
          <QuoteCard key={i} quote={q.text} author={q.author} active={i === current} />
        ))}
      </div>

      {/* Dots */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3">
        {quotes.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1 rounded-full transition-all duration-300 ${i === current ? 'bg-white w-8' : 'bg-neutral-800 w-2'}`}
          />
        ))}
      </div>
    </section>
  );
};

const HowItWorks = () => (
  <section id="how-it-works" className="py-24 bg-neutral-950 border-t border-white/5">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-20 animate-fade-in-up">
        <h2 className="text-4xl font-bold mb-4 text-white">How It Works</h2>
        <p className="text-neutral-400">Streamlined intelligence.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-12 relative">
        <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-px bg-gradient-to-r from-transparent via-neutral-700 to-transparent z-0"></div>

        {[
          { step: "01", title: "Enter Topic", desc: "Type what you want to learn. Be specific." },
          { step: "02", title: "AI Generation", desc: "Engine builds a custom structured course." },
          { step: "03", title: "Mastery", desc: "Learn, watch, read, and quiz yourself." }
        ].map((item, i) => (
          <div key={i} className="relative z-10 flex flex-col items-center text-center group">
            <div className="w-24 h-24 bg-black border border-neutral-800 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-6 shadow-xl group-hover:border-white transition-all duration-300">
              {item.step}
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white">{item.title}</h3>
            <p className="text-neutral-400 max-w-xs font-light">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-black border-t border-white/10 py-16">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid md:grid-cols-4 gap-12 mb-12">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-bold text-white">COURSEGEN</span>
          </div>
          <p className="text-neutral-500 max-w-sm mb-6">
            Empowering the world to learn through the power of minimalist artificial intelligence.
          </p>
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-400 hover:bg-white hover:text-black transition-all"><FaTwitter /></a>
            <a href="#" className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-400 hover:bg-white hover:text-black transition-all"><FaGithub /></a>
            <a href="#" className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-400 hover:bg-white hover:text-black transition-all"><FaLinkedin /></a>
          </div>
        </div>

        {/* Links removed for brevity but layout remains */}
      </div>
      <div className="pt-8 border-t border-neutral-900 text-center text-neutral-600 text-sm">
        © {new Date().getFullYear()} AI Course Generator. All rights reserved.
      </div>
    </div>
  </footer>
);

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  if (!isOpen) return null;

  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const { signin, signup } = useAuth();

  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Switch mode effect
  useEffect(() => {
    setIsLogin(initialMode === 'login');
    setError('');
    setSuccess('');
  }, [initialMode, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        if (!email || !password) throw new Error("Please fill in all fields");
        const res = await signin(email, password);
        if (!res.success) throw new Error(res.error);
      } else {
        if (!name || !email || !password) throw new Error("Please fill in all fields");
        if (password.length < 6) throw new Error("Password must be at least 6 characters");
        const res = await signup(name, email, password);
        if (!res.success) throw new Error(res.error);
        setSuccess("Account created! Switching to login...");
        setTimeout(() => setIsLogin(true), 1500);
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-white bg-neutral-900 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-neutral-400 text-sm">
              {isLogin ? 'Access your dashboard' : 'Join the platform'}
            </p>
          </div>

          {(error || success) && (
            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${error ? 'bg-neutral-900 text-red-400 border border-red-900' : 'bg-neutral-900 text-green-400 border border-green-900'}`}>
              {error ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              {error || success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative group">
                <User className="absolute left-4 top-3.5 w-5 h-5 text-neutral-500 group-focus-within:text-white transition-colors" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all placeholder:text-neutral-600"
                />
              </div>
            )}

            <div className="relative group">
              <Mail className="absolute left-4 top-3.5 w-5 h-5 text-neutral-500 group-focus-within:text-white transition-colors" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all placeholder:text-neutral-600"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-neutral-500 group-focus-within:text-white transition-colors" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all placeholder:text-neutral-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-bold py-3.5 rounded-xl transition-all shadow-lg hover:bg-neutral-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-neutral-900">
            <div className="flex flex-col gap-3">
              <button className="w-full bg-neutral-900 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors border border-neutral-800">
                <FaGoogle className="w-5 h-5" />
                Continue with Google
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-neutral-500">
            {isLogin ? (
              <>
                Don't have an account?{' '}
                <button onClick={() => setIsLogin(false)} className="text-white hover:underline font-medium">
                  Sign up free
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button onClick={() => setIsLogin(true)} className="text-white hover:underline font-medium">
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---

const LandingPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const handleOpenAuth = (isLogin = true) => {
    setAuthMode(isLogin ? 'login' : 'signup');
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-black text-neutral-200 selection:bg-white selection:text-black">
      <Navbar onOpenAuth={handleOpenAuth} />
      <main>
        <Hero onOpenAuth={handleOpenAuth} />
        <Features />
        <MotivationCarousel />
        <HowItWorks />
      </main>
      <Footer />
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </div>
  );
};

export default LandingPage;
