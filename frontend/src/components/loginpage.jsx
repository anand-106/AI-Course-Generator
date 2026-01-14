import React, { useState } from 'react';
import { User, Lock, Mail, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { FaGoogle, FaLinkedin } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { signin, signup } = useAuth();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleTransition = (toLogin) => {
    setIsTransitioning(true);
    setError('');
    setSuccess('');
    setName('');
    setEmail('');
    setPassword('');

    setTimeout(() => {
      setIsLogin(toLogin);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    }, 800);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!name || !email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const result = await signup(name, email, password);
    setLoading(false);

    if (result.success) {
      setSuccess('Account created successfully! Please sign in.');
      setTimeout(() => {
        handleTransition(true);
      }, 1500);
    } else {
      setError(result.error || 'Signup failed. Please try again.');
    }
  };

  const handleSignin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    const result = await signin(email, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Signin failed. Please check your credentials.');
    }
    // If successful, the AuthContext will update and redirect will happen via App.jsx
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-600/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-600/20 rounded-full blur-[100px] animate-pulse delay-2000"></div>
      </div>

      {/* Main Card */}
      <div className="relative w-full max-w-5xl h-[700px] shadow-2xl rounded-[40px] flex overflow-hidden glass-card animate-fade-in-up">
        <div className="relative w-full">
          {/* Card Container */}
          <div className="relative bg-slate-900/60 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden min-h-[600px] h-full">

            {/* Blue Section - Animated */}
            <div
              className={`absolute top-0 left-0 h-full bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 rounded-3xl transition-all duration-700 ease-in-out shadow-2xl z-20 ${isTransitioning
                ? 'w-full'
                : isLogin
                  ? 'w-1/2 rounded-r-[100px]'
                  : 'w-1/2 translate-x-full rounded-l-[100px]'
                }`}
            >
              <div className="h-full flex flex-col justify-center items-center text-white p-8 relative z-10">
                {!isTransitioning && (
                  <div className={`transition-opacity duration-300 flex flex-col items-center ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                    {isLogin ? (
                      <>
                        <h2 className="text-4xl font-bold mb-6 tracking-tight">Welcome Back!</h2>
                        <h1 className="text-5xl font-extrabold mb-8 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200 drop-shadow-lg">
                          COURSEGEN
                        </h1>
                        <p className="text-purple-100 mb-8 text-center text-lg max-w-xs leading-relaxed font-light">
                          Ready to start your learning journey? Create an account today.
                        </p>
                        <button
                          onClick={() => handleTransition(false)}
                          className="px-8 py-3 bg-white/10 backdrop-blur-md border-2 border-white/30 rounded-full hover:bg-white/20 hover:scale-105 transition-all duration-300 font-semibold shadow-lg"
                        >
                          Sign Up
                        </button>
                      </>
                    ) : (
                      <>
                        <h2 className="text-4xl font-bold mb-6 tracking-tight">Hello Friend!</h2>
                        <h1 className="text-5xl font-extrabold mb-8 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200 drop-shadow-lg">
                          COURSEGEN
                        </h1>
                        <p className="text-purple-100 mb-8 text-center text-lg max-w-xs leading-relaxed font-light">
                          Already have an account? Sign in!
                        </p>
                        <button
                          onClick={() => handleTransition(true)}
                          className="px-8 py-3 bg-white/10 backdrop-blur-md border-2 border-white/30 rounded-full hover:bg-white/20 hover:scale-105 transition-all duration-300 font-semibold shadow-lg"
                        >
                          Sign In
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Form Section */}
            <div className={`absolute top-0 h-full w-1/2 flex items-center justify-center p-8 transition-opacity duration-300 ${isLogin ? 'right-0' : 'left-0'
              }`}>
              {!isTransitioning && (
                <div className={`w-full max-w-sm transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                  {isLogin ? (
                    <form onSubmit={handleSignin} className="space-y-6">
                      <div className="text-center mb-8">
                        <h3 className="text-3xl font-bold text-white mb-2">Sign In</h3>
                        <p className="text-slate-400">Access your personalized learning path</p>
                      </div>

                      {error && (
                        <div className="p-4 bg-red-500/10 border-l-4 border-red-500 rounded-r-xl flex items-center gap-3 animate-shake shadow-sm">
                          <AlertCircle className="w-5 h-5 text-red-400" />
                          <p className="text-red-300 text-sm font-medium">{error}</p>
                        </div>
                      )}

                      {success && (
                        <div className="p-4 bg-green-500/10 border-l-4 border-green-500 rounded-r-xl flex items-center gap-3 shadow-sm">
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                          <p className="text-green-300 text-sm font-medium">{success}</p>
                        </div>
                      )}

                      <div className="space-y-5">
                        <div className="relative group">
                          <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="glass-input w-full px-4 py-3.5 pl-12 rounded-2xl focus:outline-none focus:ring-2 transition-all duration-300 group-hover:bg-slate-800/70"
                            required
                            disabled={loading}
                          />
                          <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5 group-hover:text-purple-400 transition-colors" />
                        </div>

                        <div className="relative group">
                          <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="glass-input w-full px-4 py-3.5 pl-12 rounded-2xl focus:outline-none focus:ring-2 transition-all duration-300 group-hover:bg-slate-800/70"
                            required
                            disabled={loading}
                          />
                          <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5 group-hover:text-purple-400 transition-colors" />
                        </div>

                        <div className="text-right">
                          <a href="#" className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors">
                            Forgot Password?
                          </a>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white py-3.5 rounded-2xl font-bold text-lg shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Signing In...</span>
                            </>
                          ) : (
                            'Sign In'
                          )}
                        </button>

                        <div className="relative my-8">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-700/50"></div>
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-slate-900 text-slate-500 rounded-full">Or continue with</span>
                          </div>
                        </div>

                        <div className="flex justify-center space-x-4">
                          <button
                            type="button"
                            className="w-12 h-12 bg-slate-800/50 border border-slate-700/50 rounded-2xl flex items-center justify-center hover:bg-slate-700 hover:border-slate-600 hover:scale-110 transition-all duration-300 shadow-lg group"
                          >
                            <FaGoogle className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                          </button>
                          <button
                            type="button"
                            className="w-12 h-12 bg-slate-800/50 border border-slate-700/50 rounded-2xl flex items-center justify-center hover:bg-slate-700 hover:border-slate-600 hover:scale-110 transition-all duration-300 shadow-lg group"
                          >
                            <FaLinkedin className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleSignup} className="space-y-6">
                      <div className="text-center mb-8">
                        <h3 className="text-3xl font-bold text-white mb-2">Create Account</h3>
                        <p className="text-slate-400">Join our learning community today</p>
                      </div>

                      {error && (
                        <div className="p-4 bg-red-500/10 border-l-4 border-red-500 rounded-r-xl flex items-center gap-3 animate-shake shadow-sm">
                          <AlertCircle className="w-5 h-5 text-red-400" />
                          <p className="text-red-300 text-sm font-medium">{error}</p>
                        </div>
                      )}

                      {success && (
                        <div className="p-4 bg-green-500/10 border-l-4 border-green-500 rounded-r-xl flex items-center gap-3 shadow-sm">
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                          <p className="text-green-300 text-sm font-medium">{success}</p>
                        </div>
                      )}

                      <div className="space-y-5">
                        <div className="relative group">
                          <input
                            type="text"
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="glass-input w-full px-4 py-3.5 pl-12 rounded-2xl focus:outline-none focus:ring-2 transition-all duration-300 group-hover:bg-slate-800/70"
                            required
                            disabled={loading}
                          />
                          <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5 group-hover:text-purple-400 transition-colors" />
                        </div>

                        <div className="relative group">
                          <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="glass-input w-full px-4 py-3.5 pl-12 rounded-2xl focus:outline-none focus:ring-2 transition-all duration-300 group-hover:bg-slate-800/70"
                            required
                            disabled={loading}
                          />
                          <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5 group-hover:text-purple-400 transition-colors" />
                        </div>

                        <div className="relative group">
                          <input
                            type="password"
                            placeholder="Create Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="glass-input w-full px-4 py-3.5 pl-12 rounded-2xl focus:outline-none focus:ring-2 transition-all duration-300 group-hover:bg-slate-800/70"
                            required
                            disabled={loading}
                            minLength={6}
                          />
                          <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5 group-hover:text-purple-400 transition-colors" />
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white py-3.5 rounded-2xl font-bold text-lg shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Creating Account...</span>
                            </>
                          ) : (
                            'Create Account'
                          )}
                        </button>

                        <div className="relative my-8">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-700/50"></div>
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-slate-900 text-slate-500 rounded-full">Or continue with</span>
                          </div>
                        </div>

                        <div className="flex justify-center space-x-4">
                          <button
                            type="button"
                            className="w-12 h-12 bg-slate-800/50 border border-slate-700/50 rounded-2xl flex items-center justify-center hover:bg-slate-700 hover:border-slate-600 hover:scale-110 transition-all duration-300 shadow-lg group"
                          >
                            <FaGoogle className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                          </button>
                          <button
                            type="button"
                            className="w-12 h-12 bg-slate-800/50 border border-slate-700/50 rounded-2xl flex items-center justify-center hover:bg-slate-700 hover:border-slate-600 hover:scale-110 transition-all duration-300 shadow-lg group"
                          >
                            <FaLinkedin className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
