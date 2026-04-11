import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Search, Bell, Settings, LayoutDashboard, UserPlus, Plus, Bed,
  Users, ArrowRightLeft, ShieldCheck, CheckCircle2,
  Clock, Calendar, RefreshCcw, Wind, HelpCircle, LogOut, Menu, X as CloseIcon
} from 'lucide-react';
import { apiClient } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Modal from '../components/Modal.jsx';
import UserProfileSidebar from '../components/UserProfileSidebar.jsx';

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active = false, onClick }) => (
  <div onClick={onClick} className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${active ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700 font-bold' : 'text-slate-500 hover:bg-slate-50 font-bold'
    }`}>
    <Icon size={20} />
    <span className="font-bold text-sm">{label}</span>
  </div>
);

const QueueCard = ({ doc, isCompleted, isAdmission, onArriveClick, onDischargeClick, isAdmin }) => {
  const isEscalated = doc.status?.includes('escalated');
  const patientName = doc.patient?.name || (typeof doc.patientId === 'string' ? doc.patientId.slice(-6) : doc.patientId?.name) || 'Unknown';

  return (
    <div className={`p-4 rounded-xl border border-slate-100 bg-white mb-3 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between transition-colors ${isCompleted ? 'opacity-60' : ''}`}>
      <div className="flex items-center space-x-4 mb-4 sm:mb-0">
        <div className={`w-1 h-12 rounded-full shrink-0 ${isEscalated ? 'bg-red-500' : isCompleted ? 'bg-green-500' : 'bg-blue-800'}`}></div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {doc.type && (
              <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 uppercase">
                {doc.type}
              </span>
            )}
            {doc.status && (
              <span className={`text-[8px] font-black uppercase tracking-tighter ${isEscalated ? 'text-red-600' : 'text-green-600'}`}>
                {doc.status}
              </span>
            )}
          </div>
          <h4 className={`text-sm font-bold text-slate-800 truncate ${isCompleted ? 'line-through text-slate-400' : ''}`}>
            Patient: {patientName}
          </h4>
          <p className="text-[10px] text-slate-400 font-medium truncate">{doc.notes || 'No extra notes'}</p>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-start sm:space-x-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-50">
        <div className="text-left sm:text-right">
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{isAdmission ? 'ETA' : 'Exp Time'}</p>
          <p className={`text-base md:text-lg font-black leading-none ${isEscalated ? 'text-red-600' : 'text-slate-700'}`}>
            {isAdmission && doc.expectedArrival
              ? new Date(doc.expectedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : doc.expectedDischarge
                ? new Date(doc.expectedDischarge).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Overdue'}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => isAdmission ? onArriveClick(doc) : onDischargeClick(doc)}
            className={`px-4 py-2 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-tight transition-all active:scale-95 whitespace-nowrap ${isCompleted ? 'text-green-600 bg-green-50' :
              isAdmission ? 'bg-blue-900 text-white hover:bg-blue-800 cursor-pointer shadow-lg shadow-blue-900/10' :
                'bg-orange-500 text-white cursor-pointer shadow-lg shadow-orange-500/10 hover:bg-orange-400'
              }`}>
            {isCompleted ? '✓ Done' : isAdmission ? 'Admit' : 'Discharge'}
          </button>
        )}
      </div>
    </div>
  );
};

// --- Main Page ---

export default function QueueManagement() {
  const { wardId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [queue, setQueue] = useState({ pendingAdmissions: [], pendingDischarges: [] });
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modals
  const [isAddAdmissionOpen, setIsAddAdmissionOpen] = useState(false);
  const [isArriveQueueOpen, setIsArriveQueueOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [availableBeds, setAvailableBeds] = useState([]);

  const [admissionForm, setAdmissionForm] = useState({
    name: '', type: 'emergency', expectedArrival: '', gender: 'other', notes: ''
  });
  const [bedSelection, setBedSelection] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [err, setErr] = useState('');

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const data = await apiClient(`/admissions/${wardId}/queue`);
      setQueue(data || { pendingAdmissions: [], pendingDischarges: [] });
    } catch (error) {
      console.error("Failed to load queue:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (wardId) fetchQueue();
  }, [wardId]);

  // Actions
  const handleCreateAdmission = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErr('');

    try {
      const ptData = await apiClient('/patients', {
        method: 'POST',
        body: JSON.stringify({
          name: admissionForm.name,
          age: 30,
          gender: admissionForm.gender,
          conditionCategory: 'Incoming',
          admissionDate: new Date().toISOString(),
          losThresholdDays: 5,
          notes: admissionForm.notes
        })
      });

      if (!ptData?._id) throw new Error("Patient creation failed.");

      await apiClient('/admissions', {
        method: 'POST',
        body: JSON.stringify({
          patientId: ptData._id,
          wardId: wardId,
          type: admissionForm.type,
          expectedArrival: admissionForm.expectedArrival
            ? new Date(admissionForm.expectedArrival).toISOString()
            : new Date().toISOString(),
          notes: admissionForm.notes
        })
      });

      setIsAddAdmissionOpen(false);
      setAdmissionForm({ name: '', type: 'emergency', expectedArrival: '', gender: 'other', notes: '' });
      fetchQueue();
    } catch (error) {
      setErr(error.message || 'Failed to create admission');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openArriveQueue = async (admission) => {
    setSelectedAdmission(admission);
    setErr('');
    setBedSelection('');
    setIsArriveQueueOpen(true);
    try {
      const beds = await apiClient(`/beds/${wardId}`);
      setAvailableBeds((beds || []).filter(b => b.status === 'available' || b.status === 'cleaning'));
    } catch (e) {
      console.error("Could not fetch beds", e);
    }
  };

  const handleArrive = async (e) => {
    e.preventDefault();
    if (!bedSelection) return setErr('Please select a bed.');
    setIsSubmitting(true);
    try {
      await apiClient(`/admissions/${selectedAdmission._id}/arrive`, {
        method: 'PATCH',
        body: JSON.stringify({ bedId: bedSelection })
      });
      setIsArriveQueueOpen(false);
      fetchQueue();
    } catch (error) {
      setErr(error.message || 'Arrival failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDischarge = async (dischargeDoc) => {
    const patientId = dischargeDoc.patientId || dischargeDoc.patient?._id || dischargeDoc.bed?.patientId;
    const bedId = dischargeDoc.bed?._id || dischargeDoc._id;
    if (!patientId || !bedId) return;

    setIsSubmitting(true);
    try {
      await apiClient(`/patients/${patientId}/discharge`, {
        method: 'PATCH',
        body: JSON.stringify({ dischargeCompletedAt: new Date().toISOString() })
      });

      await apiClient(`/beds/${bedId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'cleaning' })
      });

      fetchQueue();
    } catch (error) {
      console.error(error);
      alert("Failed to discharge patient.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden transition-colors">
      <UserProfileSidebar isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

      {/* Modals */}
      <Modal isOpen={isAddAdmissionOpen} onClose={() => setIsAddAdmissionOpen(false)} title="Register Incoming Admission">
        <form onSubmit={handleCreateAdmission} className="space-y-4">
          {err && <div className="p-3 bg-red-50 text-red-700 text-sm font-bold rounded-lg">{err}</div>}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Patient Identity</label>
            <input type="text" required className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              value={admissionForm.name} onChange={e => setAdmissionForm({ ...admissionForm, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Type</label>
              <select className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                value={admissionForm.type} onChange={e => setAdmissionForm({ ...admissionForm, type: e.target.value })}>
                <option value="emergency">Emergency</option>
                <option value="elective">Elective</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Arrival</label>
              <input type="datetime-local" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                value={admissionForm.expectedArrival} onChange={e => setAdmissionForm({ ...admissionForm, expectedArrival: e.target.value })} />
            </div>
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-blue-900 text-white font-bold rounded-xl shadow-lg hover:bg-blue-800 disabled:opacity-50 transition-all">
            Confirm Admission
          </button>
        </form>
      </Modal>

      <Modal isOpen={isArriveQueueOpen} onClose={() => setIsArriveQueueOpen(false)} title="Process Admission">
        <form onSubmit={handleArrive} className="space-y-4">
          {err && <div className="p-3 bg-red-50 text-red-700 text-sm font-bold rounded-lg">{err}</div>}
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 mb-4">
            <p className="text-[10px] font-black uppercase text-blue-900 tracking-widest mb-1 opacity-60">Incoming Patient</p>
            <p className="text-sm font-bold text-blue-900">{selectedAdmission?.patientId?.name || selectedAdmission?.patientId || 'Unknown'}</p>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Assign Bed Unit</label>
            {availableBeds.length === 0 ? (
              <p className="text-xs font-bold text-red-600 p-3 bg-red-50 rounded-lg">No available beds discovered.</p>
            ) : (
              <select required className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                value={bedSelection} onChange={e => setBedSelection(e.target.value)}>
                <option value="">-- Select Bed --</option>
                {availableBeds.map(b => (
                  <option key={b._id} value={b._id}>Unit {b.bedNumber} ({b.status})</option>
                ))}
              </select>
            )}
          </div>
          <button type="submit" disabled={isSubmitting || availableBeds.length === 0} className="w-full mt-4 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-500 disabled:opacity-50 transition-all">
            Admit to Ward
          </button>
        </form>
      </Modal>

      {/* Mobile Nav Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 z-50">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-900 p-1.5 rounded-lg text-white">
            <LayoutDashboard size={18} />
          </div>
          <span className="font-black text-xs tracking-tight uppercase">Ward Queue</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100"
        >
          {isSidebarOpen ? <CloseIcon size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Sidebar - Overlay on mobile */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col p-6 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="hidden md:flex items-center space-x-3 mb-10">
          <div className="bg-blue-900 p-2 rounded-lg text-white shadow-lg shadow-blue-900/20">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight uppercase">Ward Hub</h1>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Queue Control</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 mt-10 md:mt-0">
          <SidebarItem icon={LayoutDashboard} label="Overview" onClick={() => navigate('/dashboard')} />
          <SidebarItem icon={Bed} label="Ward Matrix" onClick={() => navigate(`/ward/${wardId}`)} />
          <SidebarItem icon={ArrowRightLeft} label="Admission Queue" active />
          <SidebarItem icon={ShieldCheck} label="Reports" onClick={() => navigate(`/reports`)} active={location.pathname.includes('/reports')} />
        </nav>

        <div className="pt-6 border-t border-slate-100 space-y-1 mt-auto">
          <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg mb-4">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest">Protocol Active</span>
          </div>
          <SidebarItem icon={LogOut} label="Log Out" onClick={logout} />
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        <header className="hidden md:flex bg-white border-b border-slate-200 px-8 items-center justify-between h-16 shrink-0">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase tracking-[0.1em]">Ward Queue</h2>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-right leading-none">
              <p className="text-xs font-bold text-slate-800">{user?.name}</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase">{user?.role}</p>
            </div>
            <button onClick={() => setIsProfileOpen(true)} className="relative w-10 h-10 rounded-xl bg-white border border-blue-50 shadow-sm flex items-center justify-center font-black text-blue-900 hover:border-blue-400 transition-all uppercase active:scale-95">
              <span>{user?.name?.[0]?.toUpperCase()}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">System Queue</h2>
              <div className="flex items-center gap-2 mt-1">
                <RefreshCcw size={10} className="text-slate-400 animate-spin-slow" />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Status Synchronization: Active</p>
              </div>
            </div>
            {user?.role === 'admin' && (
              <button 
                onClick={() => setIsAddAdmissionOpen(true)} 
                className="flex items-center justify-center space-x-2 w-full sm:w-auto px-5 py-2.5 bg-blue-900 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 hover:bg-blue-800 transition-all active:scale-95"
              >
                <Plus size={18} />
                <span>New Admission</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 md:gap-10">

            {/* COLUMN 1: DISCHARGES */}
            <div>
              <div className="flex items-center justify-between mb-6 group">
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-6 bg-slate-800 rounded-full group-hover:scale-y-125 transition-transform"></div>
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">Pending Discharges</h3>
                </div>
                <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">{queue.pendingDischarges.length} PENDING</span>
              </div>

              {loading ? (
                <div className="py-20 text-center animate-pulse">
                  <RefreshCcw size={24} className="mx-auto text-slate-300 animate-spin mb-4" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Querying System Logs...</p>
                </div>
              ) : queue.pendingDischarges.length === 0 ? (
                <div className="p-12 border-2 border-dashed border-slate-200 rounded-3xl text-center bg-white/50 backdrop-blur-sm">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No pending discharge protocols</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {queue.pendingDischarges.map(d => (
                    <QueueCard key={d._id} doc={d} onDischargeClick={handleDischarge} isAdmin={user?.role === 'admin'} />
                  ))}
                </div>
              )}
            </div>

            {/* COLUMN 2: ADMISSIONS */}
            <div>
              <div className="flex items-center justify-between mb-6 group">
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-6 bg-blue-700 rounded-full group-hover:scale-y-125 transition-transform"></div>
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">Incoming Admissions</h3>
                </div>
                <span className="text-[10px] font-black text-white bg-blue-700 px-3 py-1 rounded-full shadow-lg shadow-blue-700/20">{queue.pendingAdmissions.length} EN ROUTE</span>
              </div>

              {loading ? (
                <div className="py-20 text-center animate-pulse">
                  <RefreshCcw size={24} className="mx-auto text-slate-300 animate-spin mb-4" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Querying System Logs...</p>
                </div>
              ) : queue.pendingAdmissions.length === 0 ? (
                <div className="p-12 border-2 border-dashed border-slate-200 rounded-3xl text-center bg-white/50 backdrop-blur-sm">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No admissions currently en route</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {queue.pendingAdmissions.map(a => (
                    <QueueCard key={a._id} doc={a} isAdmission={true} onArriveClick={openArriveQueue} isAdmin={user?.role === 'admin'} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}