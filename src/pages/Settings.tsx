import { useState } from "react";
import { Sun, Moon, Monitor, Download, Trash2, ShieldCheck } from "lucide-react";
import { useTheme, type ThemeMode } from "../lib/ThemeContext";
import { useAuth } from "../lib/AuthContext";
import { exportRestaurantsCsv, deleteAllRestaurants } from "../lib/restaurants";
import { SectionCard } from "../components/Cards";

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
  { mode: "light", label: "Light", icon: Sun },
  { mode: "dark", label: "Dark", icon: Moon },
  { mode: "system", label: "System", icon: Monitor },
];

export default function Settings() {
  const { mode, setMode } = useTheme();
  const { isAdmin } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const csv = await exportRestaurantsCsv();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `presma-restaurants-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Delete ALL restaurant records? This cannot be undone.")) return;
    if (!confirm("Really sure? This will permanently wipe every restaurant in the CRM.")) return;
    setClearing(true);
    try {
      await deleteAllRestaurants();
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-5">
      <div><h1 className="text-xl font-semibold">Settings</h1><p className="text-sm text-ink-faint">Appearance, data, and access preferences.</p></div>

      <SectionCard title="Appearance">
        <div className="flex gap-2">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.mode}
              onClick={() => setMode(opt.mode)}
              className={`flex flex-1 flex-col items-center gap-1.5 rounded border px-4 py-3 text-sm font-medium ${mode === opt.mode ? "border-brand-500 bg-brand-50 text-brand-700" : "border-border text-ink-soft hover:bg-paper"}`}
            >
              <opt.icon size={18} /> {opt.label}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Data">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Export restaurants as CSV</div>
              <div className="text-xs text-ink-faint">Download every restaurant record for reporting or backup.</div>
            </div>
            <button onClick={handleExport} disabled={exporting} className="flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-paper disabled:opacity-60">
              <Download size={13} /> {exporting ? "Exporting…" : "Export CSV"}
            </button>
          </div>
        </div>
      </SectionCard>

      {isAdmin && (
        <SectionCard title="Danger Zone">
          <div className="flex items-center justify-between rounded border border-status-red/30 bg-status-redBg px-4 py-3">
            <div>
              <div className="text-sm font-medium text-status-red">Clear all restaurant data</div>
              <div className="text-xs text-status-red/80">Permanently deletes every restaurant record. Cannot be undone.</div>
            </div>
            <button onClick={handleClearAll} disabled={clearing} className="flex items-center gap-1.5 rounded bg-status-red px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60">
              <Trash2 size={13} /> {clearing ? "Clearing…" : "Clear All"}
            </button>
          </div>
        </SectionCard>
      )}

      <SectionCard title="Access">
        <div className="flex items-center gap-2 text-sm text-ink-soft">
          <ShieldCheck size={16} className="text-brand-500" />
          Sign-in is restricted to Google accounts approved by the administrator.
          {isAdmin && <a href="#/admin/access" className="ml-1 text-brand-600 hover:underline">Manage access →</a>}
        </div>
      </SectionCard>
    </div>
  );
}
