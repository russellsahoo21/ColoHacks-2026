import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Bed, Users, ShieldCheck, Search, Plus,
  Filter, Bell, UserPlus, ArrowRightLeft, Settings, HelpCircle,
  Wind, RefreshCcw, AlertCircle, CheckCircle2, LogOut, Menu, X as CloseIcon
} from 'lucide-react';
import { apiClient } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Modal from '../components/Modal.jsx';
import UserProfileSidebar from '../components/UserProfileSidebar.jsx';

// --- Reusable Components ---

const SidebarItem = ({ icon: Icon, label, active = false, onClick }) => (
  <div onClick={onClick} className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${active ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700 font-bold' : 'text-slate-500 hover:bg-slate-50 font-bold'
    }`}>
    <Icon size={20} />
    <span className="font-bold text-sm">{label}</span>
  </div>
);

const BedCard = ({ bed, onClick }) => {
  const styles = {
    occupied: 'border-l-slate-400 bg-white shadow-sm',
    available: 'border-l-green-400 bg-white shadow-sm',
    cleaning: 'border-l-yellow-400 bg-white shadow-sm',
    reserved: 'border-l-slate-300 bg-slate-50 border-dashed border-2'
  };

  const statusIcons = {
    available: CheckCircle2,
    cleaning: RefreshCcw,
    occupied: null,
    reserved: null
  };

  const StatusIcon = statusIcons[bed.status];

  return (
    <div
      onClick={() => onClick(bed)}
      className={`h-full min-h-[110px] flex flex-col justify-between p-3 rounded-xl border-l-4 cursor-pointer transition-all hover:scale-[1.02] ${styles[bed.status] || styles.available}`}
    >
      <div className="space-y-2">
        <div className="flex justify-between items-start mb-1">
          <h4 className="text-base font-bold text-slate-800">{bed.bedNumber}</h4>
          {StatusIcon && <StatusIcon size={14} className="text-slate-400" />}
        </div>
        <p className={`text-[10px] font-bold uppercase truncate ${bed.status === 'available' ? 'text-green-600' : 'text-slate-800'}`}>
          {bed.patientId
            ? `Patient: ${bed.patientId.name ?? bed.patientId._id?.slice(-4) ?? bed.patientId.slice(-4)}`
            : bed.status}
        </p>
        {bed.expectedDischargeDate && (
          <p className="text-[9px] font-bold text-orange-500 truncate mt-1">
            Exp: {new Date(bed.expectedDischargeDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
          </p>
        )}
        {bed.notes && <p className="text-[9px] text-slate-400 mt-1 truncate">{bed.notes}</p>}
      </div>
    </div>
  );
};

// --- Main Application ---

export default function WardWatchApp() {
  const { wardId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [beds, setBeds] = useState([]);
  const [ward, setWard] = useState(null);
  const [allWards, setAllWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const bedCounts = useMemo(() => (beds || []).reduce((acc, bed) => {
    acc[bed.status] = (acc[bed.status] || 0) + 1;
    return acc;
  }, { available: 0, cleaning: 0, occupied: 0, reserved: 0 }), [beds]);

  const overdueDischarges = useMemo(() => {
    const now = new Date();
    return (beds || []).filter(bed =>
      bed.status === 'occupied' &&
      bed.expectedDischargeDate &&
      new Date(bed.expectedDischargeDate) < now
    );
  }, [beds]);

  // Modal States
  const [isAddBedOpen, setIsAddBedOpen] = useState(false);
  const [isManageBedOpen, setIsManageBedOpen] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Forms
  const [newBed, setNewBed] = useState({ bedNumber: '', status: 'available' });
  const [selectedBed, setSelectedBed] = useState(null);
  const [patientForm, setPatientForm] = useState({
    name: '', age: 30, gender: 'male', conditionCategory: 'Stable', responsibleDoctor: '', expectedDischarge: '', notes: ''
  });
  const [actionErr, setActionErr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWardData = async () => {
    try {
      setLoading(true);
      const [bedsData, wardData, allWardsData] = await Promise.all([
        apiClient(`/beds/${wardId}`),
        apiClient(`/wards/${wardId}`),
        apiClient('/wards')
      ]);

      setBeds(bedsData || []);
      setWard(wardData);
      setAllWards((allWardsData || []).filter(w => w._id !== wardId));
    } catch (error) {
      console.error("Failed to sync ward matrix:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (wardId) fetchWardData();
  }, [wardId]);

  // Actions
  const handleAddBed = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionErr('');

    const currentBedCount = beds.length;
    const maxCapacity = ward?.totalBeds || 0;

    if (currentBedCount >= maxCapacity) {
      setActionErr(`Cannot add bed. Ward capacity reached (${maxCapacity}/${maxCapacity}).`);
      setIsSubmitting(false);
      return;
    }

    try {
      await apiClient('/beds', {
        method: 'POST',
        body: JSON.stringify({ ...newBed, wardId })
      });
      setIsAddBedOpen(false);
      setNewBed({ bedNumber: '', status: 'available' });
      fetchWardData();
    } catch (err) {
      setActionErr(err.message || 'Failed to add bed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openManageBed = (bed) => {
    setSelectedBed(bed);
    setIsManageBedOpen(true);
    setIsTransferring(false);
    setActionErr('');
  };

  const handleTransfer = async (targetWardId) => {
    if (!targetWardId) return;
    setIsSubmitting(true);
    setActionErr('');
    try {
      const targetBeds = await apiClient(`/beds/${targetWardId}`);
      const availableBed = targetBeds.find(b => b.status === 'available');

      if (!availableBed) {
        throw new Error('No available beds found in the selected ward.');
      }

      await apiClient(`/beds/${availableBed._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'occupied',
          patientId: selectedBed.patientId?._id || selectedBed.patientId || null,
          assignedDoctor: selectedBed.assignedDoctor,
          expectedDischargeDate: selectedBed.expectedDischargeDate || null,
          notes: selectedBed.notes ? `Transferred from Ward: ${ward?.name}\nPrior notes: ${selectedBed.notes}` : `Transferred from Ward: ${ward?.name}`
        })
      });

      await apiClient(`/beds/${selectedBed._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'cleaning' })
      });

      setIsManageBedOpen(false);
      fetchWardData();
    } catch (err) {
      setActionErr(err.message || 'Transfer failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    setIsSubmitting(true);
    try {
      await apiClient(`/beds/${selectedBed._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      setIsManageBedOpen(false);
      fetchWardData();
    } catch (err) {
      setActionErr(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const patientPayload = {
        ...patientForm,
        admissionDate: new Date().toISOString(),
        losThresholdDays: 7
      };
      const patientData = await apiClient('/patients', {
        method: 'POST',
        body: JSON.stringify(patientPayload)
      });

      await apiClient(`/beds/${selectedBed._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'occupied',
          patientId: patientData._id,
          assignedDoctor: patientForm.responsibleDoctor,
          notes: patientForm.notes,
          expectedDischargeDate: patientForm.expectedDischarge ? new Date(patientForm.expectedDischarge).toISOString() : null
        })
      });

      setIsManageBedOpen(false);
      setPatientForm({ name: '', age: 30, gender: 'male', conditionCategory: 'Stable', responsibleDoctor: '', expectedDischarge: '', notes: '' });
      fetchWardData();
    } catch (err) {
      setActionErr(err.message || 'Admission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDischarge = async () => {
    setIsSubmitting(true);
    setActionErr('');

    try {
      await apiClient(`/beds/${selectedBed._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'occupied',
          expectedDischargeDate: new Date().toISOString()
        })
      });

      setIsManageBedOpen(false);
      fetchWardData();
    } catch (err) {
      setActionErr(err.message || 'Failed to dispatch to discharge queue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#F8FAFC] overflow-hidden text-slate-900 transition-colors">
      <UserProfileSidebar isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

      {/* Modals */}
      <Modal isOpen={isAddBedOpen} onClose={() => setIsAddBedOpen(false)} title="Add Bed to Ward">
        <form onSubmit={handleAddBed} className="space-y-4">
          {actionErr && <div className="p-3 bg-red-50 text-red-700 text-sm font-bold rounded-lg">{actionErr}</div>}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Bed Identifier / Number</label>
            <input type="text" required placeholder="ICU-01" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              value={newBed.bedNumber} onChange={(e) => setNewBed({ ...newBed, bedNumber: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Initial Status</label>
            <select className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              value={newBed.status} onChange={(e) => setNewBed({ ...newBed, status: e.target.value })}>
              <option value="available">Available</option>
              <option value="cleaning">Cleaning</option>
            </select>
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full mt-4 py-3 bg-blue-900 text-white font-bold rounded-xl hover:bg-blue-800 disabled:opacity-50 transition-all">
            Provision Bed
          </button>
        </form>
      </Modal>

      <Modal isOpen={isManageBedOpen} onClose={() => setIsManageBedOpen(false)} title={`Bed Config: ${selectedBed?.bedNumber}`}>
        <div className="space-y-6">
          {actionErr && <div className="p-3 bg-red-50 text-red-700 text-sm font-bold rounded-lg">{actionErr}</div>}

          <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-lg">
            {['available', 'cleaning', 'occupied', 'reserved'].map(s => (
              <button
                key={s}
                className={`flex-1 py-1 px-2 text-[9px] md:text-[10px] font-black uppercase rounded transition-all whitespace-nowrap ${selectedBed?.status === s ? 'bg-white shadow text-blue-900' : 'text-slate-400 hover:text-slate-600'}`}
                onClick={() => {
                  if (s === 'occupied' && selectedBed?.status !== 'occupied') {
                    setActionErr('To make a bed Occupied, use the Rapid Admission form below.');
                    return;
                  }
                  if (selectedBed?.status !== s) handleUpdateStatus(s);
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {(selectedBed?.status === 'available' || selectedBed?.status === 'cleaning') && (
            <form onSubmit={handleAdmit} className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="font-bold text-sm text-slate-800 uppercase tracking-tight text-center">Rapid Admission</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Patient Name</label>
                  <input type="text" required className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                    value={patientForm.name} onChange={e => setPatientForm({ ...patientForm, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Doctor Assigned</label>
                  <input type="text" required className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                    value={patientForm.responsibleDoctor} onChange={e => setPatientForm({ ...patientForm, responsibleDoctor: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Expected Discharge</label>
                  <input type="datetime-local" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                    value={patientForm.expectedDischarge} onChange={e => setPatientForm({ ...patientForm, expectedDischarge: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Clinical Notes</label>
                  <textarea required className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs resize-none" rows="2"
                    value={patientForm.notes} onChange={e => setPatientForm({ ...patientForm, notes: e.target.value })} />
                </div>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full py-2.5 bg-green-600 text-white font-bold rounded-lg text-sm hover:bg-green-500 disabled:opacity-50 transition-all">
                Admit Patient
              </button>
            </form>
          )}

          {selectedBed?.status === 'occupied' && (
            <div className="pt-4 border-t border-slate-100 text-center">
              <Bed className="mx-auto text-blue-900 mb-2" size={32} />
              <p className="text-xs font-bold uppercase text-slate-400 mb-2 truncate">
                Patient: {selectedBed?.patientId?.name || selectedBed?.patientId?._id || selectedBed?.patientId || 'Unknown'}
              </p>
              {selectedBed?.expectedDischargeDate && (
                <div className="mb-4">
                  <p className="text-[10px] font-bold text-orange-600 bg-orange-50 inline-block px-3 py-1 rounded-full">
                    Due: {new Date(selectedBed.expectedDischargeDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
              )}
              {!isTransferring ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setIsTransferring(true)}
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl shadow-md hover:bg-amber-400 transition-all disabled:opacity-50">
                    Transfer
                  </button>
                  <button
                    onClick={handleDischarge}
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl shadow-md hover:bg-red-400 transition-all disabled:opacity-50">
                    Discharge
                  </button>
                </div>
              ) : (
                <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100 text-left">
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-tight mb-2 text-center">Target Ward</h4>
                  <div className="flex flex-col space-y-2 max-h-48 overflow-y-auto">
                    {allWards.filter(w => w.availableBeds > 0).length === 0 ? (
                      <p className="text-xs font-medium text-amber-700 text-center py-2">No other wards with free beds.</p>
                    ) : (
                      allWards.filter(w => w.availableBeds > 0).map(w => (
                        <button
                          key={w._id}
                          onClick={() => handleTransfer(w._id)}
                          className="w-full text-left px-3 py-2 bg-white rounded-lg border border-amber-200 text-xs font-bold text-amber-900 hover:bg-amber-500 hover:text-white transition-all flex justify-between items-center group"
                        >
                          <span>{w.name}</span>
                          <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full group-hover:bg-amber-400 group-hover:text-white">{w.availableBeds} free</span>
                        </button>
                      ))
                    )}
                  </div>
                  <button onClick={() => setIsTransferring(false)} className="mt-4 text-[10px] font-bold text-amber-600 uppercase tracking-widest hover:text-amber-800 w-full text-center">
                    Cancel Transfer
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 z-50 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-900 p-1.5 rounded-lg text-white">
            <LayoutDashboard size={18} />
          </div>
          <span className="font-black text-xs tracking-tight">WARD CONTROL</span>
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
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Global Ops</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 mt-10 md:mt-0">
          <SidebarItem icon={LayoutDashboard} label="Overview" onClick={() => navigate('/dashboard')} />
          <SidebarItem icon={Bed} label="Ward Matrix" active />
          <SidebarItem icon={ArrowRightLeft} label="Admission Queue" onClick={() => navigate(`/ward/${wardId}/queue`)} />
          <SidebarItem icon={ShieldCheck} label="Reports" onClick={() => navigate(`/reports`)} active={location.pathname.includes('/reports')} />
        </nav>

        <div className="pt-6 border-t border-slate-100 space-y-1 mt-auto">
          <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg mb-4">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-green-700 uppercase">System Active</span>
          </div>
          <SidebarItem icon={LogOut} label="Log Out" onClick={logout} />
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        {/* TOP NAVBAR (Desktop) */}
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200 items-center justify-between px-8 shrink-0">
          <div className="flex items-center space-x-4">
            <div className="bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200 flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
              <span className="text-xs font-bold text-slate-600 truncate max-w-[200px]">Ward {ward?.name || wardId.slice(-4)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-right leading-none">
              <p className="text-xs font-bold text-slate-800">{user?.name}</p>
              <p className="text-[10px] text-slate-400 uppercase font-medium">{user?.role}</p>
            </div>
            <button onClick={() => setIsProfileOpen(true)} className="relative w-10 h-10 rounded-xl bg-white border border-blue-100 shadow-sm flex items-center justify-center font-black text-blue-900 hover:border-blue-400 transition-all uppercase active:scale-95">
              <span>{user?.name?.[0]?.toUpperCase()}</span>
            </button>
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 flex flex-col xl:flex-row gap-6 md:gap-8">

          {/* GRID SECTION */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Ward Matrix</h2>
                <div className="flex items-center gap-2 text-slate-400 uppercase tracking-widest text-[9px] md:text-[10px] font-bold">
                  <RefreshCcw size={10} className="animate-spin-slow" />
                  <span>Real-time persistence</span>
                </div>
              </div>
              <button
                onClick={() => navigate(`/ward/${wardId}/queue`)}
                className="flex items-center justify-center space-x-2 w-full sm:w-auto px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-900/10 hover:bg-blue-800 transition-all active:scale-95">
                <ArrowRightLeft size={16} /> <span>Admission Queue</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-3 mb-6 p-3 bg-white/50 border border-slate-100 rounded-xl">
              {[
                { color: 'bg-slate-500', label: 'Occupied' },
                { color: 'bg-green-400', label: 'Available' },
                { color: 'bg-yellow-400', label: 'Cleaning' },
                { dashed: true, label: 'Reserved' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center space-x-1.5">
                  <div className={`w-2.5 h-2.5 rounded ${item.dashed ? 'border border-slate-300 border-dashed' : item.color}`}></div>
                  <span className="text-[9px] font-bold uppercase tracking-tight text-slate-400">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 overflow-visible">
              {loading ? (
                Array(12).fill(0).map((_, idx) => (
                  <div key={idx} className="h-[110px] bg-white rounded-xl border border-slate-100 animate-pulse flex flex-col p-3 gap-2">
                    <div className="h-4 w-1/3 bg-slate-50 rounded"></div>
                    <div className="h-3 w-3/4 bg-slate-50 rounded"></div>
                    <div className="mt-auto h-2 w-full bg-slate-50 rounded"></div>
                  </div>
                ))
              ) : beds.length > 0 ? (
                beds.map(bed => (
                  <BedCard key={bed._id} bed={bed} onClick={user?.role === 'admin' ? openManageBed : () => { }} />
                ))
              ) : (
                <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
                  <Bed className="mx-auto text-slate-200 mb-4" size={40} />
                  <p className="text-slate-400 font-bold uppercase tracking-tight text-[10px]">No bed units provisioned in this clinical zone.</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR (Info Dashboard) */}
          <aside className="w-full xl:w-80 space-y-6 shrink-0 transition-all">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-6">

              {/* Analytics Card */}
              <div className="bg-blue-900 rounded-2xl p-6 text-white shadow-xl shadow-blue-900/20">
                <h3 className="font-bold text-[9px] uppercase tracking-widest opacity-60 mb-6">Zone Analytics</h3>
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center"><Wind size={20} className="text-blue-100" /></div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-blue-200 uppercase tracking-tighter">Total Capacity</p>
                    <p className="text-3xl font-black italic">{ward?.totalBeds || '--'}</p>
                  </div>
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-4">Utilization Metrics</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Free', val: bedCounts.available, color: 'text-emerald-500' },
                    { label: 'Cleaning', val: bedCounts.cleaning, color: 'text-amber-500' },
                    { label: 'Occupied', val: bedCounts.occupied, color: 'text-slate-800' },
                    { label: 'Reserved', val: bedCounts.reserved, color: 'text-slate-400' }
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-slate-50/50 p-3 rounded-2xl border border-slate-50">
                      <p className="text-[9px] font-black uppercase tracking-tighter text-slate-400">{stat.label}</p>
                      <p className={`mt-1 text-xl font-black ${stat.color}`}>{stat.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Instruction Card */}
            <div className="hidden sm:block bg-slate-800 rounded-2xl p-5 shadow-lg shadow-slate-900/10">
              <div className="flex items-center space-x-2 mb-2">
                <HelpCircle size={14} className="text-blue-400" />
                <p className="text-[10px] text-white font-black uppercase tracking-widest">Protocol</p>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed italic">
                Interact with bed units to initiate admission workflows or manage discharge protocols. Status colors synchronize across all staff terminals.
              </p>
            </div>

            {/* Alerts Section */}
            {overdueDischarges.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-5 animate-pulse">
                <div className="flex items-center space-x-2 mb-4">
                  <AlertCircle className="text-red-500" size={18} />
                  <p className="text-[10px] text-red-700 font-black uppercase tracking-widest">Escalation Flags</p>
                </div>
                <div className="space-y-2">
                  {overdueDischarges.map(bed => (
                    <div key={bed._id} className="bg-white p-3 rounded-xl border border-red-100 flex justify-between items-center shadow-sm">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800">{bed.bedNumber}</p>
                        <p className="text-[10px] text-slate-400 truncate">Overdue Discharge</p>
                      </div>
                      <div className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase leading-none">Flag</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </main>
      </div>
    </div>
  );
}