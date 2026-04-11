import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Printer, Link2, ArrowLeft, Clock, CheckCircle2, AlertTriangle, Building2, RefreshCcw, Menu, X as CloseIcon } from 'lucide-react';
import { apiClient } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import UserProfileSidebar from '../components/UserProfileSidebar.jsx';

const shiftOptions = [
  { value: 'latest', label: 'Shift Handover Summary' },
  // { value: 'Shift 1', label: 'Shift 1 (00:00 - 08:00)' },
  // { value: 'Shift 2', label: 'Shift 2 (08:00 - 16:00)' },
  // { value: 'Shift 3', label: 'Shift 3 (16:00 - 24:00)' },
];

const summaryCard = (title, value, description) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 mb-2">{title}</p>
    <p className="text-2xl md:text-3xl font-black text-slate-900 mb-2">{value}</p>
    <p className="text-xs text-slate-500">{description}</p>
  </div>
);

export default function GlobalReports() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const selectedShift = searchParams.get('shift') ?? 'latest';
  const [report, setReport] = useState(null);
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
      const data = await apiClient(`/reports/global${query}`);
      setReport(data);
    } catch (err) {
      setReport(null);
      setError(err.message || 'Unable to load global report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedShift]);

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

  const pendingAdmissions = report?.pendingAdmissions ?? [];
  const pendingDischarges = report?.pendingDischarges ?? [];
  const openFlags = report?.openFlags ?? [];
  const reportSummary = report?.reportSummary ?? {};

  const completedAdmissions = report?.completedAdmissions ?? [];
  const completedDischarges = report?.completedDischarges ?? [];
  const recentTransfers = report?.recentTransfers ?? [];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden transition-colors">
      <UserProfileSidebar isOpen={false} onClose={() => { }} />

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 z-50 print:hidden">
        <div className="flex items-center space-x-2">
          <div className="bg-indigo-900 p-1.5 rounded-lg text-white">
            <Building2 size={18} />
          </div>
          <span className="font-black text-xs tracking-tight uppercase">Global Reports</span>
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
          <div className="bg-indigo-900 p-2 rounded-lg text-white shadow-lg shadow-indigo-900/20">
            <Building2 size={24} />
          </div>
          <div>
            <h1 className="text-sm font-bold">Global Reports</h1>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Hospital-wide</p>
          </div>
        </div>

        <button onClick={() => navigate(`/dashboard`)} className="flex items-center gap-2 px-4 py-3 mb-6 rounded-xl bg-slate-50 text-slate-700 font-bold hover:bg-slate-100 transition text-sm">
          <ArrowLeft size={16} /> Dashboard
        </button>

        <div className="space-y-2 mt-4 md:mt-0">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 md:hidden">Select Shift</p>
          {shiftOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleShiftChange(option.value)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm font-semibold ${selectedShift === option.value ? 'border-indigo-900 bg-indigo-50 text-indigo-900 shadow-sm' : 'border-slate-100 bg-white text-slate-600 hover:border-slate-300'}`}
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
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">Shift: {selectedShift === 'latest' ? 'Latest' : selectedShift}</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Global Shift Report</h2>
              <p className="text-xs md:text-sm text-slate-400 mt-1 font-medium">Hospital-wide clinical summary aggregated across all active zones.</p>
            </div>

            <div className="flex flex-wrap gap-3 print:hidden">
              <div className="hidden sm:flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">
                <Link2 size={14} className="text-slate-400" />
              </div>
              <button onClick={handleCopy} className="flex-1 sm:flex-none inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-900 text-white font-bold text-sm hover:bg-indigo-800 transition shadow-lg shadow-indigo-900/10 active:scale-95">
                Copy Link
              </button>
              <button onClick={handlePrint} className="flex-1 sm:flex-none inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold text-sm hover:bg-slate-50 transition active:scale-95">
                <Printer size={16} /> Print
              </button>
            </div>
          </div>

          {copySuccess && <div className="px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest w-fit animate-bounce">{copySuccess}</div>}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {summaryCard('Status', selectedShift === 'latest' ? (report?.shiftLabel ?? 'Latest') : selectedShift, 'Clinical Context')}
            {summaryCard('Zones', report?.wardsIncluded ?? 0, 'Active Areas')}
            {summaryCard('Admit', reportSummary.admissionsProcessed ?? 0, 'Processed')}
            {summaryCard('Dsrg', reportSummary.dischargesCompleted ?? 0, 'Completed')}
          </div>
        </div>

        <div className="space-y-6">
          <section className="bg-white border border-slate-200 rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm print:border-none print:shadow-none">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Global Bed Metrics</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time terminal audit</p>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                <Clock size={12} /> {report?.bedSummary?.total ?? 0} Global Units
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center animate-pulse">
                <RefreshCcw size={24} className="mx-auto text-slate-300 animate-spin mb-4" />
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Aggregating Global Data...</p>
              </div>
            ) : error ? (
              <div className="p-8 bg-red-50 rounded-2xl border border-red-100 text-center">
                <AlertTriangle size={24} className="mx-auto text-red-500 mb-2" />
                <p className="text-sm font-bold text-red-700">{error}</p>
              </div>
            ) : !report ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                <p className="text-xs text-slate-300 font-bold uppercase tracking-widest">No snapshot persists for this selection</p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                    <p className="text-2xl font-black text-slate-900">{report.bedSummary?.total ?? 0}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Occupied</p>
                    <p className="text-2xl font-black text-slate-900">{report.bedSummary?.occupied ?? 0}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Available</p>
                    <p className="text-2xl font-black text-emerald-600">{report.bedSummary?.available ?? 0}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Transitions</p>
                    <p className="text-2xl font-black text-indigo-600">{reportSummary.bedTransitions?.total ?? 0}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Pending Admissions */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Admissions Pending</h4>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {pendingAdmissions.length ? pendingAdmissions.map((admission, idx) => (
                        <div key={idx} className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm hover:border-indigo-200 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{admission.patient?.name ?? 'Unknown'}</p>
                              <p className="text-[9px] text-slate-400 mt-0.5">ETA: {admission.expectedArrival ? new Date(admission.expectedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'n/a'}</p>
                            </div>
                            <span className="shrink-0 text-[8px] font-black uppercase bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">{admission.wardName}</span>
                          </div>
                        </div>
                      )) : <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest text-center py-8 bg-slate-50 rounded-xl">Nil Pendens</p>}
                    </div>
                  </div>

                  {/* Pending Discharges */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1 h-4 bg-slate-800 rounded-full"></div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Discharges Pending</h4>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {pendingDischarges.length ? pendingDischarges.map((discharge, idx) => (
                        <div key={idx} className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm hover:border-slate-300 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{discharge.patient?.name ?? 'Unknown'}</p>
                              <p className="text-[9px] text-slate-400 mt-0.5">Bed: {discharge.bed}</p>
                            </div>
                            <span className="shrink-0 text-[8px] font-black uppercase bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">{discharge.wardName}</span>
                          </div>
                        </div>
                      )) : <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest text-center py-8 bg-slate-50 rounded-xl">Nil Pendens</p>}
                    </div>
                  </div>

                  {/* Escalation Flags */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Escalation Flags</h4>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {openFlags.length ? openFlags.map((flag, idx) => (
                        <div key={idx} className="bg-red-50/50 border border-red-100 p-3 rounded-xl shadow-sm hover:bg-red-50 transition-colors">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-[10px] font-black text-red-700 uppercase tracking-tight truncate">{flag.type}</p>
                            <span className="shrink-0 text-[8px] font-black uppercase bg-red-100 text-red-700 px-1.5 py-0.5 rounded">{flag.wardName}</span>
                          </div>
                          <p className="text-[10px] text-red-600/80 leading-relaxed font-medium line-clamp-2">{flag.message}</p>
                        </div>
                      )) : <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest text-center py-8 bg-slate-50 rounded-xl">Safe Status</p>}
                    </div>
                  </div>
                </div>

                
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
