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
    <div className="min-h-screen bg-[url('/images/auth_background.jpg')] bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="absolute inset-0">
        {/* Decorative elements in background */}
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-cyan-500/10 rounded-full blur-xl animate-pulse delay-1000"></div>
      </div>

      {/* Main Card */}
      <div className="relative w-full max-w-4xl h-auto perspective-1000">
        <div className="relative w-full">
          {/* Card Container */}
          <div className="relative bg-white/5 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/10 overflow-hidden min-h-[600px]">
            
            {/* Blue Section - Animated */}
            <div 
              className={`absolute top-0 left-0 h-full bg-gradient-to-br from-[#034a7a] to-[#012d52] rounded-3xl transition-all duration-700 ease-in-out ${
                isTransitioning 
                  ? 'w-full' 
                  : isLogin 
                    ? 'w-1/2 rounded-r-[100px]' 
                    : 'w-1/2 translate-x-full rounded-l-[100px]'
              }`}
            >
              <div className="h-full flex flex-col justify-center items-center text-white p-8 relative z-10">
                {!isTransitioning && (
                  <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                    {isLogin ? (
                      <>
                        <h2 className="text-4xl font-bold mb-4">Hello Welcome!</h2>
                        <p className="text-blue-100 mb-8 text-center">Don't have an account?</p>
                        <button 
                          onClick={() => handleTransition(false)}
                          className="ml-16 px-8 py-3 border-2 border-white/50 rounded-full hover:bg-white/10 transition-all duration-300 font-medium"
                        >
                          Register
                        </button>
                      </>
                    ) : (
                      <>
                        <h2 className="text-4xl font-bold mb-4">Welcome Back!</h2>
                        <p className="text-blue-100 mb-8 text-center">Already have an account?</p>
                        <button 
                          onClick={() => handleTransition(true)}
                          className="ml-16 px-8 py-3 border-2 border-white/50 rounded-full hover:bg-white/10 transition-all duration-300 font-medium"
                        >
                          Login
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Form Section */}
            <div className={`absolute top-0 h-full w-1/2 flex items-center justify-center p-8 ${
              isLogin ? 'right-0' : 'left-0'
            }`}>
              {!isTransitioning && (
                <div className={`w-full max-w-sm transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                  {isLogin ? (
                    <form onSubmit={handleSignin} className="space-y-6">
                      <h3 className="text-3xl font-bold text-white mb-8">Login</h3>
                      
                      {error && (
                        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3 animate-shake">
                          <AlertCircle className="w-5 h-5 text-red-400" />
                          <p className="text-red-200 text-sm">{error}</p>
                        </div>
                      )}

                      {success && (
                        <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-xl flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                          <p className="text-green-200 text-sm">{success}</p>
                        </div>
                      )}
                      
                      <div className="space-y-6">
                        <div className="relative">
                          <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 pl-12 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0456a1] focus:border-transparent transition-all duration-300 text-gray-800"
                            required
                            disabled={loading}
                          />
                          <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        </div>

                        <div className="relative">
                          <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 pl-12 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0456a1] focus:border-transparent transition-all duration-300 text-gray-800"
                            required
                            disabled={loading}
                          />
                          <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        </div>

                        <div className="text-center">
                          <a href="#" className="text-[#034a7a] hover:text-blue-800 text-sm">
                            Forgot Password?
                          </a>
                        </div>

                        <button 
                          type="submit"
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-[#012d52] to-[#012d52] text-white py-3 rounded-xl font-semibold hover:from-[#012d52] hover:to-[#034a7a] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Signing in...</span>
                            </>
                          ) : (
                            'Login'
                          )}
                        </button>

                        <div className="text-center">
                          <p className="text-gray-600 text-sm mb-4">or login with social platform</p>
                          <div className="flex justify-center space-x-4">
                            <button 
                              type="button"
                              className="w-8 h-8 bg-white/80 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-all duration-300 group"
                            >
                              <FaGoogle className="w-5 h-5 text-gray-700 group-hover:text-blue-500 transition-colors duration-300" />
                            </button>
                            <button 
                              type="button"
                              className="w-8 h-8 bg-white/80 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-all duration-300 group"
                            >
                              <FaLinkedin className="w-5 h-5 text-gray-700 group-hover:text-blue-600 transition-colors duration-300" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleSignup} className="space-y-6">
                      <h3 className="text-3xl font-bold text-white mb-8">Registration</h3>
                      
                      {error && (
                        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3 animate-shake">
                          <AlertCircle className="w-5 h-5 text-red-400" />
                          <p className="text-red-200 text-sm">{error}</p>
                        </div>
                      )}

                      {success && (
                        <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-xl flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                          <p className="text-green-200 text-sm">{success}</p>
                        </div>
                      )}
                      
                      <div className="space-y-6">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 pl-12 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0456a1] focus:border-transparent transition-all duration-300 text-gray-800"
                            required
                            disabled={loading}
                          />
                          <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        </div>

                        <div className="relative">
                          <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 pl-12 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0456a1] focus:border-transparent transition-all duration-300 text-gray-800"
                            required
                            disabled={loading}
                          />
                          <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        </div>

                        <div className="relative">
                          <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 pl-12 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0456a1] focus:border-transparent transition-all duration-300 text-gray-800"
                            required
                            disabled={loading}
                            minLength={6}
                          />
                          <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        </div>

                        <button 
                          type="submit"
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-[#012d52] to-[#012d52] text-white py-3 rounded-xl font-semibold hover:from-[#012d52] hover:to-[#034a7a] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Creating account...</span>
                            </>
                          ) : (
                            'Register'
                          )}
                        </button>

                        <div className="text-center">
                          <p className="text-gray-600 text-sm mb-4">or register with social platform</p>
                          <div className="flex justify-center space-x-4">
                            <button 
                              type="button"
                              className="w-8 h-8 bg-white/80 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-all duration-300 group"
                            >
                              <FaGoogle className="w-5 h-5 text-gray-700 group-hover:text-blue-500 transition-colors duration-300" />
                            </button>
                            <button 
                              type="button"
                              className="w-8 h-8 bg-white/80 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-all duration-300 group"
                            >
                              <FaLinkedin className="w-5 h-5 text-gray-700 group-hover:text-blue-600 transition-colors duration-300" />
                            </button>
                          </div>
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
