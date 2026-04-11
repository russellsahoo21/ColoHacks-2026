import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X as CloseIcon } from "lucide-react";

// Icons using Lucide-style SVG paths
const ActivityIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const BedIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 4v16" /><path d="M2 8h18a2 2 0 0 1 2 2v10" /><path d="M2 17h20" /><path d="M6 8v9" />
  </svg>
);

const ClipboardListIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" />
  </svg>
);

const TrendingUpIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
  </svg>
);

const FlagIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
  </svg>
);

const BuildingIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" />
  </svg>
);

const ClockIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const UsersIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const FileTextIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

const HexagonIcon = ({ icon: Icon }) => (
  <div className="relative w-12 h-12 md:w-16 md:h-16 flex items-center justify-center flex-shrink-0">
    <svg className="absolute w-full h-full text-[#0891B2] fill-current" viewBox="0 0 100 100">
      <polygon points="50 3 93.3 28 93.3 80 50 105 6.7 80 6.7 28" />
    </svg>
    <div className="relative z-10 text-white">
      {React.cloneElement(Icon, { className: "w-5 h-5 md:w-6 md:h-6" })}
    </div>
  </div>
);

export default function WardWatchLandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToFeatures = (e) => {
    e.preventDefault();
    setIsMenuOpen(false);
    const el = document.getElementById("features");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const keyFeatures = [
    { title: "Live Bed Status Board", desc: "Monitor every bed with real-time status updates: occupied, available, cleaning, or reserved.", icon: <BedIcon /> },
    { title: "Admission & Discharge Queue", desc: "Track scheduled admissions, emergency transfers, and expected discharges from a single unified view.", icon: <ClipboardListIcon /> },
    { title: "Ward Capacity Forecast", desc: "Anticipate bed shortages with four-hour and eight-hour capacity projections based on real data.", icon: <TrendingUpIcon /> },
    { title: "Escalation Flags", desc: "Receive clear, automatic alerts for prolonged cleaning times or impending 90% capacity limits.", icon: <FlagIcon /> },
    { title: "Multi-Ward View", desc: "A read-only executive view allowing administrators to observe occupancy and patient flow across the entire hospital.", icon: <BuildingIcon /> },
  ];

  const optionalFeatures = [
    { title: "Length-of-Stay Outliers", desc: "Identify patients whose length of stay exceeds typical clinical ranges to review necessity.", icon: <ClockIcon className="w-5 h-5" /> },
    { title: "Staff Assignment View", desc: "Visualize which staff member is assigned to which beds using a simple digital interface.", icon: <UsersIcon className="w-5 h-5" /> },
    { title: "Shift Handover Summary", desc: "Auto-generate concise handover notes tracking bed status, alerts, and pending clinical moves.", icon: <FileTextIcon className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen font-sans bg-[#F8FAFC] text-slate-800">
      {/* Navbar */}
      <nav className="fixed w-full top-0 z-50 px-6 lg:px-12 py-4 bg-[#0B1E43]/95 backdrop-blur-md text-white border-b border-[#1E3A8A]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ActivityIcon className="w-7 h-7 text-[#38BDF8]" />
            <span className="text-xl md:text-2xl font-bold tracking-tight mt-0.5">WardWatch</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <div className="flex items-center gap-6 mr-4 border-r border-[#1E3A8A] pr-10">
              <a href="#features" onClick={scrollToFeatures} className="text-slate-300 hover:text-white transition-colors">Features</a>
              <a href="#problem" className="text-slate-300 hover:text-white transition-colors">Solutions</a>
              {/* <a href="#" className="text-slate-300 hover:text-white transition-colors">Pricing</a>
              <a href="#" className="text-slate-300 hover:text-white transition-colors">Contact</a> */}
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login" className="px-5 py-2 rounded-md border border-slate-500 hover:bg-slate-800 hover:border-slate-400 text-slate-200 transition-colors">Login</Link>
              <Link to="/register" className="px-5 py-2 rounded-md bg-[#0284C7] hover:bg-[#0369A1] text-white transition-colors">Register</Link>
            </div>
          </div>

          <button className="md:hidden p-2 text-slate-300 hover:text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <CloseIcon size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-[#0B1E43] border-b border-[#1E3A8A] py-6 px-6 flex flex-col gap-6 animate-in slide-in-from-top duration-300">
            <a href="#features" onClick={scrollToFeatures} className="text-lg font-bold text-slate-300">Features</a>
            <a href="#problem" onClick={() => setIsMenuOpen(false)} className="text-lg font-bold text-slate-300">Solutions</a>
            <a href="#" className="text-lg font-bold text-slate-300">Pricing</a>
            <a href="#" className="text-lg font-bold text-slate-300">Contact</a>
            <div className="flex flex-col gap-4 pt-4 border-t border-[#1E3A8A]">
              <Link to="/login" className="w-full text-center py-3 rounded-md border border-slate-500 text-white">Login</Link>
              <Link to="/register" className="w-full text-center py-3 rounded-md bg-[#0284C7] text-white">Register Hospital</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 lg:px-12 bg-[#0B1E43] text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#1E3A8A]/20 to-transparent pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <div className="lg:w-1/2 flex justify-center lg:justify-start animate-in fade-in slide-in-from-left duration-1000">
              <div className="relative group">
                {/* Visual accents */}
                <div className="absolute -inset-4 bg-[#38BDF8]/20 rounded-full blur-3xl group-hover:bg-[#38BDF8]/30 transition-all duration-700"></div>
                <div className="absolute -top-6 -left-6 w-24 h-24 border-t-2 border-l-2 border-[#38BDF8]/30 rounded-tl-3xl"></div>
                <div className="absolute -bottom-6 -right-6 w-24 h-24 border-b-2 border-r-2 border-[#38BDF8]/30 rounded-br-3xl"></div>
                
                <div className="relative z-10 overflow-hidden rounded-2xl border border-white/10 shadow-2xl transform transition-transform duration-500 hover:scale-[1.02]">
                   <img
                    src="https://t4.ftcdn.net/jpg/02/60/04/09/360_F_260040900_oO6YW1sHTnKxby4GcjCvtypUCWjnQRg5.jpg"
                    alt="Professional Medical Doctor"
                    className="w-full h-auto max-w-[480px] object-cover"
                  />
                  {/* Overlay for depth */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B1E43]/40 to-transparent"></div>
                </div>
              </div>
            </div>

            <div className="max-w-3xl lg:w-1/2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#38BDF8]/10 text-[#38BDF8] text-xs font-bold uppercase tracking-widest border border-[#38BDF8]/20 mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#38BDF8] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#38BDF8]"></span>
                </span>
                Clinical Capacity Intelligence
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-8">
                Real-time Ward <br />
                <span className="text-[#38BDF8]">Visibility.</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-300 mb-10 leading-relaxed font-medium">
                Eliminate patient flow bottlenecks. Coordinate admissions, discharges, and bed turnover with absolute precision across every ward.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8 lg:mb-0">
                <Link to="/register" className="px-8 py-4 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-lg transition-all shadow-lg shadow-[#0284C7]/20 text-center">Get Started</Link>
                <a href="#features" onClick={scrollToFeatures} className="px-8 py-4 rounded-xl border border-slate-600 hover:bg-slate-800 text-white font-bold text-lg transition-all text-center">View Demo</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hexagon Features Section */}
      <section className="relative z-30 -mt-12 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4">
              <HexagonIcon icon={<BedIcon />} />
              <div>
                <h3 className="text-lg font-bold text-[#0B1E43]">Live Bed Status</h3>
                <p className="text-slate-500 text-sm">Real-time occupancy tracking</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <HexagonIcon icon={<TrendingUpIcon />} />
              <div>
                <h3 className="text-lg font-bold text-[#0B1E43]">Capacity Forecast</h3>
                <p className="text-slate-500 text-sm">Actionable 8-hour projections</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <HexagonIcon icon={<ClipboardListIcon />} />
              <div>
                <h3 className="text-lg font-bold text-[#0B1E43]">Admission Queue</h3>
                <p className="text-slate-500 text-sm">Seamless discharge planning</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Massive Visual Block: Typographic Problem Statement */}
      <section id="problem" className="py-20 md:py-32 px-6 lg:px-12 bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-16 items-center">
          <div className="lg:w-5/12 text-center lg:text-left">
            <h2 className="text-[2.5rem] sm:text-[3.5rem] md:text-[5rem] lg:text-[7rem] font-black text-[#0B1E43] leading-[0.9] tracking-tighter">
              The
              <br />
              <span className="text-[#38BDF8]">Blind</span>
              <br />
              Spot.
            </h2>
            <div className="w-24 h-2 bg-[#38BDF8] mt-8 mx-auto lg:ml-0"></div>
          </div>
          <div className="lg:w-7/12 lg:border-l-[8px] border-[#0B1E43] lg:pl-16 text-center lg:text-left">
            <p className="text-xl md:text-2xl lg:text-3xl text-slate-700 font-medium leading-snug mb-8 font-serif italic">
              "When medical staff make admission decisions based on stale data, wards hit capacity without warning. Discharges are delayed, and emergency patients suffer."
            </p>
            <p className="text-lg md:text-xl text-[#0284C7] font-bold uppercase tracking-widest">It's time to stop guessing.</p>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-24 px-6 lg:px-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-24 mx-auto max-w-6xl bg-gradient-to-br from-[#0B1E43] to-[#0A192F] rounded-3xl p-8 md:p-12 lg:p-20 text-center shadow-2xl relative overflow-hidden border border-[#1E3A8A]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[6rem] md:text-[10rem] lg:text-[18rem] font-black text-white/[0.04] select-none whitespace-nowrap pointer-events-none">REAL TIME</div>
            <div className="relative z-10 w-full flex flex-col items-center">
              <div className="bg-[#38BDF8]/20 text-[#38BDF8] px-4 py-1.5 rounded-full text-[10px] md:text-sm font-bold uppercase tracking-wider mb-8 border border-[#38BDF8]/30">The WardWatch Advantage</div>
              <h3 className="text-2xl md:text-4xl lg:text-6xl font-extrabold text-white leading-tight mb-16 max-w-3xl border-b border-[#1E3A8A] pb-12">
                One Single Dashboard. <br />
                <span className="text-[#38BDF8]">Absolute Clarity.</span>
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full text-left">
                {[
                  { val: "100", unit: "%", label: "Bed Visibility" },
                  { val: "0", unit: "s", label: "Refresh Delay" },
                  { val: "8", unit: "hr", label: "Forecast Horizon" },
                  { val: "2", unit: "tap", label: "Update Action" }
                ].map((stat, i) => (
                  <div key={i} className="bg-[#0B1E43]/80 border border-[#1E3A8A] p-4 md:p-8 rounded-2xl backdrop-blur-md">
                    <div className="text-[#38BDF8] text-2xl md:text-5xl font-black mb-3">{stat.val}<span className="text-xl md:text-3xl">{stat.unit}</span></div>
                    <div className="text-slate-300 font-bold tracking-wide text-[8px] md:text-xs uppercase">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0B1E43] mb-4">Core Operational Features</h2>
            <p className="text-base md:text-lg text-slate-500 font-medium italic">Built to handle the complexity of hospital patient flow.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {keyFeatures.map((feature, idx) => (
              <div key={idx} className="p-8 bg-slate-50 rounded-xl border border-slate-200 hover:border-[#38BDF8] hover:shadow-lg transition-all group">
                <div className="w-14 h-14 rounded-lg bg-white border border-slate-100 text-[#0284C7] flex items-center justify-center mb-6 shadow-sm group-hover:bg-[#0284C7] group-hover:text-white transition-colors">
                  {React.cloneElement(feature.icon, { className: "w-6 h-6" })}
                </div>
                <h3 className="text-2xl font-bold text-[#0B1E43] mb-3 leading-snug">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Features */}
      <section className="py-24 md:py-32 px-6 lg:px-12 bg-[#0B1E43] border-y border-[#1E3A8A] relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#38BDF8]/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row gap-16">
            <div className="lg:w-1/3 text-center lg:text-left">
              <h2 className="text-3xl md:text-[3rem] font-bold mb-6 leading-tight">Seamless Coordination</h2>
              <p className="text-slate-300 text-lg md:text-xl leading-relaxed mb-10 max-w-md mx-auto lg:mx-0">
                Replace manual whiteboards with integrated tools that keep your team perfectly aligned.
              </p>
              <div className="w-16 h-1 bg-[#38BDF8] mx-auto lg:ml-0"></div>
            </div>
            <div className="lg:w-2/3 space-y-6">
              {optionalFeatures.map((feature, idx) => (
                <div key={idx} className="relative p-6 md:p-10 rounded-2xl border border-[#1E3A8A] bg-[#0A192F] hover:border-[#38BDF8] transition-colors group overflow-hidden flex flex-col sm:flex-row items-center gap-8">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[6rem] md:text-[10rem] font-black text-white/[0.03] select-none pointer-events-none">0{idx + 1}</div>
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#1E3A8A] border-4 border-[#0B1E43] flex items-center justify-center text-[#38BDF8] flex-shrink-0 group-hover:scale-110 transition-transform relative z-10">
                    {React.cloneElement(feature.icon, { className: "w-8 h-8" })}
                  </div>
                  <div className="relative z-10 text-center sm:text-left">
                    <h4 className="text-xl md:text-2xl font-bold mb-2 text-white">{feature.title}</h4>
                    <p className="text-slate-400 text-base md:text-lg leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32 px-6 lg:px-12 bg-white text-center border-b border-slate-200">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black text-[#0B1E43] mb-6 tracking-tight">Optimize Your Capacity</h2>
          <p className="text-lg md:text-xl text-slate-500 font-medium mb-12 italic">Join the leading hospitals reducing bottlenecks with WardWatch.</p>
          <Link to="/register" className="w-full sm:w-auto inline-flex items-center justify-center px-10 md:px-12 py-5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] shadow-xl text-white text-lg md:text-xl font-bold transition-all hover:-translate-y-1">Register Hospital Today</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0A192F] py-16 px-6 lg:px-12 border-t border-[#1E3A8A] text-slate-300">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-center sm:justify-start gap-3 text-white font-bold mb-6">
              <ActivityIcon className="w-6 h-6 text-[#38BDF8]" />
              <span className="text-2xl tracking-tight mt-0.5">WardWatch</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400 text-center sm:text-left">Transforming hospital capacity management with real-time bed visibility and intelligent patient flow analytics.</p>
          </div>
          {[
            { title: "Product", links: ["Features", "Solutions", "Security", "API"] },
            { title: "Company", links: ["About", "Careers", "Blog", "Contact"] },
            { title: "Legal", links: ["Privacy", "Terms", "Cookies", "HIPAA"] }
          ].map((col, i) => (
            <div key={i} className="text-center sm:text-left">
              <h4 className="text-white font-bold mb-6 tracking-wide">{col.title}</h4>
              <ul className="space-y-4 text-sm">
                {col.links.map((link, j) => (
                  <li key={j}><a href="#" className="hover:text-[#38BDF8] transition-colors">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-[#1E3A8A] flex flex-col md:flex-row justify-between items-center gap-4 text-xs md:text-sm text-slate-500 text-center">
          <p>© {new Date().getFullYear()} WardWatch Clinical Systems. All rights reserved.</p>
          <div className="flex gap-6 italic">
            <a href="#" className="hover:text-[#38BDF8] transition-colors">Twitter</a>
            <a href="#" className="hover:text-[#38BDF8] transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-[#38BDF8] transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
