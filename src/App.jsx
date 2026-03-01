import { useState, useEffect, useCallback, useMemo } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  not_applied: { label: "Not Applied", color: "#6b7280", bg: "rgba(107,114,128,0.12)", dot: "#6b7280" },
  planning:    { label: "Planning",    color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  dot: "#f59e0b" },
  applied:     { label: "Applied",     color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  dot: "#3b82f6" },
  interview:   { label: "Interview",   color: "#8b5cf6", bg: "rgba(139,92,246,0.12)",  dot: "#8b5cf6" },
  offer:       { label: "Offer",       color: "#10b981", bg: "rgba(16,185,129,0.12)",  dot: "#10b981" },
  rejected:    { label: "Rejected",    color: "#ef4444", bg: "rgba(239,68,68,0.12)",   dot: "#ef4444" },
};

const STATUSES = Object.keys(STATUS_CONFIG);
const LS_KEY = "job_tracker_v1";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const genId = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

function loadJobs() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
  catch { return []; }
}
function saveJobs(jobs) {
  localStorage.setItem(LS_KEY, JSON.stringify(jobs));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useJobs() {
  const [jobs, setJobs] = useState(loadJobs);
  const persist = useCallback((next) => { setJobs(next); saveJobs(next); }, []);
  const addJob    = (data) => persist([{ id: genId(), createdAt: now(), ...data }, ...jobs]);
  const updateJob = (id, data) => persist(jobs.map(j => j.id === id ? { ...j, ...data } : j));
  const deleteJob = (id) => persist(jobs.filter(j => j.id !== id));
  return { jobs, addJob, updateJob, deleteJob };
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status, size = "sm" }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}33`,
      borderRadius: 20, padding: size === "lg" ? "6px 14px" : "3px 10px",
      fontSize: size === "lg" ? 13 : 11, fontWeight: 600,
      fontFamily: "'DM Mono', monospace", letterSpacing: "0.02em", whiteSpace: "nowrap",
    }}>
      <span style={{ width: size === "lg" ? 8 : 6, height: size === "lg" ? 8 : 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

// ─── StatsBar ─────────────────────────────────────────────────────────────────

function StatsBar({ jobs }) {
  const counts = useMemo(() => {
    const c = {};
    STATUSES.forEach(s => c[s] = 0);
    jobs.forEach(j => c[j.status]++);
    return c;
  }, [jobs]);

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
      {STATUSES.map(s => (
        <div key={s} style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12, padding: "10px 16px", display: "flex", flexDirection: "column",
          alignItems: "center", gap: 2, minWidth: 78,
        }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: STATUS_CONFIG[s].color, fontFamily: "'DM Mono', monospace" }}>
            {counts[s]}
          </span>
          <span style={{ fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>
            {STATUS_CONFIG[s].label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── JobCard ──────────────────────────────────────────────────────────────────

function JobCard({ job, onEdit, onDelete }) {
  const [hover, setHover] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const cfg = STATUS_CONFIG[job.status];

  const handleDelete = (e) => {
    e.stopPropagation();
    if (confirmDelete) { onDelete(job.id); }
    else { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000); }
  };

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${hover ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)"}`,
        borderLeft: `3px solid ${cfg.dot}`,
        borderRadius: 14, padding: "18px 20px",
        transition: "all 0.2s",
        display: "flex", flexDirection: "column", gap: 10,
      }}>

      {/* Top */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3, fontFamily: "'DM Mono', monospace" }}>
            {job.company}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.3, fontFamily: "'Sora', sans-serif" }}>
            {job.title}
          </div>
        </div>
        <StatusBadge status={job.status} />
      </div>

      {/* Meta */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        {job.appliedDate && (
          <span style={{ fontSize: 12, color: "#64748b", fontFamily: "'DM Mono', monospace" }}>
            📅 {fmtDate(job.appliedDate)}
          </span>
        )}
        {job.link && (
          <a href={job.link} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ fontSize: 12, color: "#3b82f6", textDecoration: "none", fontFamily: "'DM Mono', monospace" }}>
            🔗 Job Link ↗
          </a>
        )}
      </div>

      {/* Notes */}
      {job.notes && (
        <div style={{
          fontSize: 13, color: "#94a3b8", lineHeight: 1.5, fontFamily: "'Sora', sans-serif",
          background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: "8px 12px",
          borderLeft: "2px solid rgba(255,255,255,0.07)",
        }}>
          {job.notes}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 4, justifyContent: "flex-end", marginTop: 2 }}>
        {[
          { icon: "✏️", title: "Edit", action: (e) => { e.stopPropagation(); onEdit(job); }, danger: false },
          { icon: confirmDelete ? "⚠️" : "🗑️", title: confirmDelete ? "Click again to confirm" : "Delete", action: handleDelete, danger: true },
        ].map(btn => (
          <button key={btn.title} onClick={btn.action} title={btn.title}
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              color: "#64748b", borderRadius: 8, padding: "6px 8px", fontSize: 14,
              transition: "all 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = btn.danger ? "#ef4444" : "#e2e8f0"}
            onMouseLeave={e => e.currentTarget.style.color = "#64748b"}>
            {btn.icon}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── JobModal ─────────────────────────────────────────────────────────────────

const EMPTY_FORM = { company: "", title: "", link: "", status: "not_applied", appliedDate: "", notes: "" };

function JobModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial ? {
    company: initial.company || "", title: initial.title || "", link: initial.link || "",
    status: initial.status || "not_applied", appliedDate: initial.appliedDate || "", notes: initial.notes || "",
  } : EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const isEdit = !!initial?.id;

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.company.trim()) e.company = "Required";
    if (!form.title.trim())   e.title   = "Required";
    return e;
  };

  const submit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave(form);
    onClose();
  };

  useEffect(() => {
    const h = (ev) => ev.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const inp = (err) => ({
    width: "100%", background: "rgba(255,255,255,0.06)",
    border: `1px solid ${err ? "#ef4444" : "rgba(255,255,255,0.12)"}`,
    borderRadius: 10, padding: "10px 14px", color: "#f1f5f9", fontSize: 14,
    fontFamily: "'Sora', sans-serif", outline: "none", boxSizing: "border-box", transition: "border 0.15s",
  });
  const lbl = { fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'DM Mono', monospace", display: "block", marginBottom: 6 };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20,
        padding: 28, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 25px 80px rgba(0,0,0,0.6)",
        animation: "modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#f1f5f9", fontFamily: "'Sora', sans-serif" }}>
            {isEdit ? "Edit Application" : "New Application"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={lbl}>Company Name *</label>
            <input style={inp(errors.company)} value={form.company} placeholder="e.g. Stripe"
              onChange={e => set("company", e.target.value)} />
            {errors.company && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 4, display: "block" }}>{errors.company}</span>}
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={lbl}>Job Title *</label>
            <input style={inp(errors.title)} value={form.title} placeholder="e.g. Senior Frontend Engineer"
              onChange={e => set("title", e.target.value)} />
            {errors.title && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 4, display: "block" }}>{errors.title}</span>}
          </div>
          <div>
            <label style={lbl}>Status</label>
            <select style={{ ...inp(false), cursor: "pointer" }} value={form.status} onChange={e => set("status", e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Application Date</label>
            <input type="date" style={inp(false)} value={form.appliedDate} onChange={e => set("appliedDate", e.target.value)} />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={lbl}>Job Link</label>
            <input style={inp(false)} value={form.link} placeholder="https://..." onChange={e => set("link", e.target.value)} />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={lbl}>Notes</label>
            <textarea style={{ ...inp(false), resize: "vertical", minHeight: 80 }} value={form.notes}
              placeholder="Recruiter contact, salary range, next steps..."
              onChange={e => set("notes", e.target.value)} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
          <button onClick={onClose} style={{
            background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10,
            color: "#94a3b8", padding: "10px 20px", cursor: "pointer", fontSize: 14, fontFamily: "'Sora', sans-serif", fontWeight: 600,
          }}>Cancel</button>
          <button onClick={submit} style={{
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", border: "none", borderRadius: 10,
            color: "#fff", padding: "10px 24px", cursor: "pointer", fontSize: 14, fontFamily: "'Sora', sans-serif", fontWeight: 700,
            boxShadow: "0 4px 20px rgba(59,130,246,0.35)",
          }}>
            {isEdit ? "Save Changes" : "Add Application"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const { jobs, addJob, updateJob, deleteJob } = useJobs();
  const [modal, setModal]           = useState(null);
  const [search, setSearch]         = useState("");
  const [filterStatus, setFilter]   = useState("all");
  const [sortBy, setSort]           = useState("newest");

  const filtered = useMemo(() => {
    let list = [...jobs];
    if (filterStatus !== "all") list = list.filter(j => j.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(j => j.company.toLowerCase().includes(q) || j.title.toLowerCase().includes(q));
    }
    list.sort((a, b) => sortBy === "company"
      ? a.company.localeCompare(b.company)
      : new Date(b.createdAt) - new Date(a.createdAt));
    return list;
  }, [jobs, filterStatus, search, sortBy]);

  const handleSave = (form) => {
    if (modal?.id) updateJob(modal.id, form);
    else addJob(form);
  };

  const ctrlBase = {
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, padding: "9px 14px", color: "#f1f5f9", fontSize: 14,
    fontFamily: "'Sora', sans-serif", outline: "none",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080d18; color: #f1f5f9; font-family: 'Sora', sans-serif; min-height: 100vh; }
        input::placeholder, textarea::placeholder { color: #475569; }
        select option { background: #1e293b; color: #f1f5f9; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1) opacity(0.4); cursor: pointer; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        @keyframes modalIn { from { opacity:0; transform:scale(0.92) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes cardIn  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .job-card { animation: cardIn 0.25s ease both; }
        input:focus, select:focus, textarea:focus { border-color: rgba(59,130,246,0.5) !important; }
        button:focus-visible { outline: 2px solid #3b82f6; outline-offset: 2px; }
      `}</style>

      <div style={{ position: "fixed", inset: 0, zIndex: -1, background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59,130,246,0.07), transparent)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px 80px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 28 }}>🎯</span>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "#f8fafc", fontFamily: "'Sora', sans-serif", letterSpacing: "-0.02em" }}>
                Job Tracker
              </h1>
            </div>
            <p style={{ color: "#475569", fontSize: 13, fontFamily: "'DM Mono', monospace" }}>
              {jobs.length} application{jobs.length !== 1 ? "s" : ""} tracked
            </p>
          </div>
          <button
            onClick={() => setModal("new")}
            style={{ background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)", border: "none", borderRadius: 12, color: "#fff", padding: "12px 22px", cursor: "pointer", fontSize: 14, fontFamily: "'Sora', sans-serif", fontWeight: 700, boxShadow: "0 4px 24px rgba(59,130,246,0.35)", display: "flex", alignItems: "center", gap: 8 }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 28px rgba(59,130,246,0.45)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 24px rgba(59,130,246,0.35)"; }}>
            <span style={{ fontSize: 18 }}>+</span> New Application
          </button>
        </div>

        {/* Stats */}
        <StatsBar jobs={jobs} />

        {/* Controls */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 200px" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#475569", fontSize: 14, pointerEvents: "none" }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search company or title…"
              style={{ ...ctrlBase, paddingLeft: 36, width: "100%" }} />
          </div>
          <select value={filterStatus} onChange={e => setFilter(e.target.value)} style={{ ...ctrlBase, cursor: "pointer", flex: "0 1 160px" }}>
            <option value="all">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSort(e.target.value)} style={{ ...ctrlBase, cursor: "pointer", flex: "0 1 140px" }}>
            <option value="newest">Newest First</option>
            <option value="company">By Company</option>
          </select>
        </div>

        {/* Filter feedback */}
        {(filterStatus !== "all" || search) && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "#64748b", fontFamily: "'DM Mono', monospace" }}>
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </span>
            {filterStatus !== "all" && <StatusBadge status={filterStatus} />}
            {search && <span style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "3px 10px", fontSize: 11, color: "#94a3b8", fontFamily: "'DM Mono', monospace" }}>"{search}"</span>}
            <button onClick={() => { setFilter("all"); setSearch(""); }}
              style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 11, textDecoration: "underline", fontFamily: "'DM Mono', monospace" }}>
              clear
            </button>
          </div>
        )}

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 20px", fontFamily: "'DM Mono', monospace" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: "#475569" }}>
              {jobs.length === 0 ? "No applications yet" : "No results found"}
            </div>
            <div style={{ fontSize: 13, color: "#334155" }}>
              {jobs.length === 0 ? 'Click "New Application" to get started.' : "Try adjusting your search or filters."}
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
            {filtered.map((job, i) => (
              <div key={job.id} className="job-card" style={{ animationDelay: `${i * 0.04}s` }}>
                <JobCard job={job} onEdit={setModal} onDelete={deleteJob} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <JobModal
          initial={modal === "new" ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
