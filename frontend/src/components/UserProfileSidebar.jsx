import React from 'react';
import { X, User, Mail, Shield, LogOut, Calendar, Fingerprint, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UserProfileSidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const joinedDate = user.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'March 2026';

  return (
    <>
      {/* Backdrop with enhanced blur */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60] transition-all duration-500 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Premium Sliding Sidebar */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[380px] bg-white/95 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.1)] z-[70] transform transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col border-l border-slate-200/50 ${
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-90'
        }`}
      >
        {/* Header Section */}
        <div className="relative h-32 bg-gradient-to-br from-blue-900 to-indigo-950 p-6 flex flex-col justify-end">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-all hover:rotate-90"
          >
            <X size={18} />
          </button>
          <div className="flex items-center space-x-4">
             <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-2xl font-black text-blue-900 shadow-xl border-2 border-white/20">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight leading-none mb-1">{user.name}</h2>
              <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest opacity-80 flex items-center">
                <Shield size={10} className="mr-1" /> {user.role || 'System Admin'}
              </p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          
          {/* Identity Section */}
          <section>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Account Identity</h3>
            <div className="space-y-4">
              <ProfileDetail 
                icon={Fingerprint} 
                label="System Identifier" 
                value={user._id ? `#${user._id.slice(-8).toUpperCase()}` : '#ADMIN-77'} 
              />
              <ProfileDetail 
                icon={User} 
                label="Full Name" 
                value={user.name} 
              />
              <ProfileDetail 
                icon={Mail} 
                label="Registered Email" 
                value={user.email || 'not_provided@hospital.gov'} 
              />
            </div>
          </section>

          {/* Access & Security */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Management & Status</h3>
            </div>
            <div className="space-y-4">
              <ProfileDetail 
                icon={Activity} 
                label="Current Status" 
                value="Active & Online" 
                statusColor="text-green-600 bg-green-50 px-2 py-0.5 rounded-full inline-block"
              />
              <ProfileDetail 
                icon={Calendar} 
                label="Staff Since" 
                value={joinedDate} 
              />
            </div>
          </section>

          {/* Premium Banner */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 relative overflow-hidden group hover:border-blue-200 transition-colors shadow-sm">
            <div className="relative z-10">
              <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1">Clinic Central Access</p>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">Your account has global read/write access to all hospital wards under the WardWatch protocol.</p>
            </div>
            <div className="absolute -right-4 -bottom-4 text-blue-50 transition-transform group-hover:scale-110">
              <Shield size={80} strokeWidth={1} />
            </div>
          </div>
        </div>

        {/* Footer Action Section */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 backdrop-blur-sm">
            <button 
              onClick={logout}
              className="w-full flex justify-center items-center space-x-3 py-4 bg-white border border-red-100 text-red-600 font-black rounded-2xl shadow-sm hover:bg-red-50 hover:border-red-200 transition-all active:scale-[0.98]"
            >
              <LogOut size={18} />
              <span className="uppercase tracking-widest text-xs">Terminate Session</span>
            </button>
            <div className="mt-6 flex flex-col items-center">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">ColoHacks v2.4.0</p>
              <div className="mt-2 w-1 h-1 rounded-full bg-slate-300"></div>
            </div>
        </div>
      </div>
    </>
  );
}

function ProfileDetail({ icon: Icon, label, value, statusColor = "text-slate-800" }) {
  return (
    <div className="group flex items-center p-3 rounded-xl transition-all hover:bg-slate-50 border border-transparent hover:border-slate-100">
      <div className="p-2.5 bg-slate-100 text-slate-500 rounded-lg group-hover:bg-white group-hover:text-blue-900 group-hover:shadow-sm transition-all mr-4">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className={`text-sm font-bold tracking-tight ${statusColor}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
