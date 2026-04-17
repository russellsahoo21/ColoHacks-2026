import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Shield, Loader2, Eye, EyeOff } from 'lucide-react'; // Added for better UX

const LoginForm = () => {
  // State for form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Logic to handle backend connection
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Explicit Input Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setError('Please enter your institutional email.');
      return;
    }
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid, verified email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await login(email.trim().toLowerCase(), password);
      navigate('/dashboard'); // Redirect after success
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#eef2f7] to-[#f8fafc] px-4">
      {/* Background Glow */}
      <div className="absolute w-[500px] h-[500px] bg-blue-100 rounded-full blur-3xl opacity-30 pointer-events-none"></div>

      {/* Card */}
      <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md p-8 border border-gray-200">
        {/* Left Accent */}
        <div className="absolute left-0 top-0 h-full w-[3px] bg-blue-700 rounded-l-2xl"></div>

        {/* Badge */}
        <div className="flex justify-center mb-4">
          <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1">
            🔒 Secure Clinical Environment
          </span>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-800">Clinician Access</h2>
        <p className="text-sm text-gray-500 mb-6">
          Please authenticate to access patient records and ward management tools.
        </p>

        {/* Error Message Display */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-600">
            <Shield size={16} />
            <p className="text-xs font-semibold">{error}</p>
          </div>
        )}

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Email / ID */}
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase" htmlFor="email">
              Institutional Email
            </label>
            <div className="flex items-center border border-gray-200 rounded-lg mt-1 px-3 py-2 bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500 transition">
              <span className="text-gray-400 mr-2">👤</span>
              <input
                id="email"
                type="email"
                required
                placeholder="dr.name@hospital.org"
                className="w-full bg-transparent outline-none text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between">
              <label className="text-[11px] font-semibold text-gray-500 uppercase" htmlFor="password">
                Password
              </label>
              <span className="text-xs text-blue-600 cursor-pointer hover:underline">
                Forgot Password?
              </span>
            </div>

            <div className="flex items-center border border-gray-200 rounded-lg mt-1 px-3 py-2 bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500 transition">
              <span className="text-gray-400 mr-2">🔒</span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                className="w-full bg-transparent outline-none text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full bg-gradient-to-r from-blue-700 to-blue-600 text-white py-2.5 rounded-lg font-semibold shadow-lg hover:scale-[1.02] transition duration-300 flex justify-center items-center gap-2 ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In →</span>
            )}
          </button>
        </form>

        {/* Warning */}
        <div className="mt-5 bg-red-50 border border-red-200 text-red-600 text-[10px] p-3 rounded-lg leading-tight">
          ⚠ Unauthorized access to this terminal is strictly prohibited. All
          activities are monitored and logged for clinical auditing purposes.
        </div>

        {/* Footer */}
        <p className="text-sm text-center mt-5 text-gray-600">
          Don’t have an account?{" "}
          <Link
            to="/register"
            className="text-blue-600 font-semibold hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;