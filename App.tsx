import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { 
  Search, Plus, Monitor, Wifi, Server, Trash2, Edit2, Check, X, 
  Moon, Sun, LayoutGrid, Zap, Box, PieChart, Globe, 
  Layers, Menu, ChevronDown, CheckCircle, XCircle, AlertTriangle, 
  ArrowUp, Link as LinkIcon, Terminal, History, Lock, Ban, Network,
  Filter, Router as RouterIcon, FileText, Download, Printer, Table as TableIcon,
  Activity, Info, ChevronRight, Eye
} from 'lucide-react';
import { db } from './services/firebase';
import { Cabin, Zones, PC, Stats, Device, DeviceType, Table } from './types';
import { DEVICE_TEMPLATES } from './constants';
import firebase from 'firebase/compat/app';

// --- ADVANCED STYLING INJECTION ---
const styles = document.createElement("style");
styles.innerHTML = `
  :root {
    --bg-light: #f8fafc;
    --bg-dark: #020617; 
    --glass-light: rgba(255, 255, 255, 0.85);
    --glass-dark: rgba(30, 41, 59, 0.4);
    --border-light: 1px solid rgba(226, 232, 240, 0.8);
    --border-dark: 1px solid rgba(255, 255, 255, 0.08);
  }
  
  .glass-panel {
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .dark .glass-panel { background: var(--glass-dark); border: var(--border-dark); box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3); }
  .light .glass-panel { background: var(--glass-light); border: var(--border-light); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05); }

  @keyframes pulse-soft { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
  .pulse-active { animation: pulse-soft 2s infinite; }
  
  @keyframes pop-in { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.2); } 100% { transform: scale(1); opacity: 1; } }
  .animate-pop { animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }

  .hover-3d { transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
  .hover-3d:hover { transform: translateY(-3px) scale(1.01); }

  /* Print Styles */
  @media print {
    aside, header, .no-print { display: none !important; }
    main { margin: 0; padding: 0; overflow: visible; }
    .glass-panel { box-shadow: none; border: 1px solid #ccc; background: white; color: black; }
    body { background: white; color: black; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
  }
`;
document.head.appendChild(styles);

// --- CONTEXTS ---

const ThemeContext = React.createContext<{theme: string, setTheme: (t: string) => void}>({ theme: 'dark', setTheme: () => {} });
const ToastContext = React.createContext<(msg: string, type?: 'success' | 'error') => void>(() => {});

// --- UI COMPONENTS ---

const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded ${className}`}></div>
);

const Badge: React.FC<{ children: React.ReactNode, color?: string }> = ({ children, color = "indigo" }) => {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    rose: "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
    slate: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-700/50 dark:text-slate-400 dark:border-slate-600",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${colors[color] || colors.indigo} font-khmer`}>
      {children}
    </span>
  );
};

const StatWidget = ({ title, value, icon: Icon, trend, color, delay }: any) => (
  <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover-3d" style={{ animationDelay: `${delay}ms` }}>
    <div className={`absolute top-0 right-0 w-20 h-20 bg-${color}-500 opacity-[0.08] rounded-bl-full transition-transform group-hover:scale-110`}></div>
    <div className="flex justify-between items-start relative z-10">
      <div>
        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2 font-khmer">{title}</h4>
        <div className="flex items-end gap-2">
          <span className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white">{value}</span>
          {trend && (
            <span className="text-[10px] font-bold text-emerald-500 mb-1.5 flex items-center">
              <ArrowUp size={10} className="mr-0.5" /> {trend}%
            </span>
          )}
        </div>
      </div>
      <div className={`w-10 h-10 rounded-xl bg-${color}-50 dark:bg-${color}-500/20 flex items-center justify-center text-${color}-500 shadow-sm border border-${color}-100 dark:border-${color}-500/30`}>
        <Icon size={18} />
      </div>
    </div>
    <div className="mt-4 h-1 w-full bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden">
      <div className={`h-full bg-${color}-500 w-2/3 rounded-full`}></div>
    </div>
  </div>
);

const PC_Node: React.FC<{ 
  pc: PC, 
  pcNum: string, 
  onClick: () => void, 
  onHover: (e: React.MouseEvent) => void,
  onLeave: () => void,
  isMatch?: boolean, 
  searchActive?: boolean 
}> = ({ pc, pcNum, onClick, onHover, onLeave, isMatch, searchActive }) => {
  let statusClass = "bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300 dark:hover:border-slate-500";
  let ringClass = "";

  if (pc.status === "connected") {
    statusClass = "bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400";
    ringClass = "pulse-active";
  } else if (pc.status === "offline") {
    statusClass = "bg-rose-50/50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-500";
  }

  // Handle Search Highlighting
  if (searchActive) {
    if (isMatch) {
      statusClass += " border-2 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.6)] scale-110 z-20 opacity-100 ring-2 ring-indigo-500/50 ring-offset-2 dark:ring-offset-slate-900";
    } else {
      // Subtle grayscale and reduced opacity for non-matched
      statusClass += " opacity-40 grayscale scale-95 pointer-events-none"; 
    }
  }

  return (
    <div
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`relative aspect-square rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:scale-[1.03] active:scale-95 hover:shadow-lg ${statusClass}`}
    >
      {pc.status === "connected" && (
        <span className="absolute top-1.5 right-1.5 md:top-2 md:right-2 flex h-1.5 w-1.5 md:h-2 md:w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 bg-emerald-500"></span>
        </span>
      )}

      {/* Using key={pc.status} triggers the animation when status changes */}
      <div key={pc.status} className="animate-pop">
        <Monitor size={20} className={`mb-1 md:mb-2 ${ringClass} w-4 h-4 md:w-5 md:h-5`} />
      </div>
      <span className="text-[8px] md:text-[10px] font-black uppercase tracking-wider">PC {pcNum}</span>
    </div>
  );
};

const CabinCard = ({ cabin, id, isExpanded, toggle, section, onEditPC, onEditTable, onDelete, onRename, searchQuery, filters, onHoverPC, onLeavePC }: any) => {
  const total: number = (Object.values(cabin.tables || {}) as any[]).reduce((acc: number, t: any) => acc + Object.keys(t.pcs || {}).length, 0);
  const active: number = (Object.values(cabin.tables || {}) as any[]).reduce((acc: number, t: any) => 
    acc + Object.values(t.pcs || {}).filter((p: any) => p.status === "connected").length, 0);

  const pct = total ? (active / total) * 100 : 0;
  
  const searchActive = !!(searchQuery || filters.type !== 'all' || filters.port || filters.status !== 'all');
  
  // Clean Search Query and create robust ID pattern matching
  const qClean = searchQuery.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Direct Cabin Search Match
  const cabinDirectMatch = qClean && cabin.number.toLowerCase().replace(/[^a-z0-9]/g, '').includes(qClean);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(cabin.number);

  const handleRename = () => {
    if (name.trim() && name !== cabin.number) {
        onRename(name);
    }
    setIsEditing(false);
  };

  return (
    <div className={`glass-panel rounded-2xl mb-4 md:mb-6 overflow-hidden transition-all duration-500 group border border-slate-100 dark:border-white/5 ${cabinDirectMatch ? 'ring-2 ring-indigo-500 shadow-xl' : 'hover:shadow-xl'}`}>
      {/* Header */}
      <div className="p-4 md:p-5 flex items-center justify-between cursor-pointer bg-white/40 dark:bg-slate-800/30 hover:bg-white/60 dark:hover:bg-slate-800/50 transition-colors" onClick={toggle}>
        <div className="flex items-center gap-3 md:gap-5">
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Server size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 md:gap-3 mb-1">
              {isEditing ? (
                  <div className="flex items-center">
                    <input 
                        autoFocus
                        value={name} 
                        onChange={(e) => setName(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                        onClick={(e) => e.stopPropagation()}
                        className="text-lg md:text-xl font-black bg-white dark:bg-slate-900 border border-indigo-500 rounded px-2 py-0.5 outline-none text-slate-800 dark:text-white w-32 font-khmer"
                    />
                  </div>
              ) : (
                <div className="flex items-center gap-2 group/edit">
                    <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-white truncate font-khmer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded px-1 -ml-1 transition-colors">{cabin.number}</h3>
                    <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="opacity-0 group-hover/edit:opacity-100 text-slate-400 hover:text-indigo-500 transition-opacity">
                        <Edit2 size={12} />
                    </button>
                </div>
              )}
              <div className="hidden md:flex gap-2">
                 {cabin.type === "RA" ? <Badge color="indigo">Zone A</Badge> : <Badge color="emerald">Zone B</Badge>}
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-32 md:w-64">
              <div className="flex-1 h-1.5 md:h-2 bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }}></div>
              </div>
              <span className="text-[9px] md:text-[10px] font-bold text-slate-500 dark:text-slate-400">{active}/{total}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-1 flex-wrap justify-end max-w-[150px]">
            {cabin.devices && cabin.devices.map((d: Device) => (
               <span key={d.id} className="text-[9px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500 border border-slate-200 dark:border-slate-700 truncate max-w-[80px]">
                 {d.name}
               </span>
            ))}
          </div>
          <button className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 ${isExpanded ? "rotate-180 bg-slate-200 dark:bg-slate-700" : ""}`}>
            <ChevronDown size={16} className="text-slate-400" />
          </button>
        </div>
      </div>

      {/* Expanded Body */}
      {isExpanded && (
        <div className="border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-black/20 p-3 md:p-6 animate-enter">
          <div className="grid gap-4 md:gap-6">
            {cabin.tables && Object.entries(cabin.tables).map(([tid, table]: any) => {
              const pcs = Object.entries(table.pcs || {});
              if (section === "RB") pcs.reverse(); // Visual mirroring for RB

              return (
                <div key={tid} className="bg-white dark:bg-slate-900/40 p-3 md:p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
                  <div className="flex justify-between items-center mb-3 md:mb-4 border-b border-slate-50 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-1 h-3 md:w-1.5 md:h-4 bg-indigo-500 rounded-full"></span>
                      <h5 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 font-khmer">{table.name || "Table"}</h5>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); onEditTable(`zones/${section}/${id}/tables/${tid}`, table.name); }} className="text-slate-300 hover:text-indigo-500 transition-colors">
                      <Edit2 size={12} />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 md:gap-3">
                    {pcs.map(([pid, pc]: any) => {
                      const pcNum = pid.replace("pc", "");
                      
                      // Powerful Search Logic
                      const tableNameClean = table.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                      const fullId = tableNameClean + pid; 
                      
                      let textMatch = false;
                      if (!qClean) {
                          textMatch = true;
                      } else {
                          // Check if "row2apc1" includes query, OR if query matches device name, OR if matches just "pc1"
                          textMatch = fullId.includes(qClean) || 
                                      pid.includes(qClean) || 
                                      (pc.sourceDeviceName && pc.sourceDeviceName.toLowerCase().replace(/[^a-z0-9]/g, '').includes(qClean));
                      }

                      const effectiveTextMatch = textMatch || cabinDirectMatch;

                      const typeMatch = filters.type === 'all' || (pc.sourceDeviceName && cabin.devices.find((d:Device) => d.name === pc.sourceDeviceName)?.type === filters.type);
                      const portMatch = !filters.port || pc.port === filters.port;
                      const statusMatch = filters.status === 'all' || pc.status === filters.status;

                      const isMatch = effectiveTextMatch && typeMatch && portMatch && statusMatch;
                      
                      return (
                      <PC_Node 
                        key={pid} 
                        pc={pc} 
                        pcNum={pcNum} 
                        onClick={() => onEditPC(`zones/${section}/${id}/tables/${tid}/pcs/${pid}`, pc, cabin.number, table.name, section, cabin.devices)}
                        onHover={(e) => onHoverPC(e, pc, table.name, cabin.number)}
                        onLeave={onLeavePC}
                        isMatch={isMatch}
                        searchActive={searchActive}
                      />
                    )})}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button onClick={onDelete} className="text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-khmer">
              <Trash2 size={14} /> លុបកាប៊ីន (Delete)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- SEARCH RESULT MODAL ---
const SearchResultModal = ({ data, onClose, onEdit }: any) => {
  if (!data) return null;
  const isConnected = data.status === 'connected';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm md:max-w-md rounded-3xl shadow-2xl overflow-hidden animate-enter border border-white/10 flex flex-col">
        {/* Header with Status Color */}
        <div className={`h-24 ${isConnected ? 'bg-emerald-500/20' : 'bg-rose-500/20'} flex items-center justify-center relative overflow-hidden`}>
           <div className={`absolute inset-0 ${isConnected ? 'bg-gradient-to-tr from-emerald-500/10 to-teal-500/10' : 'bg-gradient-to-tr from-rose-500/10 to-orange-500/10'}`}></div>
           <div className={`w-16 h-16 rounded-2xl ${isConnected ? 'bg-emerald-500 text-white shadow-emerald-500/40' : 'bg-rose-500 text-white shadow-rose-500/40'} shadow-lg flex items-center justify-center z-10 animate-pop`}>
              <Monitor size={32} />
           </div>
           <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-slate-800 dark:text-white transition-colors">
              <X size={20} />
           </button>
        </div>

        <div className="p-6 md:p-8">
          <div className="text-center mb-6">
            <h3 className="text-xl font-black text-slate-800 dark:text-white font-moul mb-1">{data.extraInfo.table} - PC{data.extraInfo.pcId.replace('pc','')}</h3>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${isConnected ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30' : 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30'} font-khmer`}>
              {isConnected ? <CheckCircle size={12} /> : <Ban size={12} />}
              {isConnected ? 'តភ្ជាប់ (Connected)' : 'ដាច់ (Offline)'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
               <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-khmer">ទីតាំង (Zone/Cabin)</span>
               <div className="flex items-center gap-2">
                 <Server size={16} className="text-indigo-500" />
                 <span className="text-sm font-black text-slate-700 dark:text-slate-200">{data.extraInfo.zone === 'RA' ? 'Zone A' : 'Zone B'} - <span className="font-khmer">{data.extraInfo.cabin}</span></span>
               </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
               <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-khmer">លេខផត (Port)</span>
               <div className="flex items-center gap-2">
                 <Network size={16} className="text-violet-500" />
                 <span className="text-sm font-black text-slate-700 dark:text-slate-200 font-mono">{data.port || 'N/A'}</span>
               </div>
            </div>
            <div className="col-span-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
               <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-khmer">ឧបករណ៍តភ្ជាប់ (Uplink Device)</span>
               <div className="flex items-center gap-2">
                 <RouterIcon size={16} className="text-orange-500" />
                 <span className="text-sm font-black text-slate-700 dark:text-slate-200 font-khmer">{data.sourceDeviceName || 'មិនបានកំណត់ (Not Set)'}</span>
               </div>
            </div>
          </div>

          <button onClick={() => { onClose(); onEdit(); }} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 font-khmer">
             <Edit2 size={16} /> កែប្រែព័ត៌មាន (Edit Info)
          </button>
        </div>
      </div>
    </div>
  );
};

// --- UPDATED WIZARD MODAL ---

const AddCabinWizard = ({ onClose, onCreate, currentView }: any) => {
  const [step, setStep] = useState(1);
  const isLocked = currentView === "RA" || currentView === "RB";
  const [data, setData] = useState<{
    number: string;
    section: string;
    devices: Device[];
  }>({
    number: "", 
    section: isLocked ? currentView : "RB",
    devices: []
  });

  const handleCreate = () => {
    onCreate(data);
  };

  const addDevice = (template: any) => {
    const newDevice: Device = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      type: template.type,
      name: `${template.defaultName}-${data.devices.filter(d => d.type === template.type).length + 1}`,
      ports: template.ports[0]
    };
    setData(prev => ({ ...prev, devices: [...prev.devices, newDevice] }));
  };

  const updateDevice = (id: string, field: keyof Device, value: string) => {
    setData(prev => ({
      ...prev,
      devices: prev.devices.map(d => d.id === id ? { ...d, [field]: value } : d)
    }));
  };

  const removeDevice = (id: string) => {
    setData(prev => ({ ...prev, devices: prev.devices.filter(d => d.id !== id) }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-enter border border-white/10">
        <div className="px-6 md:px-8 py-6 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold font-moul text-slate-800 dark:text-white">បង្កើតទូថ្មី</h3>
            <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(i => <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-800"}`}></div>)}
          </div>
        </div>
        <div className="p-6 md:p-8 min-h-[300px]">
          {step === 1 && (
            <div className="space-y-4 animate-enter">
              <h4 className="text-sm font-bold text-slate-500 uppercase font-khmer">អត្តសញ្ញាណកាប៊ីន (Cabin ID)</h4>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 font-khmer">លេខសម្គាល់កាប៊ីន</label>
                <input autoFocus className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold outline-none focus:border-indigo-500 transition-colors" placeholder="e.g. R-01" value={data.number} onChange={e => setData({ ...data, number: e.target.value })} />
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4 animate-enter">
              <h4 className="text-sm font-bold text-slate-500 uppercase font-khmer">តំបន់ទីតាំង (Location)</h4>
              {isLocked ? (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/30 rounded-xl flex items-center gap-4">
                  <Lock size={20} className="text-indigo-400" />
                  <div>
                    <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300 font-khmer">តំបន់ត្រូវបានកំណត់ (Zone Locked)</p>
                    <p className="text-xs text-indigo-500/80">Adding to {currentView === "RB" ? "Zone B" : "Zone A"} automatically.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {["RB", "RA"].map(z => (
                    <button key={z} onClick={() => setData({ ...data, section: z })} className={`p-4 rounded-xl border-2 text-left transition-all ${data.section === z ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" : "border-slate-200 dark:border-slate-800 hover:border-indigo-300"}`}>
                      <span className="block text-lg font-black mb-1">{z === "RB" ? "B" : "A"}</span>
                      <span className="text-xs font-bold text-slate-400 font-khmer">តំបន់ {z === "RB" ? "ឆ្វេង" : "ស្តាំ"}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4 animate-enter">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-slate-500 uppercase font-khmer">គ្រឿងបន្លាស់ (Hardware)</h4>
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-2">
                {DEVICE_TEMPLATES.map(t => (
                  <button key={t.label} onClick={() => addDevice(t)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-transparent hover:border-indigo-200 text-xs font-bold transition-all whitespace-nowrap">
                    <Plus size={12} /> {t.label}
                  </button>
                ))}
              </div>

              <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                {data.devices.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <p className="text-xs text-slate-400 font-bold">No devices added yet.</p>
                  </div>
                ) : (
                  data.devices.map((device) => (
                    <div key={device.id} className="p-3 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                           <span className={`p-1.5 rounded-md ${device.type === DeviceType.MANAGE ? 'bg-indigo-100 text-indigo-600' : device.type === DeviceType.ROUTER ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                             {device.type === DeviceType.MANAGE ? <Network size={14} /> : device.type === DeviceType.ROUTER ? <RouterIcon size={14} /> : <Wifi size={14} />}
                           </span>
                           <span className="text-[10px] font-bold uppercase text-slate-400">{device.type}</span>
                        </div>
                        <button onClick={() => removeDevice(device.id)} className="text-rose-400 hover:text-rose-500"><X size={14} /></button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <input 
                            className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5"
                            placeholder="Device Name"
                            value={device.name}
                            onChange={(e) => updateDevice(device.id, 'name', e.target.value)}
                          />
                        </div>
                        <select 
                          className="text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5"
                          value={device.ports}
                          onChange={(e) => updateDevice(device.id, 'ports', e.target.value)}
                        >
                          {DEVICE_TEMPLATES.find(t => t.type === device.type)?.ports.map(p => (
                            <option key={p} value={p}>{p} Ports</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <div className="p-6 bg-slate-50 dark:bg-slate-950 flex justify-between">
          <button disabled={step === 1} onClick={() => setStep(s => s - 1)} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors font-khmer">ត្រឡប់ក្រោយ (Back)</button>
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)} className="px-6 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all font-khmer">ជំហានបន្ទាប់ (Next)</button>
          ) : (
            <button onClick={handleCreate} className="px-6 py-2 rounded-lg bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all font-khmer">បង្កើត (Create)</button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- UPDATED PC DETAIL MODAL ---

const PCDetailModal = ({ initialData, onClose, onSave, onDelete }: any) => {
  const [data, setData] = useState({
    status: initialData.status || "offline", 
    sourceDeviceName: initialData.sourceDeviceName || "",
    port: initialData.port || "",
  });

  const cabinDevices: Device[] = initialData.cabinDevices || [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-enter border border-white/10">
        <div className="bg-slate-50 dark:bg-slate-950 p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 font-khmer">
              <span className="text-indigo-500">{initialData.extraInfo.zone}</span> / <span>{initialData.extraInfo.cabin}</span> / <span>{initialData.extraInfo.table}</span>
            </div>
            <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-5">
            {/* Status Toggle */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setData({ ...data, status: "connected" })} 
                className={`py-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${data.status === "connected" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600" : "border-slate-100 dark:border-slate-800 text-slate-400 opacity-50"}`}
              >
                <CheckCircle size={20} />
                <span className="text-[10px] font-bold uppercase font-khmer">តភ្ជាប់ (Connected)</span>
              </button>
              <button 
                 onClick={() => setData({ ...data, status: "offline" })} 
                 className={`py-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${data.status === "offline" ? "border-rose-500 bg-rose-50 dark:bg-rose-500/20 text-rose-600" : "border-slate-100 dark:border-slate-800 text-slate-400 opacity-50"}`}
              >
                <Ban size={20} />
                <span className="text-[10px] font-bold uppercase font-khmer">ដាច់ (Offline)</span>
              </button>
            </div>

            {/* Source Selection (Dropdown based on Cabin Devices) */}
            <div>
               <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block font-khmer">ឧបករណ៍តភ្ជាប់ (Uplink)</label>
               <select 
                 className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold outline-none focus:border-indigo-500"
                 value={data.sourceDeviceName}
                 onChange={(e) => setData({ ...data, sourceDeviceName: e.target.value })}
               >
                 <option value="">ជ្រើសរើស Switch/Router</option>
                 {cabinDevices.map(d => (
                   <option key={d.id} value={d.name}>{d.name} ({d.ports}p)</option>
                 ))}
               </select>
            </div>

            {/* Port Input */}
            <div>
               <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block font-khmer">លេខច្រក (Port Number)</label>
               <input 
                 className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold outline-none focus:border-indigo-500 font-mono"
                 placeholder="e.g. 5"
                 value={data.port}
                 onChange={(e) => setData({ ...data, port: e.target.value })}
               />
            </div>
            
            <button onClick={onDelete} className="w-full py-2 text-rose-500 text-xs font-bold hover:underline font-khmer">កំណត់ការតភ្ជាប់ឡើងវិញ (Reset)</button>
          </div>
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 bg-slate-50 dark:bg-slate-950">
          <button onClick={() => onSave(data)} className="w-full px-5 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 active:scale-95 transition-all font-khmer">រក្សាទុក (Save)</button>
        </div>
      </div>
    </div>
  );
};

// --- ALL INFO TABLE VIEW ---

const AllInfoView = ({ zones }: { zones: Zones }) => {
  const [filterCabin, setFilterCabin] = useState('');
  const [filterSwitch, setFilterSwitch] = useState('');
  const [filterPort, setFilterPort] = useState('');

  // Flatten Data
  const allRows = useMemo(() => {
    const rows: any[] = [];
    ['RA', 'RB'].forEach(zoneKey => {
      Object.entries(zones[zoneKey as keyof Zones] || {}).forEach(([cabinId, cabin]) => {
         Object.entries(cabin.tables || {}).forEach(([tableId, table]) => {
           Object.entries(table.pcs || {}).forEach(([pcId, pc]) => {
             rows.push({
               zone: zoneKey,
               cabinId: cabin.number, // Use ID as requested
               cabinRef: cabinId,
               devices: cabin.devices || [],
               table: table.name,
               pc: pcId,
               status: pc.status,
               uplink: pc.sourceDeviceName || '-',
               port: pc.port || '-',
               rawPC: pc
             });
           });
         });
      });
    });
    return rows;
  }, [zones]);

  // Derived Filter Options
  const uniqueCabins = useMemo(() => Array.from(new Set(allRows.map(r => r.cabinId))).sort(), [allRows]);
  
  // Filter Logic
  const filteredRows = allRows.filter(r => {
    const matchCabin = !filterCabin || r.cabinId === filterCabin;
    const matchSwitch = !filterSwitch || r.uplink === filterSwitch;
    const matchPort = !filterPort || r.port === filterPort;
    return matchCabin && matchSwitch && matchPort;
  });

  // Dynamic Switch Options based on current filters
  const availableSwitches = useMemo(() => {
    const switches = new Set<string>();
    filteredRows.forEach(r => {
      if (r.uplink !== '-') switches.add(r.uplink);
    });
    return Array.from(switches).sort();
  }, [filteredRows]);

  // New Available Ports
  const availablePorts = useMemo(() => {
    const ports = new Set<string>();
    const relevantRows = allRows.filter(r => 
      (!filterCabin || r.cabinId === filterCabin) && 
      (!filterSwitch || r.uplink === filterSwitch)
    );
    relevantRows.forEach(r => {
      if (r.port !== '-') ports.add(r.port);
    });
    return Array.from(ports).sort((a, b) => {
       const numA = parseInt(a);
       const numB = parseInt(b);
       return isNaN(numA) || isNaN(numB) ? a.localeCompare(b) : numA - numB;
    });
  }, [allRows, filterCabin, filterSwitch]);

  const handleExport = (type: 'csv') => {
    if (type === 'csv') {
      const headers = ['Zone', 'Cabin ID', 'Table', 'PC', 'Status', 'Uplink Device', 'Port'];
      const csvContent = [
        headers.join(','),
        ...filteredRows.map(r => [r.zone, r.cabinId, r.table, r.pc, r.status, r.uplink, r.port].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `network_report_${Date.now()}.csv`;
      link.click();
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 animate-enter">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center no-print">
         <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white font-moul">ព័ត៌មាន និង របាយការណ៍ (Reports)</h2>
            <p className="text-xs font-bold text-slate-400 font-khmer">បញ្ជីសារពើភ័ណ្ឌបណ្តាញទូលំទូលាយ</p>
         </div>
         <div className="flex gap-2">
           <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-khmer">
             <Printer size={16} /> បោះពុម្ព
           </button>
           <button onClick={() => handleExport('csv')} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-500/20 transition-colors border border-emerald-500/20 font-khmer">
             <Download size={16} /> ទាញយក Excel
           </button>
         </div>
      </div>

      <div className="glass-panel p-4 rounded-2xl border border-slate-100 dark:border-slate-800 no-print">
        <div className="flex flex-wrap gap-4">
           <div className="space-y-1">
             <label className="text-[10px] font-bold text-slate-400 uppercase font-khmer">លេខទូ (Cabin)</label>
             <select className="w-40 p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold" value={filterCabin} onChange={e => setFilterCabin(e.target.value)}>
               <option value="">ទាំងអស់ (All)</option>
               {uniqueCabins.map(c => <option key={c} value={c}>{c}</option>)}
             </select>
           </div>
           <div className="space-y-1">
             <label className="text-[10px] font-bold text-slate-400 uppercase font-khmer"> (Switch)</label>
             <select className="w-40 p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold" value={filterSwitch} onChange={e => setFilterSwitch(e.target.value)}>
               <option value="">ទាំងអស់ (All)</option>
               {availableSwitches.map(s => <option key={s} value={s}>{s}</option>)}
             </select>
           </div>
           <div className="space-y-1">
             <label className="text-[10px] font-bold text-slate-400 uppercase font-khmer">(Port)</label>
             <select className="w-40 p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold" value={filterPort} onChange={e => setFilterPort(e.target.value)}>
               <option value="">ទាំងអស់ (All)</option>
               {availablePorts.map(p => <option key={p} value={p}>{p}</option>)}
             </select>
           </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase font-bold text-slate-400 font-khmer">
              <tr>
                <th className="px-6 py-4">Zone</th>
                <th className="px-6 py-4">Cabin ID</th>
                <th className="px-6 py-4">table / PC</th>
                <th className="px-6 py-4">status</th>
                <th className="px-6 py-4">Switch</th>
                <th className="px-6 py-4">Port</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRows.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors text-xs font-bold">
                  <td className="px-6 py-4">
                    {r.zone === "RA" ? <Badge color="indigo">Zone A</Badge> : <Badge color="emerald">Zone B</Badge>}
                  </td>
                  <td className="px-6 py-4 font-khmer">{r.cabinId}</td>
                  <td className="px-6 py-4">
                    <span className="text-slate-500 dark:text-slate-400">{r.table}</span>
                    <span className="mx-2 text-slate-300">/</span>
                    <span className="text-slate-800 dark:text-white">{r.pc}</span>
                  </td>
                  <td className="px-6 py-4">
                    {r.status === 'connected' ? 
                      <span className="flex items-center gap-1.5 text-emerald-500 font-khmer"><CheckCircle size={14}/> តភ្ជាប់</span> : 
                      <span className="flex items-center gap-1.5 text-rose-500 font-khmer"><XCircle size={14}/> ដាច់</span>
                    }
                  </td>
                  <td className="px-6 py-4 font-mono text-indigo-500">{r.uplink}</td>
                  <td className="px-6 py-4 font-mono">{r.port}</td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-khmer">មិនមានទិន្នន័យ (No records found).</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- MAIN LAYOUT ---

const AppContent = () => {
  const { theme, setTheme } = useContext(ThemeContext);
  const addToast = useContext(ToastContext);

  const [view, setView] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [zones, setZones] = useState<Zones>({ RA: {}, RB: {} });
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, offline: 0, totalCabins: 0 });
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ type: 'all', port: '', status: 'all' });

  // Hover Info State
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; pc: PC; tableName: string; cabinName: string } | null>(null);

  // Modals
  const [modal, setModal] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>({});

  useEffect(() => {
    const zonesRef = db.ref("zones");
    const handleData = (snap: any) => {
      const d = snap.val() || { RA: {}, RB: {} };
      setZones({ RA: d.RA || {}, RB: d.RB || {} });
      let s = { total: 0, active: 0, offline: 0, totalCabins: 0 };
      ["RA", "RB"].forEach((z) => {
        if (d[z]) {
          const cabinList = Object.values(d[z] as Record<string, Cabin>);
          s.totalCabins += cabinList.length;
          cabinList.forEach((c) => {
            if (c.devices) s.total += c.devices.length;
            if (c.tables) Object.values(c.tables).forEach((t) => {
              if (t.pcs) Object.values(t.pcs).forEach((p) => {
                if (p.status === "connected") s.active++;
                else s.offline++; 
              });
            });
          });
        }
      });
      setStats(s);
      setLoading(false);
    };

    zonesRef.on("value", handleData);
    return () => zonesRef.off("value", handleData);
  }, []);

  const handleNav = (v: string) => { setView(v); setSidebarOpen(false); };
  const toggleExp = (id: string) => {
    const s = new Set(expanded);
    s.has(id) ? s.delete(id) : s.add(id);
    setExpanded(s);
  };

  const createCabin = async (data: any) => {
    const tables: any = {};
    const zoneSuffix = data.section === 'RA' ? 'A' : 'B';
    for (let i = 1; i <= 8; i++) {
      const pcs: any = {};
      for (let j = 1; j <= 6; j++) pcs[`pc${j}`] = { status: "offline" }; // Default offline
      tables[`table${i}`] = { name: `Row ${i}${zoneSuffix}`, pcs };
    }
    const payload: Cabin = {
      number: data.number, // The main identifier
      type: data.section,
      createdAt: Date.now(),
      devices: data.devices,
      tables,
    };
    try {
      await db.ref(`zones/${data.section}`).push(payload);
      addToast("បង្កើតកាប៊ីនបានជោគជ័យ (Created Successfully)");
      setModal(null);
    } catch { addToast("បរាជ័យ (Failed)", "error"); }
  };

  const updatePC = async (data: any) => {
    try {
      await db.ref(modalData.path).update(data);
      addToast("ធ្វើបច្ចុប្បន្នភាពបានជោគជ័យ");
      setModal(null);
    } catch { addToast("កំហុស (Error)", "error"); }
  };

  const resetPC = async () => {
    try {
      await db.ref(modalData.path).update({ status: "offline", sourceDeviceName: "", port: "" });
      addToast("កំណត់ឡើងវិញបានជោគជ័យ");
      setModal(null);
    } catch { addToast("កំហុស (Error)", "error"); }
  };

  const updateTable = async (name: string) => {
    await db.ref(modalData.path).update({ name });
    setModal(null);
  };

  const updateCabinName = async (section: string, id: string, newName: string) => {
    try {
      await db.ref(`zones/${section}/${id}`).update({ number: newName });
      addToast("ប្តូរឈ្មោះបានជោគជ័យ");
    } catch {
      addToast("កំហុស (Error)", "error");
    }
  };

  const deleteCabin = async (section: string, id: string) => {
    if (confirm("តើអ្នកពិតជាចង់លុបកាប៊ីននេះមែនទេ? (Are you sure?)")) {
      await db.ref(`zones/${section}/${id}`).remove();
      addToast("លុបបានជោគជ័យ");
    }
  };

  const handleHoverPC = (e: React.MouseEvent, pc: PC, tableName: string, cabinName: string) => {
     const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
     setHoverInfo({
        x: rect.left + rect.width / 2,
        y: rect.top,
        pc,
        tableName,
        cabinName
     });
  };

  // --- NEW: Global Search Function ---
  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const qClean = search.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!qClean) return;

    let found: any = null;
    let foundPath = "";
    let foundCabinDevices: Device[] = [];

    // Search across all zones
    (['RA', 'RB'] as const).forEach(zone => {
      if (found) return; // Optimization: stop if found
      const zoneData = zones[zone];
      if (!zoneData) return;

      Object.entries(zoneData).forEach(([cabinId, c]) => {
         if (found) return;
         const cabin = c as Cabin;
         if (!cabin.tables) return;

         Object.entries(cabin.tables).forEach(([tableId, t]) => {
            if (found) return;
            const table = t as Table;
            const tClean = table.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (!table.pcs) return;

            Object.entries(table.pcs).forEach(([pcId, p]) => {
               if (found) return;
               const pc = p as PC;
               const fullId = tClean + pcId;
               // Match Exact ID "Row2Apc1"
               if (fullId === qClean) {
                  found = { 
                    ...pc, 
                    extraInfo: { 
                       zone, 
                       cabin: cabin.number, 
                       table: table.name, 
                       pcId 
                    } 
                  };
                  foundPath = `zones/${zone}/${cabinId}/tables/${tableId}/pcs/${pcId}`;
                  foundCabinDevices = cabin.devices || [];
               }
            });
         });
      });
    });

    if (found) {
      setModalData({ ...found, path: foundPath, cabinDevices: foundCabinDevices });
      setModal('searchResult');
    } else {
      addToast("រកមិនឃើញទិន្នន័យ (Not Found)", "error");
    }
  };

  const renderList = (sec: "RA" | "RB") => {
    const list = Object.entries(zones[sec] || {}).filter(([_, c]: [string, Cabin]) => {
      const q = search.toLowerCase();
      // Powerful Search Pre-filter: Robust cleaning for ID matching
      const qClean = q.replace(/[^a-z0-9]/g, '');
      
      // Match Cabin Name
      const cabinMatch = c.number.toLowerCase().replace(/[^a-z0-9]/g, '').includes(qClean);
      
      // Match Device Name
      const deviceMatch = c.devices && c.devices.some((d:Device) => d.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(qClean));

      // Match Table/PC Name (Row2Apc1)
      const hasMatchingPC = Object.values(c.tables || {}).some((t: any) => {
        // Match Table Name "Row 2A" vs q="Row 2A"
        const tableNameClean = t.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        return Object.entries(t.pcs || {}).some(([pid, p]: any) => {
           // Combine Table Name + PC ID: "row2apc1"
           const fullId = tableNameClean + pid;
           const pcTextMatch = fullId.includes(qClean) || 
                               pid.includes(qClean) || 
                               (p.sourceDeviceName && p.sourceDeviceName.toLowerCase().replace(/[^a-z0-9]/g, '').includes(qClean));

           // Filter Check
           const typeMatch = filters.type === 'all' || (p.sourceDeviceName && c.devices.find((d:Device) => d.name === p.sourceDeviceName)?.type === filters.type);
           const portMatch = !filters.port || p.port === filters.port;
           const statusMatch = filters.status === 'all' || p.status === filters.status;
           
           // Combined Logic: 
           // If there is a search query: (Matched Text OR Matched Cabin) AND (Matched Filters)
           // If no search: Matched Filters only
           return ( (!qClean || cabinMatch || deviceMatch || pcTextMatch) && typeMatch && portMatch && statusMatch );
        });
      });

      return hasMatchingPC;
    });

    if (list.length === 0) return (
      <div className="flex flex-col items-center justify-center p-12 opacity-50">
        <Box size={48} className="mb-2 text-slate-300 dark:text-slate-700" />
        <p className="font-bold text-xs text-slate-400 font-khmer">មិនមានទិន្នន័យ (No cabins found).</p>
      </div>
    );

    return list.map(([id, c]) => (
      <CabinCard key={id} id={id} cabin={c} section={sec} isExpanded={expanded.has(id) || search.length > 0 || filters.type !== 'all' || !!filters.port || filters.status !== 'all'} toggle={() => toggleExp(id)} onDelete={() => deleteCabin(sec, id)}
        searchQuery={search}
        filters={filters}
        onRename={(newName: string) => updateCabinName(sec, id, newName)}
        onEditTable={(p: string, n: string) => { setModalData({ path: p, name: n }); setModal("editTable"); }}
        onEditPC={(p: string, d: any, cn: string, tn: string, z: string, devices: Device[]) => { setModalData({ path: p, ...d, extraInfo: { cabin: cn, table: tn, zone: z }, cabinDevices: devices }); setModal("editPC"); }}
        onHoverPC={handleHoverPC}
        onLeavePC={() => setHoverInfo(null)}
      />
    ));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#020617] transition-colors duration-300">
      {/* SIDEBAR */}
      <aside className={`fixed md:relative z-50 h-full w-72 glass-panel border-r-0 md:border-r border-white/20 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="h-20 md:h-24 flex items-center px-6 md:px-8 gap-3">
          <img src="https://i.postimg.cc/FHBn0Fdf/di3-copy.png" className="w-10 h-10 md:w-12 md:h-12 object-contain drop-shadow-lg" alt="Digital Industry" />
          <div>
            <h1 className="font-bold text-xs md:text-md tracking-wide text-slate-800 dark:text-white font-moul leading-tight">ឩស្សាហកម្មឌីជីថល</h1>
            <span className="text-[9px] md:text-[10px] font-bold text-slate-400 font-khmer">ប្រព័ន្ធគ្រប់គ្រងអ៊ីនធឺណិត</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden ml-auto text-slate-400"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar">
          <p className="px-4 text-[9px] md:text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 font-khmer">វិភាគទិន្នន័យ</p>
          <button onClick={() => handleNav("all")} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${view === "all" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "text-slate-500 hover:bg-white dark:hover:bg-white/5"} font-khmer`}>
            <PieChart size={18} /> ប្រព័ន្ធគ្រប់គ្រងទូទៅ
          </button>
           <button onClick={() => handleNav("reports")} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${view === "reports" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "text-slate-500 hover:bg-white dark:hover:bg-white/5"} font-khmer`}>
            <FileText size={18} /> របាយការណ៍
          </button>

          <p className="px-4 text-[9px] md:text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-8 mb-3 font-khmer">គ្រប់គ្រងតំបន់</p>
          <button onClick={() => handleNav("RB")} className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${view === "RB" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "text-slate-500 hover:bg-white dark:hover:bg-white/5"} font-khmer`}>
            <div className="flex items-center gap-4"><Server size={18} /> តំបន់ B (ឆ្វេង)</div>
            <span className="px-2 py-0.5 rounded bg-white/20 text-[10px]">{Object.keys(zones.RB || {}).length}</span>
          </button>
          <button onClick={() => handleNav("RA")} className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${view === "RA" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "text-slate-500 hover:bg-white dark:hover:bg-white/5"} font-khmer`}>
            <div className="flex items-center gap-4"><Layers size={18} /> តំបន់ A (ស្តាំ)</div>
            <span className="px-2 py-0.5 rounded bg-white/20 text-[10px]">{Object.keys(zones.RA || {}).length}</span>
          </button>
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-lg border-2 border-white dark:border-slate-800">AD</div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-white font-khmer">អ្នកគ្រប់គ្រង </p>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wide font-khmer">● កំពុងប្រើប្រាស់</p>
            </div>
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="ml-auto w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-indigo-500 transition-colors">
              {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col relative h-full overflow-hidden">
        <header className="flex flex-col border-b border-slate-200 dark:border-white/5 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-40">
          <div className="h-16 md:h-20 flex items-center justify-between px-4 md:px-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-500 dark:text-slate-300"><Menu size={24} /></button>
              <div>
                <h2 className="text-lg md:text-xl font-black text-slate-800 dark:text-white tracking-tight font-moul">
                  {view === "all" ? "ប្រព័ន្ធគ្រប់គ្រងទូទៅ" : view === "reports" ? "របាយការណ៍" : `អ្នកគ្រប់គ្រងតំបន់ ${view === "RB" ? "B" : "A"}`}
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block font-khmer">ការត្រួតពិនិត្យបណ្តាញតាមពេលវេលាជាក់ស្តែង</p>
              </div>
            </div>
            {view !== 'reports' && (
              <div className="hidden md:flex items-center gap-4">
                <form onSubmit={handleGlobalSearch} className="relative group flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl pr-1 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
                  <Search className="ml-3 text-slate-400" size={16} />
                  <input 
                    className="pl-3 pr-4 py-2.5 bg-transparent border-none outline-none font-bold text-xs text-slate-600 dark:text-slate-300 w-64 font-khmer" 
                    placeholder="ស្វែងរក (Ex: Row2Apc1)" 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                  />
                   {/* FIND BUTTON */}
                   <button type="submit" className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold mr-1 transition-colors font-khmer shadow-sm">
                      ស្វែងរក
                   </button>
                  <button type="button" onClick={() => setShowFilters(!showFilters)} className={`p-1.5 rounded-lg transition-colors ml-1 ${showFilters ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500'}`}>
                    <Filter size={14} />
                  </button>
                </form>
                <button onClick={() => setModal("addCabin")} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/30 text-xs font-bold transition-transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 font-khmer">
                  <Plus size={14} /> បង្កើតទូថ្មី
                </button>
              </div>
            )}
            <div className="flex md:hidden gap-2">
            </div>
          </div>
          
          {/* Filter Bar */}
          {view !== 'reports' && (
            <div className={`overflow-hidden transition-all duration-300 ${showFilters ? 'max-h-24 border-t border-slate-100 dark:border-slate-800' : 'max-h-0'}`}>
               <div className="px-4 md:px-8 py-3 flex flex-wrap items-center gap-4 bg-slate-50/50 dark:bg-black/20">
                  {/* Status Filter */}
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-khmer">ស្ថានភាព:</span>
                     <select 
                       value={filters.status} 
                       onChange={e => setFilters({...filters, status: e.target.value})}
                       className="text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none focus:border-indigo-500 font-khmer"
                     >
                       <option value="all">ទាំងអស់</option>
                       <option value="connected">តភ្ជាប់</option>
                       <option value="offline">ដាច់</option>
                     </select>
                  </div>

                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-khmer">ឧបករណ៍:</span>
                     <select 
                       value={filters.type} 
                       onChange={e => setFilters({...filters, type: e.target.value})}
                       className="text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none focus:border-indigo-500 font-khmer"
                     >
                       <option value="all">ទាំងអស់</option>
                       <option value="Manage">Manage Switch</option>
                       <option value="Router">Router</option>
                       <option value="POE">POE</option>
                     </select>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-khmer">លេខច្រក:</span>
                     <input 
                       placeholder="#" 
                       value={filters.port} 
                       onChange={e => setFilters({...filters, port: e.target.value})}
                       className="w-16 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none focus:border-indigo-500 text-center"
                     />
                  </div>
                  {(filters.type !== 'all' || filters.port || filters.status !== 'all') && (
                    <button onClick={() => setFilters({ type: 'all', port: '', status: 'all' })} className="text-[10px] font-bold text-rose-500 hover:underline ml-auto font-khmer">
                      សម្អាត (Clear)
                    </button>
                  )}
               </div>
            </div>
          )}
        </header>

        {view !== 'reports' && (
          <div className="md:hidden px-4 py-3 bg-white/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-white/5">
            <form onSubmit={handleGlobalSearch} className="relative flex gap-2">
              <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                 <input className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-xs font-bold outline-none border border-transparent focus:border-indigo-500 dark:text-white font-khmer" placeholder="ស្វែងរក..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <button type="submit" className="bg-indigo-500 text-white px-3 rounded-lg text-xs font-bold font-khmer">ស្វែងរក</button>
            </form>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar pb-32">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-64 rounded-2xl" />
            </div>
          ) : view === "reports" ? (
             <AllInfoView zones={zones} />
          ) : (
            <>
              {view === "all" && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-6 md:mb-8">
                  <StatWidget title="កាប៊ីនសរុប (Cabins)" value={stats.totalCabins} icon={Server} color="violet" delay="0" />
                  <StatWidget title="ឧបករណ៍សរុប (Devices)" value={stats.total} icon={Monitor} color="indigo" delay="100" />
                  <StatWidget title="កុំព្យូទ័រដំណើរការ (Online)" value={stats.active} icon={Wifi} color="emerald" delay="200" />
                  <StatWidget title="កុំព្យូទ័រដាច់ (Offline)" value={stats.offline} icon={AlertTriangle} color="rose" delay="300" />
                </div>
              )}
              {view === "all" ? (
                <div className="grid xl:grid-cols-2 gap-8 animate-enter">
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <span className="w-3 h-3 rounded bg-indigo-500"></span>
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest font-khmer">តំបន់ B (អគារឆ្វេង)</h3>
                    </div>
                    {renderList("RB")}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <span className="w-3 h-3 rounded bg-purple-500"></span>
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest font-khmer">តំបន់ A (អគារស្តាំ)</h3>
                    </div>
                    {renderList("RA")}
                  </div>
                </div>
              ) : (
                <div className="max-w-5xl mx-auto animate-enter">{renderList(view as "RA" | "RB")}</div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Floating Hover Tooltip */}
      {hoverInfo && (
        <div 
           className="fixed z-[100] pointer-events-none transform -translate-x-1/2 -translate-y-[110%] animate-enter"
           style={{ left: hoverInfo.x, top: hoverInfo.y }}
        >
           <div className="bg-slate-900/90 backdrop-blur text-white px-3 py-2 rounded-lg shadow-xl border border-white/10 text-xs min-w-[140px]">
              <div className="font-bold mb-1 border-b border-white/10 pb-1 flex items-center justify-between font-khmer">
                 <span>{hoverInfo.tableName} / PC{hoverInfo.pc.id}</span>
                 <span className={`w-2 h-2 rounded-full ${hoverInfo.pc.status === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              </div>
              <div className="space-y-0.5 text-slate-300">
                <div className="flex justify-between">
                   <span className="opacity-70 font-khmer">Uplink:</span>
                   <span className="font-bold text-white">{hoverInfo.pc.sourceDeviceName || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                   <span className="opacity-70 font-khmer">Port:</span>
                   <span className="font-mono text-indigo-400">{hoverInfo.pc.port || "-"}</span>
                </div>
                <div className="flex justify-between">
                   <span className="opacity-70 font-khmer">Cabin:</span>
                   <span className="font-bold font-khmer">{hoverInfo.cabinName}</span>
                </div>
              </div>
              <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
           </div>
        </div>
      )}

      {/* MODALS */}
      {modal === "searchResult" && (
         <SearchResultModal 
            data={modalData} 
            onClose={() => setModal(null)} 
            onEdit={() => setModal("editPC")}
         />
      )}
      {modal === "addCabin" && <AddCabinWizard onClose={() => setModal(null)} onCreate={createCabin} currentView={view} />}
      {modal === "editPC" && <PCDetailModal initialData={modalData} onClose={() => setModal(null)} onSave={updatePC} onDelete={resetPC} />}
      {modal === "editTable" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl w-full max-w-sm animate-enter border border-white/10">
            <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white font-moul">ប្តូរឈ្មោះតុ (Rename)</h3>
            <input autoFocus className="w-full p-3 mb-4 border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 outline-none font-bold dark:text-white font-khmer" value={modalData.name} onChange={e => setModalData({ ...modalData, name: e.target.value })} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-xs font-bold text-slate-500 font-khmer">បោះបង់</button>
              <button onClick={() => updateTable(modalData.name)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-lg font-khmer">រក្សាទុក</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ThemeProvider = ({ children }: any) => {
  const [theme, setTheme] = useState("dark");
  useEffect(() => {
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [theme]);
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
};

const ToastProvider = ({ children }: any) => {
  const [toasts, setToasts] = useState<{ id: number, msg: string, type: 'success' | 'error' }[]>([]);
  const addToast = (msg: string, type: 'success' | 'error' = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  };
  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border backdrop-blur-md animate-enter ${t.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"} bg-white dark:bg-slate-800`}>
            {t.type === "success" ? <CheckCircle size={16} /> : <XCircle size={16} />}
            <span className="text-xs font-bold font-khmer">{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ThemeProvider>
  );
}