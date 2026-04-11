import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Printer, Link2, ArrowLeft, Clock, CheckCircle2, AlertTriangle, Menu, X as CloseIcon } from 'lucide-react';
import { apiClient } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import UserProfileSidebar from '../components/UserProfileSidebar.jsx';

const shiftOptions = [
  { value: 'latest', label: 'Latest' },
  { value: 'morning', label: 'Morning shift' },
  { value: 'afternoon', label: 'Afternoon shift' },
  { value: 'night', label: 'Night shift' },
];

const summaryCard = (title, value, description) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 mb-2">{title}</p>
    <p className="text-2xl md:text-3xl font-black text-slate-900 mb-2">{value}</p>
    <p className="text-xs text-slate-500">{description}</p>
  </div>
);

export default function HandoverReports() {
  const { wardId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const selectedShift = searchParams.get('shift') ?? 'latest';
  const [handover, setHandover] = useState(null);
  const [wardName, setWardName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const reportUrl = useMemo(() => window.location.href, [selectedShift]);

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const query = selectedShift !== 'latest' ? `?shiftLabel=${selectedShift}` : '';
      const snapshot = await apiClient(`/wards/${wardId}/handover${query}`);
      setHandover(snapshot);
      setWardName(snapshot?.wardName || 'Ward');
    } catch (err) {
      setHandover(null);
      setError(err.message || 'Unable to load handover note.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (wardId) fetchReport();
  }, [wardId, selectedShift]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportUrl);
      setCopySuccess('Link copied!');
      setTimeout(() => setCopySuccess(''), 2200);
    } catch {
      setCopySuccess('Could not copy link');
    }
  };

  const handlePrint = () => window.print();

  const handleShiftChange = (value) => {
    if (value === 'latest') {
      setSearchParams({});
    } else {
      setSearchParams({ shift: value });
    }
    setIsSidebarOpen(false);
  };

  const markedBeds = handover?.occupiedBeds ?? [];
  const flaggedPatients = handover?.flaggedPatients ?? [];
  const pendingAdmissions = handover?.pendingAdmissions ?? [];
  const pendingDischarges = handover?.pendingDischarges ?? [];
  const openFlags = handover?.openFlags ?? [];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden transition-colors">
      <UserProfileSidebar isOpen={false} onClose={() => {}} />

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 z-50 print:hidden">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-900 p-1.5 rounded-lg text-white">
            <ShieldCheck size={18} />
          </div>
          <span className="font-black text-xs tracking-tight uppercase">Handover</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg border border-slate-100"
        >
          {isSidebarOpen ? <CloseIcon size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Sidebar - Overlay on mobile */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col p-6 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 print:hidden
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="hidden md:flex items-center space-x-3 mb-10">
          <div className="bg-blue-900 p-2 rounded-lg text-white shadow-lg shadow-blue-900/20">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-sm font-bold">Handover</h1>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest leading-none">Shift Synopsis</p>
          </div>
        </div>

        <button onClick={() => navigate(`/ward/${wardId}`)} className="flex items-center gap-2 px-4 py-3 mb-6 rounded-xl bg-slate-50 text-slate-700 font-bold hover:bg-slate-100 transition text-sm">
          <ArrowLeft size={16} /> Back to Ward
        </button>

        <div className="space-y-2 mt-4 md:mt-0">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 md:hidden">Temporal Snapshots</p>
          {shiftOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleShiftChange(option.value)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm font-semibold ${selectedShift === option.value ? 'border-blue-900 bg-blue-50 text-blue-900 shadow-sm' : 'border-slate-100 bg-white text-slate-600 hover:border-slate-300'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 print:p-0 print:overflow-visible">
        <div className="flex flex-col gap-6 mb-8 transform-gpu">
          <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-end">
            <div>
              <div className="flex items-center gap-2 mb-2 md:hidden">
                 <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">Snapshot: {selectedShift === 'latest' ? 'Live' : selectedShift}</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Shift Handover Note</h2>
              <p className="text-xs md:text-sm text-slate-400 mt-1 font-medium">Standardized clinical summary for <span className="text-blue-900 font-bold">{wardName}</span>.</p>
            </div>

            <div className="flex flex-wrap gap-3 print:hidden">
              <button onClick={handleCopy} className="flex-1 sm:flex-none inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-sm hover:bg-blue-800 transition shadow-lg shadow-blue-900/10 active:scale-95">
                Copy Link
              </button>
              <button onClick={handlePrint} className="flex-1 sm:flex-none inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold text-sm hover:bg-slate-50 transition active:scale-95">
                <Printer size={16} /> Print
              </button>
            </div>
          </div>

          {copySuccess && <div className="px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest w-fit animate-bounce">{copySuccess}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {summaryCard('Shift Context', selectedShift === 'latest' ? (handover?.shiftLabel ?? 'Latest') : selectedShift, 'Temporal Range')}
            {summaryCard('Capture Time', handover ? new Date(handover.generatedAt).toLocaleTimeString() : 'n/a', 'Snapshot Integrity')}
            {summaryCard('Critical Flags', openFlags.length, 'Clinical Escalations')}
          </div>
        </div>

        <div className="space-y-6">
          <section className="bg-white border border-slate-200 rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm print:border-none print:shadow-none">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Bed Utilization</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time zone data</p>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest border border-blue-100">
                <Clock size={12} /> {handover?.bedSummary?.total ?? 0} Global Units
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center animate-pulse">
                <RefreshCcw size={24} className="mx-auto text-slate-300 animate-spin mb-4" />
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Aggregating Zone Data...</p>
              </div>
            ) : error ? (
              <div className="p-8 bg-red-50 rounded-2xl border border-red-100 text-center">
                <AlertTriangle size={24} className="mx-auto text-red-500 mb-2" />
                <p className="text-sm font-bold text-red-700">{error}</p>
              </div>
            ) : !handover ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                <p className="text-xs text-slate-300 font-bold uppercase tracking-widest">No snapshot persists for this selection</p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {summaryCard('Total', handover.bedSummary.total ?? 0, 'Capacity')}
                  {summaryCard('Occupied', handover.bedSummary.occupied ?? 0, 'In Use')}
                  {summaryCard('Available', handover.bedSummary.available ?? 0, 'Ready')}
                  {summaryCard('Cleaning', handover.bedSummary.cleaning ?? 0, 'Turnover')}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Occupied Beds Detail */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 border-b border-slate-200 pb-2">Unit Audit</p>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {markedBeds.length ? markedBeds.map((bed) => (
                        <div key={bed.bedNumber} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <strong className="text-sm font-black text-slate-800">{bed.bedNumber}</strong>
                            <span className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Occupied</span>
                          </div>
                          <p className="text-xs font-bold text-slate-600">{bed.patient?.name ?? 'Patient unknown'}</p>
                          {bed.assignedDoctor && <p className="text-[10px] mt-2 text-slate-400 font-medium">Responsible: {bed.assignedDoctor}</p>}
                        </div>
                      )) : <p className="text-xs text-slate-400 italic text-center py-10">No occupied units in this snapshot.</p>}
                    </div>
                  </div>

                  {/* Summary Status */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 border-b border-slate-200 pb-2">Zone Overview</p>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <p className="text-sm font-black text-slate-900">Patient Stratification</p>
                      <div className="mt-4 grid grid-cols-1 gap-3">
                         <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-xs font-bold text-slate-600">Flagged Exceptions</span>
                            <span className="text-lg font-black text-red-600">{flaggedPatients.length}</span>
                         </div>
                         <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-xs font-bold text-slate-600">Incoming (En Route)</span>
                            <span className="text-lg font-black text-blue-600">{pendingAdmissions.length}</span>
                         </div>
                         <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-xs font-bold text-slate-600">Pending Departure</span>
                            <span className="text-lg font-black text-slate-900">{pendingDischarges.length}</span>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {handover && !loading && !error && (
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Clinical Escalations</h3>
                  <AlertTriangle size={18} className="text-amber-500" />
                </div>
                {openFlags.length ? (
                  <div className="space-y-3">
                    {openFlags.map((flag, index) => (
                      <div key={`${flag.type}-${index}`} className="rounded-xl border border-red-100 p-4 bg-red-50/30">
                        <p className="text-sm font-black text-red-900">{flag.type}</p>
                        <p className="text-[11px] text-red-700/80 mt-1 leading-relaxed font-medium">{flag.message}</p>
                        <p className="text-[9px] text-red-400 mt-3 font-bold uppercase tracking-tighter">Triggered: {new Date(flag.triggeredAt).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest text-center py-10">Safe Operational Margin</p>
                )}
              </section>

              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Pipeline Transitions</h3>
                  <CheckCircle2 size={18} className="text-blue-500" />
                </div>
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Incoming Adms</p>
                    {pendingAdmissions.length ? (
                      <div className="space-y-2">
                        {pendingAdmissions.map((admission, index) => (
                          <div key={`admission-${index}`} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                            <p className="text-xs font-bold text-slate-800">{admission.patient?.name ?? 'Unknown patient'}</p>
                            <p className="text-[10px] text-slate-400 mt-1">Arrival: {admission.expectedArrival ? new Date(admission.expectedArrival).toLocaleTimeString() : 'n/a'}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-300 italic">Nil pendens</p>
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Scheduled Dsrg</p>
                    {pendingDischarges.length ? (
                      <div className="space-y-2">
                        {pendingDischarges.map((discharge, index) => (
                          <div key={`discharge-${index}`} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                            <p className="text-xs font-bold text-slate-800">{discharge.patient?.name ?? 'Unknown patient'}</p>
                            <p className="text-[10px] text-slate-400 mt-1">Unit Assignment: {discharge.bed}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-300 italic">Nil pendens</p>
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
