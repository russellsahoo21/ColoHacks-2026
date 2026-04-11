import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Bed,
  Users,
  Settings,
  ShieldCheck,
  Search,
  Plus,
  Filter,
  Wind,
  LogOut,
  ArrowRightLeft,
  Menu,
  X as CloseIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Modal from '../components/Modal.jsx';
import UserProfileSidebar from '../components/UserProfileSidebar.jsx';

// --- Sub-components ---

const SidebarItem = ({ icon: Icon, label, active = false, onClick }) => (
  <div onClick={onClick} className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${active ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700 font-bold' : 'text-slate-500 hover:bg-slate-50 font-bold'
    }`}>
    <Icon size={20} />
    <span className="font-bold text-sm">{label}</span>
  </div>
);

const StatCard = ({ label, value, subtext, trend, colorClass }) => (
  <div className={`bg-white p-5 rounded-xl border-t-4 ${colorClass} shadow-sm flex flex-col justify-between border-x border-b border-transparent transition-all transform hover:-translate-y-1`}>
    <div>
      <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <div className="flex items-baseline space-x-2 mt-2">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800">{value}</h2>
        {trend && <span className="text-[10px] md:text-xs font-bold text-green-500">{trend}</span>}
      </div>
    </div>
    <p className="text-[10px] md:text-xs text-slate-400 mt-2">{subtext}</p>
  </div>
);

const WardCard = ({ ward, onAdmissionsClick }) => {
  const cap = ward.beds?.total ?? ward.totalBeds ?? 0;
  const occupancyPct = ward.occupancyPct ?? 0;
  const freeBeds = ward.beds?.available ?? 0;
  const escalations = ward.openFlags ?? 0;

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm transition hover:shadow-md cursor-pointer flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-base md:text-lg font-bold text-slate-800">{ward.name}</h3>
          <p className="text-[9px] md:text-[10px] text-slate-400 uppercase font-bold tracking-tight">Floor {ward.floor}</p>
        </div>
        <span className={`px-2 py-1 rounded text-[9px] md:text-[10px] font-bold uppercase whitespace-nowrap ${occupancyPct > 90 ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'
          }`}>
          {occupancyPct > 90 ? 'CRITICAL' : 'ACTIVE'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-slate-50 p-2 md:p-3 rounded-lg">
          <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase">Occ%</p>
          <p className="text-lg md:text-xl font-bold text-slate-800">{occupancyPct}%</p>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2">
            <div className={`h-full rounded-full ${occupancyPct > 90 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${occupancyPct}%` }}></div>
          </div>
        </div>
        <div className="bg-slate-50 p-2 md:p-3 rounded-lg text-right sm:text-left">
          <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase">Free</p>
          <p className="text-lg md:text-xl font-bold text-slate-800">{freeBeds.toString().padStart(2, '0')}</p>
          <p className="text-[9px] text-slate-400 mt-1">Cap: {cap}</p>
        </div>
      </div>

      <div className="mt-auto">
        <div className="flex items-center space-x-1 mb-4">
          <div className={`w-2 h-2 rounded-full ${escalations > 0 ? 'bg-red-500' : 'bg-green-500'}`}></div>
          <span className={`text-[10px] md:text-xs font-bold ${escalations > 0 ? 'text-red-500' : 'text-green-500'}`}>
            {escalations} Escalation{escalations !== 1 ? 's' : ''}
          </span>
        </div>

        <button
          onClick={onAdmissionsClick}
          className="w-full py-2 text-[10px] md:text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          View Details
        </button>
      </div>
    </div>
  );
};

// --- Main Dashboard ---

export default function WardWatchDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingDischarges, setPendingDischarges] = useState(0);
  const [criticalEscalations, setCriticalEscalations] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddWardOpen, setIsAddWardOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [newWard, setNewWard] = useState({ name: '', floor: '', totalBeds: 20 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [err, setErr] = useState('');

  const fetchWards = async () => {
    try {
      const data = await apiClient('/wards/summary');
      setWards(data || []);
      setPendingDischarges((data || []).reduce((sum, ward) => sum + (ward.pendingDischarges ?? 0), 0));
      setCriticalEscalations((data || []).reduce((sum, ward) => sum + (ward.openFlags ?? 0), 0));
    } catch (error) {
      console.error("Failed to fetch wards", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWards();
  }, []);

  const handleAddWardSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setIsSubmitting(true);
    try {
      await apiClient('/wards', {
        method: 'POST',
        body: JSON.stringify({
          name: newWard.name.trim() || 'Ward',
          floor: newWard.floor,
          totalBeds: newWard.totalBeds
        })
      });

      setIsAddWardOpen(false);
      setNewWard({ name: '', floor: '', totalBeds: 20 });
      fetchWards(); // Refresh the list
    } catch (error) {
      setErr(error.message || 'Failed to create ward. Must be admin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalBeds = (wards || []).reduce((sum, w) => sum + (w.beds?.total ?? w.totalBeds ?? 0), 0);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden">
      <UserProfileSidebar isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

      <Modal isOpen={isAddWardOpen} onClose={() => setIsAddWardOpen(false)} title="Register New Clinical Ward">
        <form onSubmit={handleAddWardSubmit} className="space-y-4">
          {err && <div className="p-3 bg-red-50 text-red-700 text-sm font-bold rounded-lg">{err}</div>}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ward Name</label>
            <input type="text" required placeholder="Intensive Care Unit (ICU)" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              value={newWard.name} onChange={(e) => setNewWard({ ...newWard, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Floor Designation</label>
            <input type="text" required placeholder="3rd Floor" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              value={newWard.floor} onChange={(e) => setNewWard({ ...newWard, floor: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Total Bed Capacity</label>
            <input type="number" required min="1" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              value={newWard.totalBeds} onChange={(e) => setNewWard({ ...newWard, totalBeds: Math.max(1, Number(e.target.value)) })} />
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full mt-4 py-3 bg-blue-900 text-white font-bold rounded-xl hover:bg-blue-800 disabled:opacity-50 transition-all">
            {isSubmitting ? 'Provisioning...' : 'Provision Ward'}
          </button>
        </form>
      </Modal>

      {/* Mobile Nav Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 z-50 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-900 p-1.5 rounded-lg text-white">
            <LayoutDashboard size={18} />
          </div>
          <span className="font-black text-xs tracking-tight">WARDWATCH</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100"
        >
          {isSidebarOpen ? <CloseIcon size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Sidebar - Overlay on mobile, persistent on desktop */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col p-6 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="hidden md:flex items-center space-x-3 mb-10">
          <div className="bg-blue-900 p-2 rounded-lg text-white shadow-lg shadow-blue-900/20">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight uppercase">WardWatch</h1>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Global Command</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 mt-10 md:mt-0">
          <SidebarItem icon={LayoutDashboard} label="Hospital Overview" active onClick={() => setIsSidebarOpen(false)} />
          <SidebarItem icon={Bed} label="Ward Matrix" onClick={() => { navigate(`/ward/global`); setIsSidebarOpen(false); }} />
          <SidebarItem icon={ArrowRightLeft} label="Admission Queue" onClick={() => setIsSidebarOpen(false)} />
          <SidebarItem icon={ShieldCheck} label="Reports" onClick={() => { navigate('/reports'); setIsSidebarOpen(false); }} />
        </nav>

        <div className="pt-6 border-t border-slate-100 space-y-1 mt-auto">
          <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg mb-4">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-green-700 uppercase">System Status: OK</span>
          </div>
          <SidebarItem icon={LogOut} label="Log Out" onClick={() => logout()} />
        </div>
      </aside>

      {/* Sidebar Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#F8FAFC]">
        <header className="hidden md:flex justify-between items-center mb-8">
          <div className="flex items-center space-x-8">
            <h2 className="text-2xl font-black tracking-tight text-slate-800">
              OVERVIEW <span className="font-light text-slate-400">/ {user?.role?.toUpperCase()}</span>
            </h2>
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-700">{user?.name}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">{user?.role}</p>
            </div>
            <button
              onClick={() => setIsProfileOpen(true)}
              className="relative w-11 h-11 rounded-2xl bg-white border-2 border-blue-50 shadow-sm flex items-center justify-center font-black text-blue-900 hover:border-blue-400 hover:shadow-md transition-all uppercase active:scale-95"
            >
              <span className="relative z-10">{user?.name?.[0]?.toUpperCase()}</span>
            </button>
          </div>
        </header>

        {/* Top Stat Cards - Responsive Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-10">
          <StatCard label="Total Wards" value={wards.length} subtext="Active facilities" colorClass="border-blue-900" />
          <StatCard label="Total Capacity" value={totalBeds} subtext="Total active beds" colorClass="border-green-500" />
          <StatCard label="Pending Discharges" value={pendingDischarges} subtext="Expected today" colorClass="border-slate-300" />
          <StatCard label="Critical Escalations" value={criticalEscalations.toString().padStart(2, '0')} subtext="Open alerts" colorClass="border-red-500" />
        </section>

        {/* Ward Grid Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Clinical Units</h3>
            <p className="text-xs md:text-sm text-slate-400">Real-time status synchronization</p>
          </div>
          {user?.role === 'admin' && (
            <button onClick={() => setIsAddWardOpen(true)} className="flex items-center justify-center space-x-2 w-full sm:w-auto px-5 py-2.5 bg-blue-900 rounded-xl text-sm font-bold text-white shadow-lg shadow-blue-900/20 hover:bg-blue-800 hover:-translate-y-0.5 transition-all">
              <Plus size={18} />
              <span>Provision Ward</span>
            </button>
          )}
        </div>

        {/* Ward Grid - Responsive Column Counts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-10 overflow-visible">
          {loading ? (
            <div className="col-span-full py-20 text-center">
              <div className="animate-spin w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Synchronizing Base Assets...</p>
            </div>
          ) : wards.length === 0 ? (
            <div className="col-span-full border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center p-16 text-center bg-white/50 backdrop-blur-sm">
              <div className="bg-slate-50 p-4 rounded-full mb-6">
                <Bed className="text-slate-300 h-10 w-10" />
              </div>
              <h4 className="font-bold text-slate-800 text-lg">No Clinical Wards Found</h4>
              <p className="text-sm text-slate-400 mb-8 max-w-xs mx-auto leading-relaxed">
                {user?.role === 'admin'
                  ? 'The system directory is currently empty. Please provision your first clinical ward to begin operations.'
                  : 'Your account has not been mapped to any clinical zones. Please contact system administration.'}
              </p>
              {user?.role === 'admin' && (
                <button onClick={() => setIsAddWardOpen(true)} className="px-8 py-3 bg-blue-900 text-white font-bold rounded-xl text-sm transition-all hover:bg-blue-800 hover:shadow-xl hover:shadow-blue-900/20">Assign First Ward</button>
              )}
            </div>
          ) : wards.map(ward => (
            <WardCard
              key={ward._id}
              ward={ward}
              onAdmissionsClick={() => navigate(`/ward/${ward._id}`)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}