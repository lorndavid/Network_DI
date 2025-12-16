
import React, { useState, useEffect, useContext, useMemo, useRef } from "react";
import {
  Search,
  Plus,
  Monitor,
  Wifi,
  Server,
  Trash2,
  Edit2,
  Check,
  X,
  Moon,
  Sun,
  LayoutGrid,
  Zap,
  Box,
  PieChart,
  Globe,
  Layers,
  Menu,
  ChevronDown,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowUp,
  Link as LinkIcon,
  Terminal,
  History,
  Lock,
  Ban,
  Network,
  Filter,
  Router as RouterIcon,
  FileText,
  Download,
  Printer,
  Table as TableIcon,
  Activity,
  Info,
  ChevronRight,
  Eye,
  MapPin,
  ArrowUpCircle,
  List,
  Smartphone,
  LogOut,
  Settings,
  User
} from "lucide-react";
import { db } from "./services/firebase";
import { Cabin, Zones, PC, Stats, Device, DeviceType, Table } from "./types";
import { DEVICE_TEMPLATES } from "./constants";
import firebase from "firebase/compat/app";

// --- ADVANCED STYLING INJECTION ---
const styles = document.createElement("style");
styles.innerHTML = `
  :root {
    --bg-light: #f8fafc;
    --bg-dark: #020617; 
    --glass-light: rgba(255, 255, 255, 0.85);
    --glass-dark: rgba(15, 23, 42, 0.6);
    --border-light: 1px solid rgba(226, 232, 240, 0.8);
    --border-dark: 1px solid rgba(255, 255, 255, 0.08);
  }
  
  .glass-panel {
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
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

  /* Custom Scrollbar for Sidebar */
  .sidebar-scroll::-webkit-scrollbar { width: 4px; }
  .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
  .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(100, 116, 139, 0.2); border-radius: 4px; }
  .sidebar-scroll:hover::-webkit-scrollbar-thumb { background: rgba(100, 116, 139, 0.5); }

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

const ThemeContext = React.createContext<{
  theme: string;
  setTheme: (t: string) => void;
}>({ theme: "dark", setTheme: () => {} });
const ToastContext = React.createContext<
  (msg: string, type?: "success" | "error") => void
>(() => {});

// --- UI COMPONENTS ---

const Skeleton = ({ className }: { className: string }) => (
  <div
    className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded ${className}`}
  ></div>
);

const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({
  children,
  color = "indigo",
}) => {
  const colors: Record<string, string> = {
    indigo:
      "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20",
    emerald:
      "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    rose: "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
    slate:
      "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-700/50 dark:text-slate-400 dark:border-slate-600",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
        colors[color] || colors.indigo
      } font-khmer`}
    >
      {children}
    </span>
  );
};

const StatWidget = ({
  title,
  value,
  icon: Icon,
  trend,
  color,
  delay,
  onClick,
}: any) => (
  <div
    onClick={onClick}
    className={`glass-panel p-5 rounded-2xl relative overflow-hidden group hover-3d ${
      onClick ? "cursor-pointer active:scale-95" : ""
    }`}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div
      className={`absolute top-0 right-0 w-20 h-20 bg-${color}-500 opacity-[0.08] rounded-bl-full transition-transform group-hover:scale-110`}
    ></div>
    <div className="flex justify-between items-start relative z-10">
      <div>
        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2 font-khmer">
          {title}
        </h4>
        <div className="flex items-end gap-2">
          <span className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white">
            {value}
          </span>
          {trend && (
            <span className="text-[10px] font-bold text-emerald-500 mb-1.5 flex items-center">
              <ArrowUp size={10} className="mr-0.5" /> {trend}%
            </span>
          )}
        </div>
      </div>
      <div
        className={`w-10 h-10 rounded-xl bg-${color}-50 dark:bg-${color}-500/20 flex items-center justify-center text-${color}-500 shadow-sm border border-${color}-100 dark:border-${color}-500/30`}
      >
        <Icon size={18} />
      </div>
    </div>
    <div className="mt-4 h-1 w-full bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden">
      <div className={`h-full bg-${color}-500 w-2/3 rounded-full`}></div>
    </div>
  </div>
);

const PC_Node: React.FC<{
  pc: PC;
  pcNum: string;
  onClick: () => void;
  onHover: (e: React.MouseEvent) => void;
  onLeave: () => void;
  isMatch?: boolean;
  searchActive?: boolean;
}> = ({ pc, pcNum, onClick, onHover, onLeave, isMatch, searchActive }) => {
  let statusClass =
    "bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300 dark:hover:border-slate-500";
  let ringClass = "";

  if (pc.status === "connected") {
    statusClass =
      "bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400";
    ringClass = "pulse-active";
  } else if (pc.status === "offline") {
    statusClass =
      "bg-rose-50/50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-500";
  }

  // Handle Search Highlighting
  if (searchActive) {
    if (isMatch) {
      statusClass +=
        " border-2 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.6)] scale-110 z-20 opacity-100 ring-2 ring-indigo-500/50 ring-offset-2 dark:ring-offset-slate-900";
    } else {
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

      <div key={pc.status} className="animate-pop">
        <Monitor
          size={20}
          className={`mb-1 md:mb-2 ${ringClass} w-4 h-4 md:w-5 md:h-5`}
        />
      </div>
      <span className="text-[8px] md:text-[10px] font-black uppercase tracking-wider">
        PC {pcNum}
      </span>
    </div>
  );
};

// --- CABIN CARD ---

const CabinCard = ({
  cabin,
  id,
  isExpanded,
  toggle,
  section,
  onEditPC,
  onEditTable,
  onDelete,
  onRename,
  onAddTable,
  onAddPC,
  onDeleteTable,
  searchQuery,
  filters,
  onHoverPC,
  onLeavePC,
}: any) => {
  const total: number = (Object.values(cabin.tables || {}) as any[]).reduce(
    (acc: number, t: any) => acc + Object.keys(t.pcs || {}).length,
    0
  );
  const active: number = (Object.values(cabin.tables || {}) as any[]).reduce(
    (acc: number, t: any) =>
      acc +
      Object.values(t.pcs || {}).filter((p: any) => p.status === "connected")
        .length,
    0
  );

  const pct = total ? (active / total) * 100 : 0;

  const searchActive = !!(
    searchQuery ||
    filters.type !== "all" ||
    filters.port ||
    filters.status !== "all"
  );
  const qClean = searchQuery.toLowerCase().replace(/[^a-z0-9]/g, "");
  const cabinDirectMatch =
    qClean &&
    cabin.number
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .includes(qClean);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(cabin.number);

  const handleRename = () => {
    if (name.trim() && name !== cabin.number) {
      onRename(name);
    }
    setIsEditing(false);
  };

  const sortedTables = useMemo(() => {
    if (!cabin.tables) return [];
    return Object.entries(cabin.tables).sort((a: any, b: any) =>
      a[1].name.localeCompare(b[1].name, undefined, {
        numeric: true,
        sensitivity: "base",
      })
    );
  }, [cabin.tables]);

  // Find primary switch (Manage Switch or Router)
  const primarySwitch = cabin.devices?.find(
    (d: Device) => d.type === DeviceType.MANAGE || d.type === DeviceType.ROUTER
  );

  return (
    <div
      className={`glass-panel rounded-2xl mb-4 md:mb-6 overflow-hidden transition-all duration-500 group border border-slate-100 dark:border-white/5 ${
        cabinDirectMatch
          ? "ring-2 ring-indigo-500 shadow-xl"
          : "hover:shadow-xl"
      }`}
    >
      {/* Header - REFACTORED FOR SAME ROW ALIGNMENT */}
      <div
        className="p-4 md:p-5 flex items-center justify-between cursor-pointer bg-white/40 dark:bg-slate-800/30 hover:bg-white/60 dark:hover:bg-slate-800/50 transition-colors"
        onClick={toggle}
      >
        {/* Left Side: Icon, Name, Progress */}
        <div className="flex items-center gap-3 md:gap-5 flex-1 min-w-0">
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
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
                    onKeyDown={(e) => e.key === "Enter" && handleRename()}
                    onClick={(e) => e.stopPropagation()}
                    className="text-lg md:text-xl font-black bg-white dark:bg-slate-900 border border-indigo-500 rounded px-2 py-0.5 outline-none text-slate-800 dark:text-white w-32 font-khmer"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 group/edit">
                  <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-white truncate font-khmer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded px-1 -ml-1 transition-colors">
                    {cabin.number}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(true);
                    }}
                    className="opacity-0 group-hover/edit:opacity-100 text-slate-400 hover:text-indigo-500 transition-opacity"
                  >
                    <Edit2 size={12} />
                  </button>
                </div>
              )}
              <div className="hidden md:flex gap-2">
                {cabin.type === "RA" ? (
                  <Badge color="indigo">Zone A</Badge>
                ) : (
                  <Badge color="emerald">Zone B</Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 w-32 md:w-64">
              <div className="flex-1 h-1.5 md:h-2 bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                  style={{ width: `${pct}%` }}
                ></div>
              </div>
              <span className="text-[9px] md:text-[10px] font-bold text-slate-500 dark:text-slate-400">
                {active}/{total}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Switch Name + Chevron (SAME ROW) */}
        <div className="flex items-center gap-3 pl-2">
          {primarySwitch && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/20 backdrop-blur-sm shadow-sm transition-all hover:bg-indigo-100/80 dark:hover:bg-indigo-900/40">
              <Network size={12} className="text-indigo-500" />
              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-300 uppercase tracking-wide whitespace-nowrap">
                {primarySwitch.name}
              </span>
            </div>
          )}
          
          {/* Mobile Switch Icon Only */}
          {primarySwitch && (
             <div className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500">
                <Network size={14} />
             </div>
          )}

          <button
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 ${
              isExpanded ? "rotate-180 bg-slate-200 dark:bg-slate-700" : ""
            }`}
          >
            <ChevronDown size={16} className="text-slate-400" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-black/20 p-3 md:p-6 animate-enter">
          <div className="grid gap-4 md:gap-6">
            {sortedTables.map(([tid, table]: any) => {
              // --- SORTING LOGIC: Zone A (L->R), Zone B (R->L) ---
              const pcs = Object.entries(table.pcs || {}).sort(
                (a: any, b: any) => {
                  const numA = parseInt(a[0].replace(/\D/g, "")) || 0;
                  const numB = parseInt(b[0].replace(/\D/g, "")) || 0;

                  // If Zone B (RB): Sort Descending (PC6 -> PC1) so PC1 is on Right
                  if (section === "RB") {
                    return numB - numA;
                  }
                  // If Zone A (RA): Sort Ascending (PC1 -> PC6) so PC1 is on Left
                  return numA - numB;
                }
              );

              return (
                <div
                  key={tid}
                  className="bg-white dark:bg-slate-900/40 p-3 md:p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-sm relative group/table"
                >
                  <div className="flex justify-between items-center mb-3 md:mb-4 border-b border-slate-50 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-1 h-3 md:w-1.5 md:h-4 bg-indigo-500 rounded-full"></span>
                      <h5 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 font-khmer">
                        {table.name || "Table"}
                      </h5>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Edit Table Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditTable(
                            `zones/${section}/${id}/tables/${tid}`,
                            table.name
                          );
                        }}
                        className="text-slate-300 hover:text-indigo-500 transition-colors"
                      >
                        <Edit2 size={12} />
                      </button>
                      {/* Delete Table Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTable(section, id, tid);
                        }}
                        className="text-slate-300 hover:text-rose-500 transition-colors ml-1"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 md:gap-3">
                    {pcs.map(([pid, pc]: any) => {
                      const pcNum = pid.replace("pc", "");

                      const tableNameClean = table.name
                        .toLowerCase()
                        .replace(/[^a-z0-9]/g, "");
                      const fullId = tableNameClean + pid;

                      let textMatch = false;
                      if (!qClean) {
                        textMatch = true;
                      } else {
                        textMatch =
                          fullId.includes(qClean) ||
                          pid.includes(qClean) ||
                          (pc.sourceDeviceName &&
                            pc.sourceDeviceName
                              .toLowerCase()
                              .replace(/[^a-z0-9]/g, "")
                              .includes(qClean));
                      }
                      const effectiveTextMatch = textMatch || cabinDirectMatch;
                      const typeMatch =
                        filters.type === "all" ||
                        (pc.sourceDeviceName &&
                          cabin.devices.find(
                            (d: Device) => d.name === pc.sourceDeviceName
                          )?.type === filters.type);
                      const portMatch =
                        !filters.port || pc.port === filters.port;
                      const statusMatch =
                        filters.status === "all" ||
                        pc.status === filters.status;
                      const isMatch =
                        effectiveTextMatch &&
                        typeMatch &&
                        portMatch &&
                        statusMatch;

                      return (
                        <PC_Node
                          key={pid}
                          pc={pc}
                          pcNum={pcNum}
                          onClick={() =>
                            onEditPC(
                              `zones/${section}/${id}/tables/${tid}/pcs/${pid}`,
                              pc,
                              cabin.number,
                              table.name,
                              section,
                              cabin.devices
                            )
                          }
                          onHover={(e) =>
                            onHoverPC(e, pc, table.name, cabin.number)
                          }
                          onLeave={onLeavePC}
                          isMatch={isMatch}
                          searchActive={searchActive}
                        />
                      );
                    })}
                    {/* ADD NEW PC BUTTON */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddPC(section, id, tid);
                      }}
                      className="aspect-square rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-500 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all cursor-pointer group/addpc"
                    >
                      <Plus
                        size={20}
                        className="group-hover/addpc:scale-110 transition-transform"
                      />
                      <span className="text-[8px] font-bold mt-1 uppercase">
                        Add PC
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddTable(section, id);
              }}
              className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/40 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-khmer border border-indigo-200 dark:border-indigo-500/30"
            >
              <Plus size={14} /> បន្ថែមជួរថ្មី (Add Row)
            </button>

            <button
              onClick={onDelete}
              className="text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-khmer"
            >
              <Trash2 size={14} /> លុបកាប៊ីន (Delete)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- INFO NETWORK VIEW ---

const InfoNetworkView = ({ zones }: { zones: Zones }) => {
  const [activeTab, setActiveTab] = useState<"RA" | "RB">("RB");
  const activeZone = zones[activeTab] || {};

  const summary = useMemo(() => {
    return Object.entries(activeZone)
      .map(([id, cabin]: any) => {
        const tableCount = cabin.tables ? Object.keys(cabin.tables).length : 0;
        const devices = cabin.devices || [];
        const switches = devices.filter(
          (d: Device) =>
            d.type === DeviceType.MANAGE || d.type === DeviceType.ROUTER
        );

        let onlineCount = 0;
        let offlineCount = 0;
        const usedPorts: string[] = [];

        if (cabin.tables) {
          Object.values(cabin.tables).forEach((t: any) => {
            if (t.pcs) {
              Object.values(t.pcs).forEach((p: any) => {
                if (p.status === "connected") onlineCount++;
                else offlineCount++;

                if (p.port) usedPorts.push(p.port);
              });
            }
          });
        }

        // Sort used ports naturally
        usedPorts.sort((a, b) => {
          const na = parseInt(a);
          const nb = parseInt(b);
          return isNaN(na) || isNaN(nb) ? a.localeCompare(b) : na - nb;
        });

        return {
          id,
          name: cabin.number,
          tableCount,
          onlineCount,
          offlineCount,
          usedPorts: Array.from(new Set(usedPorts)), // active ports unique
          switches,
        };
      })
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true })
      );
  }, [activeZone]);

  return (
    <div className="animate-enter space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white font-moul">
            Info Network
          </h2>
          <p className="text-xs font-bold text-slate-400 font-khmer">
            Summary of Cabins, Status & Ports
          </p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("RB")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all font-khmer ${
              activeTab === "RB"
                ? "bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-white"
                : "text-slate-500"
            }`}
          >
            តុតំបន់ B
          </button>
          <button
            onClick={() => setActiveTab("RA")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all font-khmer ${
              activeTab === "RA"
                ? "bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-white"
                : "text-slate-500"
            }`}
          >
            តុតំបន់ A
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {summary.map((item) => (
          <div
            key={item.id}
            className="glass-panel p-5 rounded-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500">
                  <Server size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white font-khmer">
                    {item.name}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {item.tableCount} Tables
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {/* Online / Offline Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-emerald-50 dark:bg-emerald-500/10 p-2 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block">
                    Online
                  </span>
                  <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                    {item.onlineCount}
                  </span>
                </div>
                <div className="bg-rose-50 dark:bg-rose-500/10 p-2 rounded-lg border border-rose-100 dark:border-rose-500/20">
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase block">
                    Offline
                  </span>
                  <span className="text-xl font-black text-rose-700 dark:text-rose-300">
                    {item.offlineCount}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                  <RouterIcon size={12} /> Switches / Routers
                </h4>
                {item.switches.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {item.switches.map((s: Device) => (
                      <span
                        key={s.id}
                        className="px-2 py-1 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-xs font-bold text-indigo-500"
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    No Uplink Devices
                  </span>
                )}
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                  <Network size={12} /> Active Ports Used
                </h4>
                {item.usedPorts.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {item.usedPorts.map((p) => (
                      <span
                        key={p}
                        className="w-6 h-6 flex items-center justify-center bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 font-mono"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    No ports assigned
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- REPORT VIEW (Full Table) ---

const ReportView = ({ zones }: { zones: Zones }) => {
  const [filterZone, setFilterZone] = useState("all");
  const [filterSwitch, setFilterSwitch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const allRows = useMemo(() => {
    const rows: any[] = [];
    ["RA", "RB"].forEach((zoneKey) => {
      Object.entries(zones[zoneKey as keyof Zones] || {}).forEach(
        ([cabinId, cabin]) => {
          Object.entries(cabin.tables || {}).forEach(([tableId, table]) => {
            Object.entries(table.pcs || {}).forEach(([pcId, pc]) => {
              rows.push({
                zone: zoneKey,
                cabinId: cabin.number,
                table: table.name,
                pc: pcId,
                status: pc.status,
                uplink: pc.sourceDeviceName || "-",
                port: pc.port || "-",
              });
            });
          });
        }
      );
    });
    return rows;
  }, [zones]);

  const uniqueSwitches = useMemo(() => {
    const s = new Set<string>();
    allRows.forEach((r) => {
      if (r.uplink !== "-") s.add(r.uplink);
    });
    return Array.from(s).sort();
  }, [allRows]);

  const filteredRows = allRows.filter((r) => {
    const matchZone = filterZone === "all" || r.zone === filterZone;
    const matchSwitch = !filterSwitch || r.uplink === filterSwitch;
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchZone && matchSwitch && matchStatus;
  });

  return (
    <div className="p-4 md:p-8 space-y-6 animate-enter">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white font-moul">
            របាយការណ៍ (Report)
          </h2>
          <p className="text-xs font-bold text-slate-400 font-khmer">
            Network Inventory List
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-slate-500 hover:text-indigo-500"
          >
            <Printer size={20} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-wrap gap-4">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
            Zone
          </label>
          <select
            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold w-32"
            value={filterZone}
            onChange={(e) => setFilterZone(e.target.value)}
          >
            <option value="all">All Zones</option>
            <option value="RA">Zone A</option>
            <option value="RB">Zone B</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
            Switch Name
          </label>
          <select
            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold w-40"
            value={filterSwitch}
            onChange={(e) => setFilterSwitch(e.target.value)}
          >
            <option value="">All Switches</option>
            {uniqueSwitches.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
            Status
          </label>
          <select
            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold w-32"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="connected">Online</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      {/* Table */}
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
                <tr
                  key={i}
                  className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors text-xs font-bold"
                >
                  <td className="px-6 py-4">
                    {r.zone === "RA" ? (
                      <Badge color="indigo">Zone A</Badge>
                    ) : (
                      <Badge color="emerald">Zone B</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 font-khmer">{r.cabinId}</td>
                  <td className="px-6 py-4">
                    <span className="text-slate-500 dark:text-slate-400">
                      {r.table}
                    </span>
                    <span className="mx-2 text-slate-300">/</span>
                    <span className="text-slate-800 dark:text-white">
                      PC{r.pc.replace("pc", "")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {r.status === "connected" ? (
                      <span className="flex items-center gap-1.5 text-emerald-500 font-khmer">
                        <CheckCircle size={14} /> តភ្ជាប់
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-rose-500 font-khmer">
                        <XCircle size={14} /> ដាច់
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono text-indigo-500">
                    {r.uplink}
                  </td>
                  <td className="px-6 py-4 font-mono">{r.port}</td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-400 font-khmer"
                  >
                    No records found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- UPDATED PC DETAIL MODAL (With Delete) ---

const PCDetailModal = ({
  initialData,
  onClose,
  onSave,
  onDelete,
  onRemove,
}: any) => {
  const [data, setData] = useState({
    status: initialData.status || "offline",
    sourceDeviceName: initialData.sourceDeviceName || "",
    port: initialData.port || "",
  });

  const cabinDevices: Device[] = initialData.cabinDevices || [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-enter border border-white/10">
        <div className="bg-slate-50 dark:bg-slate-950 p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 font-khmer">
              <span className="text-indigo-500">
                {initialData.extraInfo.zone}
              </span>{" "}
              / <span>{initialData.extraInfo.cabin}</span> /{" "}
              <span>{initialData.extraInfo.table}</span>
            </div>
            <button onClick={onClose}>
              <X size={20} className="text-slate-400" />
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-5">
            {/* Status Toggle */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setData({ ...data, status: "connected" })}
                className={`py-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                  data.status === "connected"
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600"
                    : "border-slate-100 dark:border-slate-800 text-slate-400 opacity-50"
                }`}
              >
                <CheckCircle size={20} />
                <span className="text-[10px] font-bold uppercase font-khmer">
                  តភ្ជាប់ (Connected)
                </span>
              </button>
              <button
                onClick={() => setData({ ...data, status: "offline" })}
                className={`py-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                  data.status === "offline"
                    ? "border-rose-500 bg-rose-50 dark:bg-rose-500/20 text-rose-600"
                    : "border-slate-100 dark:border-slate-800 text-slate-400 opacity-50"
                }`}
              >
                <Ban size={20} />
                <span className="text-[10px] font-bold uppercase font-khmer">
                  ដាច់ (Offline)
                </span>
              </button>
            </div>

            {/* Source Selection */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block font-khmer">
                ឧបករណ៍តភ្ជាប់ (Uplink)
              </label>
              <select
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold outline-none focus:border-indigo-500"
                value={data.sourceDeviceName}
                onChange={(e) =>
                  setData({ ...data, sourceDeviceName: e.target.value })
                }
              >
                <option value="">ជ្រើសរើស Switch</option>
                {cabinDevices.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Port Input */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block font-khmer">
                លេខច្រក (Port Number)
              </label>
              <input
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold outline-none focus:border-indigo-500 font-mono"
                placeholder="e.g. 5"
                value={data.port}
                onChange={(e) => setData({ ...data, port: e.target.value })}
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={onDelete}
                className="text-orange-500 text-xs font-bold hover:underline font-khmer"
              >
                Reset Info
              </button>
              {/* Delete PC Button */}
              <button
                onClick={onRemove}
                className="text-rose-500 text-xs font-bold hover:bg-rose-50 px-2 py-1 rounded transition-colors font-khmer flex items-center gap-1"
              >
                <Trash2 size={12} /> Delete PC
              </button>
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 bg-slate-50 dark:bg-slate-950">
          <button
            onClick={() => onSave(data)}
            className="w-full px-5 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 active:scale-95 transition-all font-khmer"
          >
            រក្សាទុក (Save)
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MODALS (Other) ---
const AddTableModal = ({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: (name: string) => void;
}) => {
  const [name, setName] = useState("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onConfirm(name);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-enter border border-white/10">
        <h3 className="text-lg font-bold font-moul mb-4 text-slate-800 dark:text-white">
          បន្ថែមជួរថ្មី (Add Row)
        </h3>
        <form onSubmit={handleSubmit}>
          <label className="text-xs font-bold text-slate-400 uppercase mb-1 block font-khmer">
            ឈ្មោះជួរ (Table Name)
          </label>
          <input
            autoFocus
            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 mb-6 font-bold outline-none focus:border-indigo-500 font-khmer"
            placeholder="Ex: Row 9A"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 font-khmer"
            >
              បោះបង់
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-3 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 disabled:opacity-50 font-khmer"
            >
              បង្កើត
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
const DeviceListModal = ({
  title,
  devices,
  onClose,
}: {
  title: string;
  devices: any[];
  onClose: () => void;
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl h-[80vh] rounded-2xl shadow-2xl overflow-hidden animate-enter border border-white/10 flex flex-col">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
          <h3 className="text-lg font-bold font-khmer flex items-center gap-2">
            <List size={20} className="text-indigo-500" /> {title}
          </h3>
          <button onClick={onClose}>
            <X size={20} className="text-slate-400 hover:text-rose-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="text-[10px] uppercase text-slate-400 font-bold sticky top-0 bg-white dark:bg-slate-900 z-10">
              <tr>
                <th className="p-2 border-b dark:border-slate-800">Location</th>
                <th className="p-2 border-b dark:border-slate-800">PC Name</th>
                <th className="p-2 border-b dark:border-slate-800">Uplink</th>
                <th className="p-2 border-b dark:border-slate-800">Port</th>
              </tr>
            </thead>
            <tbody className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {devices.map((d, i) => (
                <tr
                  key={i}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="p-2 border-b border-slate-50 dark:border-slate-800/50">
                    {d.extraInfo.cabin} {" /"}
                    {d.extraInfo.table}
                  </td>
                  <td className="p-2 border-b border-slate-50 dark:border-slate-800/50 text-indigo-500">
                    PC {d.extraInfo.pcId.replace("pc", "")}
                  </td>
                  <td className="p-2 border-b border-slate-50 dark:border-slate-800/50">
                    {d.sourceDeviceName || "-"}
                  </td>
                  <td className="p-2 border-b border-slate-50 dark:border-slate-800/50 font-mono">
                    {d.port || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-950 text-center text-xs text-slate-400 font-bold border-t border-slate-100 dark:border-slate-800">
          Total: {devices.length} Devices
        </div>
      </div>
    </div>
  );
};
const SearchResultModal = ({ data, onClose, onEdit }: any) => {
  if (!data) return null;
  const isConnected = data.status === "connected";
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm md:max-w-md rounded-3xl shadow-2xl overflow-hidden animate-enter border border-white/10 flex flex-col">
        <div
          className={`h-24 ${
            isConnected ? "bg-emerald-500/20" : "bg-rose-500/20"
          } flex items-center justify-center relative overflow-hidden`}
        >
          <div
            className={`absolute inset-0 ${
              isConnected
                ? "bg-gradient-to-tr from-emerald-500/10 to-teal-500/10"
                : "bg-gradient-to-tr from-rose-500/10 to-orange-500/10"
            }`}
          ></div>
          <div
            className={`w-16 h-16 rounded-2xl ${
              isConnected
                ? "bg-emerald-500 text-white shadow-emerald-500/40"
                : "bg-rose-500 text-white shadow-rose-500/40"
            } shadow-lg flex items-center justify-center z-10 animate-pop`}
          >
            <Monitor size={32} />
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-slate-800 dark:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 md:p-8">
          <div className="text-center mb-6">
            <h3 className="text-xl font-black text-slate-800 dark:text-white font-moul mb-1">
              {data.extraInfo.table} - PC{data.extraInfo.pcId.replace("pc", "")}
            </h3>
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                isConnected
                  ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30"
                  : "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30"
              } font-khmer`}
            >
              {isConnected ? <CheckCircle size={12} /> : <Ban size={12} />}
              {isConnected ? "តភ្ជាប់ (Connected)" : "ដាច់ (Offline)"}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-khmer">
                លេខសម្គាល់ទូ
              </span>
              <div className="flex items-center gap-2">
                <Server size={16} className="text-indigo-500" />
                <span className="text-sm font-black text-slate-700 dark:text-slate-200">
                   {" "}
                  <span className="font-khmer">{data.extraInfo.cabin}</span>
                </span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-khmer">
                Port
              </span>
              <div className="flex items-center gap-2">
                <Network size={16} className="text-violet-500" />
                <span className="text-sm font-black text-slate-700 dark:text-slate-200 font-mono">
                  {data.port || "N/A"}
                </span>
              </div>
            </div>
            <div className="col-span-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-khmer">
                ឈ្មោះឧបករណ៍
              </span>
              <div className="flex items-center gap-2">
                <RouterIcon size={16} className="text-orange-500" />
                <span className="text-sm font-black text-slate-700 dark:text-slate-200 font-khmer">
                  {data.sourceDeviceName || "មិនបានកំណត់ (Not Set)"}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
              onEdit();
            }}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 font-khmer"
          >
            <Edit2 size={16} /> កែប្រែព័ត៌មាន (Edit Info)
          </button>
        </div>
      </div>
    </div>
  );
};
const AddCabinWizard = ({ onClose, onCreate, currentView }: any) => {
  const [step, setStep] = useState(1);
  const isLocked = currentView === "RA" || currentView === "RB";
  const [data, setData] = useState<{
    number: string;
    section: string;
    devices: Device[];
  }>({ number: "", section: isLocked ? currentView : "RB", devices: [] });
  const handleCreate = () => {
    onCreate(data);
  };
  const addDevice = (template: any) => {
    const newDevice: Device = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      type: template.type,
      name: `${template.defaultName}-${
        data.devices.filter((d) => d.type === template.type).length + 1
      }`,
      ports: template.ports[0],
    };
    setData((prev) => ({ ...prev, devices: [...prev.devices, newDevice] }));
  };
  const updateDevice = (id: string, field: keyof Device, value: string) => {
    setData((prev) => ({
      ...prev,
      devices: prev.devices.map((d) =>
        d.id === id ? { ...d, [field]: value } : d
      ),
    }));
  };
  const removeDevice = (id: string) => {
    setData((prev) => ({
      ...prev,
      devices: prev.devices.filter((d) => d.id !== id),
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-enter border border-white/10">
        <div className="px-6 md:px-8 py-6 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold font-moul text-slate-800 dark:text-white">
              បង្កើតទូថ្មី
            </h3>
            <button onClick={onClose}>
              <X size={20} className="text-slate-400" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  step >= i ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-800"
                }`}
              ></div>
            ))}
          </div>
        </div>
        <div className="p-6 md:p-8 min-h-[300px]">
          {step === 1 && (
            <div className="space-y-4 animate-enter">
              <h4 className="text-sm font-bold text-slate-500 uppercase font-khmer">
                អត្តសញ្ញាណកាប៊ីន (Cabin ID)
              </h4>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 font-khmer">
                  លេខសម្គាល់កាប៊ីន
                </label>
                <input
                  autoFocus
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold outline-none focus:border-indigo-500 transition-colors"
                  placeholder="e.g. R-01"
                  value={data.number}
                  onChange={(e) => setData({ ...data, number: e.target.value })}
                />
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4 animate-enter">
              <h4 className="text-sm font-bold text-slate-500 uppercase font-khmer">
                តំបន់ទីតាំង
              </h4>
              {isLocked ? (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/30 rounded-xl flex items-center gap-4">
                  <Lock size={20} className="text-indigo-400" />
                  <div>
                    <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300 font-khmer">
                      តំបន់ត្រូវបានកំណត់ (Zone Locked)
                    </p>
                    <p className="text-xs text-indigo-500/80">
                      Adding to {currentView === "RB" ? "Zone B" : "Zone A"}{" "}
                      automatically.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {["RB", "RA"].map((z) => (
                    <button
                      key={z}
                      onClick={() => setData({ ...data, section: z })}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        data.section === z
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                          : "border-slate-200 dark:border-slate-800 hover:border-indigo-300"
                      }`}
                    >
                      <span className="block text-lg font-black mb-1">
                        {z === "RB" ? "B" : "A"}
                      </span>
                      <span className="text-xs font-bold text-slate-400 font-khmer">
                        តុតំបន់ {z === "RB" ? "ឆ្វេង" : "ស្តាំ"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4 animate-enter">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-slate-500 uppercase font-khmer">
                  គ្រឿងបន្លាស់ (Hardware)
                </h4>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {DEVICE_TEMPLATES.map((t) => (
                  <button
                    key={t.label}
                    onClick={() => addDevice(t)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-transparent hover:border-indigo-200 text-xs font-bold transition-all whitespace-nowrap"
                  >
                    <Plus size={12} /> {t.label}
                  </button>
                ))}
              </div>
              <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                {data.devices.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <p className="text-xs text-slate-400 font-bold">
                      No devices added yet.
                    </p>
                  </div>
                ) : (
                  data.devices.map((device) => (
                    <div
                      key={device.id}
                      className="p-3 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <span
                            className={`p-1.5 rounded-md ${
                              device.type === DeviceType.MANAGE
                                ? "bg-indigo-100 text-indigo-600"
                                : device.type === DeviceType.ROUTER
                                ? "bg-orange-100 text-orange-600"
                                : "bg-emerald-100 text-emerald-600"
                            }`}
                          >
                            {device.type === DeviceType.MANAGE ? (
                              <Network size={14} />
                            ) : device.type === DeviceType.ROUTER ? (
                              <RouterIcon size={14} />
                            ) : (
                              <Wifi size={14} />
                            )}
                          </span>
                          <span className="text-[10px] font-bold uppercase text-slate-400">
                            {device.type}
                          </span>
                        </div>
                        <button
                          onClick={() => removeDevice(device.id)}
                          className="text-rose-400 hover:text-rose-500"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <input
                            className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5"
                            placeholder="Device Name"
                            value={device.name}
                            onChange={(e) =>
                              updateDevice(device.id, "name", e.target.value)
                            }
                          />
                        </div>
                        <select
                          className="text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5"
                          value={device.ports}
                          onChange={(e) =>
                            updateDevice(device.id, "ports", e.target.value)
                          }
                        >
                          {DEVICE_TEMPLATES.find(
                            (t) => t.type === device.type
                          )?.ports.map((p) => (
                            <option key={p} value={p}>
                              {p} Ports
                            </option>
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
          <button
            disabled={step === 1}
            onClick={() => setStep((s) => s - 1)}
            className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors font-khmer"
          >
            ត្រឡប់ក្រោយ (Back)
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="px-6 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all font-khmer"
            >
              ជំហានបន្ទាប់ (Next)
            </button>
          ) : (
            <button
              onClick={handleCreate}
              className="px-6 py-2 rounded-lg bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all font-khmer"
            >
              បង្កើត (Create)
            </button>
          )}
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
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    offline: 0,
    totalCabins: 0,
  });
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false); // New state for mobile search toggle

  // Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: "all",
    port: "",
    status: "all",
  });

  // Hover Info State
  const [hoverInfo, setHoverInfo] = useState<{
    x: number;
    y: number;
    pc: PC;
    tableName: string;
    cabinName: string;
  } | null>(null);

  // Modals
  const [modal, setModal] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>({});
  const mainRef = useRef<HTMLElement>(null);

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
            if (c.tables)
              Object.values(c.tables).forEach((t) => {
                if (t.pcs)
                  Object.values(t.pcs).forEach((p) => {
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

  // Scroll to Top Logic
  useEffect(() => {
    const handleScroll = () => {
      if (mainRef.current && mainRef.current.scrollTop > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    const ref = mainRef.current;
    if (ref) ref.addEventListener("scroll", handleScroll);
    return () => {
      if (ref) ref.removeEventListener("scroll", handleScroll);
    };
  }, [loading]);

  const scrollToTop = () => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNav = (v: string) => {
    setView(v);
    setSidebarOpen(false);
  };
  const toggleExp = (id: string) => {
    const s = new Set(expanded);
    s.has(id) ? s.delete(id) : s.add(id);
    setExpanded(s);
  };

  const createCabin = async (data: any) => {
    const tables: any = {};
    const zoneSuffix = data.section === "RA" ? "A" : "B";
    for (let i = 1; i <= 8; i++) {
      const pcs: any = {};
      for (let j = 1; j <= 6; j++) pcs[`pc${j}`] = { status: "offline" };
      tables[`table${i}`] = { name: `Row ${i}${zoneSuffix}`, pcs };
    }
    const payload: Cabin = {
      number: data.number,
      type: data.section,
      createdAt: Date.now(),
      devices: data.devices,
      tables,
    };
    try {
      await db.ref(`zones/${data.section}`).push(payload);
      addToast("បង្កើតកាប៊ីនបានជោគជ័យ (Created Successfully)");
      setModal(null);
    } catch {
      addToast("បរាជ័យ (Failed)", "error");
    }
  };

  const addTableToCabin = async (section: string, cabinId: string) => {
    setModalData({ section, cabinId });
    setModal("addTable");
  };

  const confirmAddTable = async (name: string) => {
    const { section, cabinId } = modalData;
    const newTableKey = `table${Date.now()}`;
    const pcs: any = {};
    for (let i = 1; i <= 6; i++) {
      pcs[`pc${i}`] = { status: "offline" };
    }
    const newTableData = { name: name, pcs: pcs };
    try {
      await db
        .ref(`zones/${section}/${cabinId}/tables/${newTableKey}`)
        .set(newTableData);
      addToast("បន្ថែមជួរថ្មីបានជោគជ័យ");
      setModal(null);
    } catch {
      addToast("បរាជ័យ", "error");
    }
  };

  const deleteTable = async (
    section: string,
    cabinId: string,
    tableId: string
  ) => {
    if (confirm("Are you sure you want to delete this table?")) {
      await db.ref(`zones/${section}/${cabinId}/tables/${tableId}`).remove();
      addToast("Table deleted successfully");
    }
  };

  const addPCToTable = async (
    section: string,
    cabinId: string,
    tableId: string
  ) => {
    const currentPCsRef = db.ref(
      `zones/${section}/${cabinId}/tables/${tableId}/pcs`
    );
    currentPCsRef.once("value", (snapshot) => {
      const pcs = snapshot.val() || {};
      const keys = Object.keys(pcs);
      let maxNum = 0;
      keys.forEach((k) => {
        const num = parseInt(k.replace("pc", ""));
        if (!isNaN(num) && num > maxNum) maxNum = num;
      });
      const newPcNum = maxNum + 1;
      const newPcKey = `pc${newPcNum}`;
      db.ref(`zones/${section}/${cabinId}/tables/${tableId}/pcs/${newPcKey}`)
        .set({
          status: "offline",
          sourceDeviceName: "",
          port: "",
        })
        .then(() => addToast(`PC${newPcNum} បន្ថែមបានជោគជ័យ`))
        .catch(() => addToast("បរាជ័យ", "error"));
    });
  };

  const updatePC = async (data: any) => {
    try {
      await db.ref(modalData.path).update(data);
      addToast("ធ្វើបច្ចុប្បន្នភាពបានជោគជ័យ");
      setModal(null);
    } catch {
      addToast("កំហុស (Error)", "error");
    }
  };

  const resetPC = async () => {
    try {
      await db
        .ref(modalData.path)
        .update({ status: "offline", sourceDeviceName: "", port: "" });
      addToast("កំណត់ឡើងវិញបានជោគជ័យ");
      setModal(null);
    } catch {
      addToast("កំហុស (Error)", "error");
    }
  };

  const deletePC = async () => {
    if (confirm("Delete this PC?")) {
      try {
        await db.ref(modalData.path).remove();
        addToast("PC deleted");
        setModal(null);
      } catch {
        addToast("Error", "error");
      }
    }
  };

  const updateTable = async (name: string) => {
    await db.ref(modalData.path).update({ name });
    setModal(null);
  };

  const updateCabinName = async (
    section: string,
    id: string,
    newName: string
  ) => {
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

  const handleHoverPC = (
    e: React.MouseEvent,
    pc: PC,
    tableName: string,
    cabinName: string
  ) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setHoverInfo({
      x: rect.left + rect.width / 2,
      y: rect.top,
      pc,
      tableName,
      cabinName,
    });
  };

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const qClean = search.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!qClean) return;

    let found: any = null;
    let foundPath = "";
    let foundCabinDevices: Device[] = [];

    (["RA", "RB"] as const).forEach((zone) => {
      if (found) return;
      const zoneData = zones[zone];
      if (!zoneData) return;
      Object.entries(zoneData).forEach(([cabinId, c]) => {
        if (found) return;
        const cabin = c as Cabin;
        if (!cabin.tables) return;
        Object.entries(cabin.tables).forEach(([tableId, t]) => {
          if (found) return;
          const table = t as Table;
          const tClean = table.name.toLowerCase().replace(/[^a-z0-9]/g, "");
          if (!table.pcs) return;
          Object.entries(table.pcs).forEach(([pcId, p]) => {
            if (found) return;
            const pc = p as PC;
            const fullId = tClean + pcId;
            if (fullId === qClean) {
              found = {
                ...pc,
                extraInfo: {
                  zone,
                  cabin: cabin.number,
                  table: table.name,
                  pcId,
                },
              };
              foundPath = `zones/${zone}/${cabinId}/tables/${tableId}/pcs/${pcId}`;
              foundCabinDevices = cabin.devices || [];
            }
          });
        });
      });
    });

    if (found) {
      setModalData({
        ...found,
        path: foundPath,
        cabinDevices: foundCabinDevices,
      });
      setModal("searchResult");
    } else {
      addToast("រកមិនឃើញទិន្នន័យ (Not Found)", "error");
    }
  };

  const getDeviceListByStatus = (status: "connected" | "offline") => {
    const list: any[] = [];
    ["RA", "RB"].forEach((zone) => {
      Object.entries(zones[zone as keyof Zones] || {}).forEach(
        ([cid, c]: any) => {
          Object.values(c.tables || {}).forEach((t: any) => {
            Object.entries(t.pcs || {}).forEach(([pid, p]: any) => {
              if (p.status === status) {
                list.push({
                  ...p,
                  extraInfo: {
                    zone,
                    cabin: c.number,
                    table: t.name,
                    pcId: pid,
                  },
                });
              }
            });
          });
        }
      );
    });
    return list;
  };

  const showStatsList = (status: "connected" | "offline") => {
    const list = getDeviceListByStatus(status);
    setModalData({
      list,
      title: status === "connected" ? "Online PCs" : "Offline PCs",
    });
    setModal("deviceList");
  };

  const renderList = (sec: "RA" | "RB") => {
    const list = Object.entries(zones[sec] || {}).filter(
      ([_, c]: [string, Cabin]) => {
        const q = search.toLowerCase();
        const qClean = q.replace(/[^a-z0-9]/g, "");
        const cabinMatch = c.number
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .includes(qClean);
        const deviceMatch =
          c.devices &&
          c.devices.some((d: Device) =>
            d.name
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "")
              .includes(qClean)
          );
        const hasMatchingPC = Object.values(c.tables || {}).some((t: any) => {
          const tableNameClean = t.name.toLowerCase().replace(/[^a-z0-9]/g, "");
          return Object.entries(t.pcs || {}).some(([pid, p]: any) => {
            const fullId = tableNameClean + pid;
            const pcTextMatch =
              fullId.includes(qClean) ||
              pid.includes(qClean) ||
              (p.sourceDeviceName &&
                p.sourceDeviceName
                  .toLowerCase()
                  .replace(/[^a-z0-9]/g, "")
                  .includes(qClean));
            const typeMatch =
              filters.type === "all" ||
              (p.sourceDeviceName &&
                c.devices.find((d: Device) => d.name === p.sourceDeviceName)
                  ?.type === filters.type);
            const portMatch = !filters.port || p.port === filters.port;
            const statusMatch =
              filters.status === "all" || p.status === filters.status;
            return (
              (!qClean || cabinMatch || deviceMatch || pcTextMatch) &&
              typeMatch &&
              portMatch &&
              statusMatch
            );
          });
        });
        return hasMatchingPC;
      }
    );

    if (list.length === 0)
      return (
        <div className="flex flex-col items-center justify-center p-12 opacity-50">
          <Box size={48} className="mb-2 text-slate-300 dark:text-slate-700" />
          <p className="font-bold text-xs text-slate-400 font-khmer">
            មិនមានទិន្នន័យ (No cabins found).
          </p>
        </div>
      );

    return list.map(([id, c]) => (
      <CabinCard
        key={id}
        id={id}
        cabin={c}
        section={sec}
        isExpanded={
          expanded.has(id) ||
          search.length > 0 ||
          filters.type !== "all" ||
          !!filters.port ||
          filters.status !== "all"
        }
        toggle={() => toggleExp(id)}
        onDelete={() => deleteCabin(sec, id)}
        searchQuery={search}
        filters={filters}
        onRename={(newName: string) => updateCabinName(sec, id, newName)}
        onEditTable={(p: string, n: string) => {
          setModalData({ path: p, name: n });
          setModal("editTable");
        }}
        onEditPC={(
          p: string,
          d: any,
          cn: string,
          tn: string,
          z: string,
          devices: Device[]
        ) => {
          setModalData({
            path: p,
            ...d,
            extraInfo: { cabin: cn, table: tn, zone: z },
            cabinDevices: devices,
          });
          setModal("editPC");
        }}
        onAddTable={addTableToCabin}
        onAddPC={addPCToTable}
        onDeleteTable={deleteTable}
        onHoverPC={handleHoverPC}
        onLeavePC={() => setHoverInfo(null)}
      />
    ));
  };

  // --- MODERN SIDEBAR COMPONENT ---
  const SidebarItem = ({ id, label, icon: Icon, onClick, active, hidden }: any) => {
    if(hidden) return null;
    return (
        <button
            onClick={() => onClick(id)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                active 
                ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/25 ring-1 ring-white/20" 
                : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
            }`}
        >
            <div className={`relative z-10 flex items-center gap-3`}>
                <Icon size={18} className={active ? "text-white" : "text-slate-400 group-hover:text-indigo-500 transition-colors"} />
                <span className={`font-bold text-sm tracking-wide font-khmer`}>{label}</span>
            </div>
            {active && (
                <div className="absolute right-0 top-0 h-full w-1 bg-white/20"></div>
            )}
        </button>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#020617] transition-colors duration-300 font-sans">
      {/* SIDEBAR - MODERN DESIGN */}
      <aside
        className={`fixed md:relative z-50 h-full w-72 glass-panel border-r border-slate-200/50 dark:border-white/5 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-28 flex flex-col justify-center px-6 border-b border-slate-200/50 dark:border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl  from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <img
                  src="https://i.postimg.cc/FHBn0Fdf/di3-copy.png"
                  alt="NetControl Logo"
                  className="w-10 h-10"
                />
              </div>
              <div>
                <h1 className="font-black text-lg tracking-tight text-slate-900 dark:text-white leading-tight">
                  Network Control
                </h1>
                
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-slate-600"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Sidebar Menu */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar sidebar-scroll">
          {/* Group 1 */}
          <div className="space-y-1">
            <h3 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Management
            </h3>
            <SidebarItem
              id="all"
              label="Overview"
              icon={PieChart}
              active={view === "all"}
              onClick={handleNav}
            />
            <SidebarItem
              id="infoNetwork"
              label="Network Info"
              icon={Info}
              active={view === "infoNetwork"}
              onClick={handleNav}
            />
            <SidebarItem
              id="report"
              label="Reports"
              icon={FileText}
              active={view === "report"}
              onClick={handleNav}
              hidden={
                window.innerWidth < 768 &&
                true /* logical hidden handled by styling in css, here handled by prop */
              }
            />
          </div>

          {/* Group 2 */}
          <div className="space-y-1">
            <h3 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Zones
            </h3>
            <SidebarItem
              id="RB"
              label="Zone B (Left)"
              icon={Server}
              active={view === "RB"}
              onClick={handleNav}
            />
            <SidebarItem
              id="RA"
              label="Zone A (Right)"
              icon={Layers}
              active={view === "RA"}
              onClick={handleNav}
            />
          </div>
        </div>

        {/* Sidebar Footer (User Profile) */}
        <div className="p-4 border-t border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/0 backdrop-blur-sm">
          <div className="glass-panel p-3 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-between group hover:border-indigo-500/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 p-0.5">
                <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                  <User size={18} className="text-emerald-500" />
                </div>
              </div>
              <div>
                <p className="text-xs font-black text-slate-800 dark:text-white">
                  IT Support
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className="text-[10px] font-bold text-slate-400">Online</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-indigo-500 transition-colors"
            >
              {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main
        ref={mainRef}
        className="flex-1 flex flex-col relative h-full overflow-hidden overflow-y-auto scroll-smooth"
      >
        <header className="flex flex-col border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-40 transition-all duration-300">
          <div className="h-16 md:h-20 flex items-center justify-between px-4 md:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden text-slate-500 dark:text-slate-300 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Menu size={24} />
              </button>
              <div>
                <h2 className="text-lg md:text-2xl font-black text-slate-800 dark:text-white tracking-tight font-moul">
                  {view === "all"
                    ? "ប្រព័ន្ធគ្រប់គ្រងទូទៅ"
                    : view === "infoNetwork"
                    ? "ព័ត៌មានបណ្តាញ "
                    : view === "report"
                    ? "របាយការណ៍"
                    : `ជួរតុតំបន់ ${view === "RB" ? "B" : "A"}`}
                </h2>
              </div>
            </div>
            {view !== "report" && view !== "infoNetwork" && (
              <div className="hidden md:flex items-center gap-3">
                <form
                  onSubmit={handleGlobalSearch}
                  className="relative group flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-2xl pr-1 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all border border-transparent focus-within:border-indigo-500/20"
                >
                  <Search
                    className="ml-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                    size={18}
                  />
                  <input
                    className="pl-3 pr-4 py-2.5 bg-transparent border-none outline-none font-bold text-xs text-slate-600 dark:text-slate-300 w-64 font-khmer placeholder-slate-400"
                    placeholder="ស្វែងរក (Ex: Row2Apc1)"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2 rounded-xl transition-all duration-200 ml-1 ${
                      showFilters
                        ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                        : "hover:bg-white dark:hover:bg-white/10 text-slate-500"
                    }`}
                  >
                    <Filter size={16} />
                  </button>
                </form>
                <button
                  onClick={() => setModal("addCabin")}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl shadow-lg shadow-indigo-500/30 text-xs font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2 font-khmer"
                >
                  <Plus size={16} /> បង្កើតទូថ្មី
                </button>
              </div>
            )}

            {/* MOBILE: Add & Find Buttons */}
            {view !== "report" && view !== "infoNetwork" && (
              <div className="flex md:hidden gap-2">
                <button
                  onClick={() => setShowMobileSearch(!showMobileSearch)}
                  className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center active:scale-95 transition-transform"
                >
                  <Search size={20} />
                </button>
                <button
                  onClick={() => setModal("addCabin")}
                  className="bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 active:scale-95 transition-transform"
                >
                  <Plus size={20} />
                </button>
              </div>
            )}
          </div>

          {/* Filter Bar */}
          {view !== "report" && view !== "infoNetwork" && (
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                showFilters ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="px-4 md:px-8 py-3 flex flex-wrap items-center gap-4 bg-slate-50/50 dark:bg-black/20 border-t border-slate-200/50 dark:border-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-khmer">
                    ស្ថានភាព:
                  </span>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value })
                    }
                    className="text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none focus:border-indigo-500 font-khmer"
                  >
                    <option value="all">ទាំងអស់</option>
                    <option value="connected">តភ្ជាប់</option>
                    <option value="offline">ដាច់</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-khmer">
                    ឧបករណ៍:
                  </span>
                  <select
                    value={filters.type}
                    onChange={(e) =>
                      setFilters({ ...filters, type: e.target.value })
                    }
                    className="text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none focus:border-indigo-500 font-khmer"
                  >
                    <option value="all">ទាំងអស់</option>
                    <option value="Manage">Manage Switch</option>
                    <option value="Router">Router</option>
                    <option value="POE">POE</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-khmer">
                    លេខច្រក:
                  </span>
                  <input
                    placeholder="#"
                    value={filters.port}
                    onChange={(e) =>
                      setFilters({ ...filters, port: e.target.value })
                    }
                    className="w-16 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none focus:border-indigo-500 text-center"
                  />
                </div>
                {(filters.type !== "all" ||
                  filters.port ||
                  filters.status !== "all") && (
                  <button
                    onClick={() =>
                      setFilters({ type: "all", port: "", status: "all" })
                    }
                    className="text-[10px] font-bold text-rose-500 hover:underline ml-auto font-khmer"
                  >
                    សម្អាត (Clear)
                  </button>
                )}
              </div>
            </div>
          )}
        </header>

        {/* MOBILE SEARCH EXTENSION */}
        {view !== "report" && view !== "infoNetwork" && showMobileSearch && (
          <div className="md:hidden px-4 py-3 bg-white/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-white/5 sticky top-16 z-30 backdrop-blur-md animate-enter">
            <form onSubmit={handleGlobalSearch} className="relative w-full">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                className="w-full pl-9 pr-8 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-[16px] md:text-xs font-bold outline-none border border-transparent focus:border-indigo-500 dark:text-white font-khmer"
                placeholder="ស្វែងរក..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 p-1 bg-slate-200 dark:bg-slate-700 rounded-full"
                >
                  <X size={12} />
                </button>
              )}
            </form>
          </div>
        )}

        <div className="flex-1 p-4 md:p-8 custom-scrollbar pb-32">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-64 rounded-2xl" />
            </div>
          ) : view === "infoNetwork" ? (
            <InfoNetworkView zones={zones} />
          ) : view === "report" ? (
            <ReportView zones={zones} />
          ) : (
            <>
              {view === "all" && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-6 md:mb-8">
                  <StatWidget
                    title="កាប៊ីនសរុប (Cabins)"
                    value={stats.totalCabins}
                    icon={Server}
                    color="violet"
                    delay="0"
                  />
                  <StatWidget
                    title="ឧបករណ៍សរុប (Devices)"
                    value={stats.total}
                    icon={Monitor}
                    color="indigo"
                    delay="100"
                  />
                  <StatWidget
                    title="កុំព្យូទ័រដំណើរការ (Online)"
                    value={stats.active}
                    icon={Wifi}
                    color="emerald"
                    delay="200"
                    onClick={() => showStatsList("connected")}
                  />
                  <StatWidget
                    title="កុំព្យូទ័រដាច់ (Offline)"
                    value={stats.offline}
                    icon={AlertTriangle}
                    color="rose"
                    delay="300"
                    onClick={() => showStatsList("offline")}
                  />
                </div>
              )}
              {view === "all" ? (
                <div className="grid xl:grid-cols-2 gap-8 animate-enter">
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <span className="w-3 h-3 rounded bg-indigo-500 shadow-lg shadow-indigo-500/50"></span>
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest font-khmer">
                        តុតំបន់ B
                      </h3>
                    </div>
                    {renderList("RB")}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <span className="w-3 h-3 rounded bg-purple-500 shadow-lg shadow-purple-500/50"></span>
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest font-khmer">
                        តុតំបន់ A
                      </h3>
                    </div>
                    {renderList("RA")}
                  </div>
                </div>
              ) : (
                <div className="max-w-5xl mx-auto animate-enter">
                  {renderList(view as "RA" | "RB")}
                </div>
              )}
            </>
          )}
        </div>

        <button
          onClick={scrollToTop}
          className={`fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[40] w-12 h-12 rounded-full bg-indigo-600 text-white shadow-xl flex items-center justify-center transition-all duration-300 hover:bg-indigo-700 hover:scale-110 active:scale-95 ${
            showScrollTop
              ? "translate-y-0 opacity-100"
              : "translate-y-20 opacity-0 pointer-events-none"
          }`}
        >
          <ArrowUp size={24} />
        </button>
      </main>

      {/* Floating Hover Tooltip */}
      {hoverInfo && (
        <div
          className="fixed z-[100] pointer-events-none transform -translate-x-1/2 -translate-y-[110%] animate-enter hidden md:block"
          style={{ left: hoverInfo.x, top: hoverInfo.y }}
        >
          <div className="bg-slate-900/90 backdrop-blur text-white px-3 py-2 rounded-lg shadow-xl border border-white/10 text-xs min-w-[140px]">
            <div className="font-bold mb-1 border-b border-white/10 pb-1 flex items-center justify-between font-khmer">
              <span>
                {hoverInfo.tableName} / PC{hoverInfo.pc.id}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  hoverInfo.pc.status === "connected"
                    ? "bg-emerald-500"
                    : "bg-rose-500"
                }`}
              ></span>
            </div>
            <div className="space-y-0.5 text-slate-300">
              <div className="flex justify-between">
                <span className="opacity-70 font-khmer">Uplink:</span>
                <span className="font-bold text-white">
                  {hoverInfo.pc.sourceDeviceName || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70 font-khmer">Port:</span>
                <span className="font-mono text-indigo-400">
                  {hoverInfo.pc.port || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70 font-khmer">Cabin:</span>
                <span className="font-bold font-khmer">
                  {hoverInfo.cabinName}
                </span>
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
      {modal === "addCabin" && (
        <AddCabinWizard
          onClose={() => setModal(null)}
          onCreate={createCabin}
          currentView={view}
        />
      )}
      {modal === "editPC" && (
        <PCDetailModal
          initialData={modalData}
          onClose={() => setModal(null)}
          onSave={updatePC}
          onDelete={resetPC}
          onRemove={deletePC}
        />
      )}
      {modal === "addTable" && (
        <AddTableModal
          onClose={() => setModal(null)}
          onConfirm={confirmAddTable}
        />
      )}
      {modal === "deviceList" && (
        <DeviceListModal
          title={modalData.title}
          devices={modalData.list}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "editTable" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl w-full max-w-sm animate-enter border border-white/10">
            <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white font-moul">
              ប្តូរឈ្មោះតុ (Rename)
            </h3>
            <input
              autoFocus
              className="w-full p-3 mb-4 border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 outline-none font-bold dark:text-white font-khmer"
              value={modalData.name}
              onChange={(e) =>
                setModalData({ ...modalData, name: e.target.value })
              }
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 font-khmer"
              >
                បោះបង់
              </button>
              <button
                onClick={() => updateTable(modalData.name)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-lg font-khmer"
              >
                រក្សាទុក
              </button>
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
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

const ToastProvider = ({ children }: any) => {
  const [toasts, setToasts] = useState<
    { id: number; msg: string; type: "success" | "error" }[]
  >([]);
  const addToast = (msg: string, type: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  };
  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border backdrop-blur-md animate-enter ${
              t.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
            } bg-white dark:bg-slate-800`}
          >
            {t.type === "success" ? (
              <CheckCircle size={16} />
            ) : (
              <XCircle size={16} />
            )}
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