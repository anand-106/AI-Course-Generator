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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Main Card */}
      <div className="relative w-full max-w-4xl h-auto perspective-1000 z-10">
        <div className="relative w-full">
          {/* Card Container */}
          <div className="relative bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden min-h-[600px]">

            {/* Blue Section - Animated */}
            <div
              className={`absolute top-0 left-0 h-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl transition-all duration-700 ease-in-out shadow-xl z-20 ${isTransitioning
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
                        <h1 className="text-5xl font-extrabold mb-8 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-purple-100">
                          COURSEGEN
                        </h1>
                        <p className="text-blue-100 mb-8 text-center text-lg max-w-xs leading-relaxed">
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
                        <h1 className="text-5xl font-extrabold mb-8 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-purple-100">
                          COURSEGEN
                        </h1>
                        <p className="text-blue-100 mb-8 text-center text-lg max-w-xs leading-relaxed">
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
                        <h3 className="text-3xl font-bold text-gray-800 mb-2">Sign In</h3>
                        <p className="text-gray-500">Access your personalized learning path</p>
                      </div>

                      {error && (
                        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-center gap-3 animate-shake shadow-sm">
                          <AlertCircle className="w-5 h-5 text-red-500" />
                          <p className="text-red-700 text-sm font-medium">{error}</p>
                        </div>
                      )}

                      {success && (
                        <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-r-xl flex items-center gap-3 shadow-sm">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          <p className="text-green-700 text-sm font-medium">{success}</p>
                        </div>
                      )}

                      <div className="space-y-5">
                        <div className="relative group">
                          <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3.5 pl-12 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 text-gray-800 placeholder-gray-400 group-hover:bg-white"
                            required
                            disabled={loading}
                          />
                          <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-hover:text-blue-500 transition-colors" />
                        </div>

                        <div className="relative group">
                          <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3.5 pl-12 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 text-gray-800 placeholder-gray-400 group-hover:bg-white"
                            required
                            disabled={loading}
                          />
                          <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-hover:text-blue-500 transition-colors" />
                        </div>

                        <div className="text-right">
                          <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                            Forgot Password?
                          </a>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-3.5 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                            <div className="w-full border-t border-gray-200"></div>
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-gray-500">Or continue with</span>
                          </div>
                        </div>

                        <div className="flex justify-center space-x-4">
                          <button
                            type="button"
                            className="w-12 h-12 bg-white border border-gray-200 rounded-2xl flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 hover:scale-110 transition-all duration-300 shadow-sm hover:shadow-md group"
                          >
                            <FaGoogle className="w-5 h-5 text-gray-600 group-hover:text-blue-500 transition-colors" />
                          </button>
                          <button
                            type="button"
                            className="w-12 h-12 bg-white border border-gray-200 rounded-2xl flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 hover:scale-110 transition-all duration-300 shadow-sm hover:shadow-md group"
                          >
                            <FaLinkedin className="w-5 h-5 text-gray-600 group-hover:text-blue-700 transition-colors" />
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleSignup} className="space-y-6">
                      <div className="text-center mb-8">
                        <h3 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h3>
                        <p className="text-gray-500">Join our learning community today</p>
                      </div>

                      {error && (
                        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-center gap-3 animate-shake shadow-sm">
                          <AlertCircle className="w-5 h-5 text-red-500" />
                          <p className="text-red-700 text-sm font-medium">{error}</p>
                        </div>
                      )}

                      {success && (
                        <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-r-xl flex items-center gap-3 shadow-sm">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          <p className="text-green-700 text-sm font-medium">{success}</p>
                        </div>
                      )}

                      <div className="space-y-5">
                        <div className="relative group">
                          <input
                            type="text"
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3.5 pl-12 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 text-gray-800 placeholder-gray-400 group-hover:bg-white"
                            required
                            disabled={loading}
                          />
                          <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-hover:text-blue-500 transition-colors" />
                        </div>

                        <div className="relative group">
                          <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3.5 pl-12 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 text-gray-800 placeholder-gray-400 group-hover:bg-white"
                            required
                            disabled={loading}
                          />
                          <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-hover:text-blue-500 transition-colors" />
                        </div>

                        <div className="relative group">
                          <input
                            type="password"
                            placeholder="Create Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3.5 pl-12 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 text-gray-800 placeholder-gray-400 group-hover:bg-white"
                            required
                            disabled={loading}
                            minLength={6}
                          />
                          <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-hover:text-blue-500 transition-colors" />
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-3.5 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                            <div className="w-full border-t border-gray-200"></div>
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-gray-500">Or continue with</span>
                          </div>
                        </div>

                        <div className="flex justify-center space-x-4">
                          <button
                            type="button"
                            className="w-12 h-12 bg-white border border-gray-200 rounded-2xl flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 hover:scale-110 transition-all duration-300 shadow-sm hover:shadow-md group"
                          >
                            <FaGoogle className="w-5 h-5 text-gray-600 group-hover:text-blue-500 transition-colors" />
                          </button>
                          <button
                            type="button"
                            className="w-12 h-12 bg-white border border-gray-200 rounded-2xl flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 hover:scale-110 transition-all duration-300 shadow-sm hover:shadow-md group"
                          >
                            <FaLinkedin className="w-5 h-5 text-gray-600 group-hover:text-blue-700 transition-colors" />
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
