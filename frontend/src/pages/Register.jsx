import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Shield, UserPlus, KeyRound, Mail, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ward_staff',
    otp: ''
  });
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);

  const { register, sendOTP } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'otp') {
      setFormData(prev => ({ ...prev, [name]: value.replace(/\D/g, '') }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSendOTP = async () => {
    setError('');
    setSuccessMsg('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      setError('Institutional email is required.');
      return;
    }
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please use a valid medical domain email.');
      return;
    }

    setIsSendingOTP(true);
    try {
      const res = await sendOTP(formData.email.trim().toLowerCase());
      setSuccessMsg(res.message || 'Verification code dispatched to your inbox.');
      setOtpSent(true);
    } catch (err) {
      setError(err.message || 'OTP dispatch failed. Service unreachable.');
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsSubmitting(true);

    if (!otpSent) {
      setError('Email verification required.');
      setIsSubmitting(false);
      return;
    }

    if (formData.otp.length !== 6) {
      setError('6-digit security code required.');
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
        otp: formData.otp
      };

      await register(payload);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Check your audit logs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center py-8 md:py-16 px-4 md:px-6 font-sans text-slate-900 overflow-x-hidden transition-all">
      <div className="absolute top-0 left-0 w-full h-1 bg-blue-900/10">
        <div className="h-full bg-blue-900 transition-all duration-500" style={{ width: otpSent ? '50%' : '20%' }}></div>
      </div>

      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex bg-blue-900 p-2.5 rounded-2xl shadow-xl shadow-blue-900/20 mb-6 hover:scale-105 transition-transform">
            <Activity size={32} className="text-white" />
          </Link>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">WardWatch Onboarding</h2>
          <p className="text-slate-400 text-sm mt-1 font-medium italic">Clinical Capacity Management Systems</p>
        </div>

        <div className="bg-white p-6 md:p-10 rounded-3xl shadow-2xl shadow-slate-200/60 border border-slate-100 relative">
          {/* x */}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center space-x-3 text-red-700 animate-in slide-in-from-top-4 duration-300">
              <Shield className="shrink-0" size={18} />
              <p className="text-xs font-bold uppercase tracking-tight">{error}</p>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center space-x-3 text-emerald-700 animate-in slide-in-from-top-4 duration-300">
              <CheckCircle2 className="shrink-0" size={18} />
              <p className="text-xs font-bold uppercase tracking-tight">{successMsg}</p>
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                Institutional Email
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-grow">
                  <input
                    name="email"
                    type="email"
                    required
                    readOnly={otpSent}
                    className={`w-full pl-10 pr-4 py-3.5 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none ${otpSent ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-dashed' : 'bg-slate-50/50'}`}
                    placeholder="clinician@hospital.org"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  <Mail className="absolute left-3.5 top-[15px] text-slate-300" size={18} />
                </div>

                {!otpSent ? (
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={isSendingOTP || !formData.email}
                    className="w-full sm:w-auto shrink-0 bg-blue-900 hover:bg-black text-white font-bold px-6 py-3.5 rounded-2xl text-xs transition-all disabled:opacity-30 disabled:grayscale flex justify-center items-center shadow-lg active:scale-95"
                  >
                    {isSendingOTP ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Verify"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setSuccessMsg(''); setError(''); setFormData(p => ({ ...p, otp: '' })) }}
                    className="w-full sm:w-auto shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-3.5 rounded-2xl text-xs transition-all border border-slate-200"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {otpSent && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
                <label className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] ml-1">
                  Confirmation Code
                </label>
                <div className="relative">
                  <input
                    name="otp"
                    type="text"
                    required
                    maxLength="6"
                    className="w-full pl-10 pr-4 py-4 bg-blue-50/30 border-2 border-blue-100 rounded-2xl text-2xl tracking-[0.5em] font-mono text-center focus:border-blue-500 outline-none transition-all"
                    placeholder="000000"
                    value={formData.otp}
                    onChange={handleChange}
                  />
                  <KeyRound className="absolute left-4 top-[18px] text-blue-300" size={20} />
                </div>
                <p className="text-[9px] text-slate-400 mt-1 pl-1 font-bold italic tracking-wider">Check your verified mailbox for the 6-digit sequence.</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                  Legal Name
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                  placeholder="Dr. Alexander Wright"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                  Clinical Designation
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none appearance-none"
                >
                  <option value="ward_staff">Ward Staff</option>
                  <option value="ward_doctor">Ward Doctor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                  Security Password
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !otpSent}
              className={`group w-full flex justify-center items-center space-x-3 py-4.5 px-4 rounded-2xl text-base font-black text-white transition-all transform-gpu active:scale-[0.98] ${isSubmitting || !otpSent ? 'opacity-30 cursor-not-allowed bg-slate-400' : 'bg-blue-900 hover:bg-black shadow-2xl shadow-blue-900/30'
                }`}
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <UserPlus size={20} />
                  <span>Secure Registration</span>
                  <ArrowRight size={18} className="translate-x-0 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-slate-400">
            Already authenticated? <Link to="/login" className="text-blue-900 font-bold hover:underline transition-all">Sign In</Link>
          </p>
        </div>

        <div className="mt-10 flex items-center justify-center gap-6 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
           <Activity size={24} />
           <Shield size={24} />
           <CheckCircle2 size={24} />
        </div>
      </div>
    </div>
  );
}
