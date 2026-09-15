import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Newspaper, ExternalLink, Plus, X } from "lucide-react";
import { useRestaurants } from "../lib/useRestaurants";
import { buildRecommendations } from "../lib/agents";
import { subscribeNews, addNews, seedNewsIfEmpty, type NewsItem } from "../lib/news";
import { useAuth } from "../lib/AuthContext";
import { RiskPill } from "./Badges";

export default function NotificationPanel({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { restaurants } = useRestaurants();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [tab, setTab] = useState<"alerts" | "news">("alerts");
  const [showAddNews, setShowAddNews] = useState(false);
  const [form, setForm] = useState({ title: "", summary: "", sourceName: "", sourceUrl: "", publishedDate: "" });
  const [saving, setSaving] = useState(false);

  const recs = buildRecommendations(restaurants).filter((r) => r.riskLevel !== "Green");

  useEffect(() => {
    seedNewsIfEmpty();
    return subscribeNews(setNews);
  }, []);

  const submitNews = async () => {
    if (!form.title.trim() || !form.sourceUrl.trim()) return;
    setSaving(true);
    try {
      await addNews({ ...form, addedBy: user.email ?? "admin", publishedDate: form.publishedDate || new Date().toISOString().slice(0, 10) });
      setForm({ title: "", summary: "", sourceName: "", sourceUrl: "", publishedDate: "" });
      setShowAddNews(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute right-5 top-14 w-[420px] max-h-[80vh] overflow-y-auto rounded-md border border-border bg-surface shadow-pop" onClick={(e) => e.stopPropagation()}>
        <div className="flex border-b border-border">
          <button onClick={() => setTab("alerts")} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium ${tab === "alerts" ? "border-b-2 border-brand-500 text-brand-700" : "text-ink-faint"}`}>
            <AlertTriangle size={13} /> Alerts {recs.length > 0 && <span className="rounded-full bg-status-redBg px-1.5 text-status-red">{recs.length}</span>}
          </button>
          <button onClick={() => setTab("news")} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium ${tab === "news" ? "border-b-2 border-brand-500 text-brand-700" : "text-ink-faint"}`}>
            <Newspaper size={13} /> Industry News
          </button>
        </div>

        {tab === "alerts" && (
          <div className="divide-y divide-border">
            {recs.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-faint">No active alerts — everything's within SLA.</p>
            ) : recs.map((r) => (
              <button key={r.id} onClick={() => { navigate(`/restaurants/${r.restaurantId}`); onClose(); }} className="flex w-full items-start justify-between gap-2 px-4 py-3 text-left hover:bg-paper">
                <div>
                  <div className="text-sm font-medium">{r.title}</div>
                  <div className="mt-0.5 text-xs text-ink-faint">{r.reason}</div>
                </div>
                <RiskPill level={r.riskLevel} />
              </button>
            ))}
          </div>
        )}

        {tab === "news" && (
          <div>
            <div className="px-4 pt-3 text-[11px] text-ink-faint">Curated PRESMA / mamak-industry news, admin-added with sources — not a live auto-feed.</div>
            <div className="divide-y divide-border">
              {news.map((n) => (
                <div key={n.id} className="px-4 py-3">
                  <div className="text-sm font-medium">{n.title}</div>
                  <p className="mt-0.5 text-xs text-ink-soft">{n.summary}</p>
                  <a href={n.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 text-xs text-brand-600 hover:underline">
                    {n.sourceName} · {n.publishedDate} <ExternalLink size={11} />
                  </a>
                </div>
              ))}
            </div>
            {isAdmin && (
              <div className="border-t border-border p-3">
                {!showAddNews ? (
                  <button onClick={() => setShowAddNews(true)} className="flex w-full items-center justify-center gap-1.5 rounded border border-border py-1.5 text-xs font-medium text-ink-soft hover:bg-paper">
                    <Plus size={13} /> Add News Item
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">New item</span>
                      <button onClick={() => setShowAddNews(false)}><X size={14} className="text-ink-faint" /></button>
                    </div>
                    <input placeholder="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full rounded border border-border bg-surface px-2.5 py-1.5 text-xs outline-none focus:border-brand-500" />
                    <textarea placeholder="Summary" value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} className="w-full rounded border border-border bg-surface px-2.5 py-1.5 text-xs outline-none focus:border-brand-500" />
                    <div className="flex gap-2">
                      <input placeholder="Source name" value={form.sourceName} onChange={(e) => setForm((f) => ({ ...f, sourceName: e.target.value }))} className="w-1/2 rounded border border-border bg-surface px-2.5 py-1.5 text-xs outline-none focus:border-brand-500" />
                      <input type="date" value={form.publishedDate} onChange={(e) => setForm((f) => ({ ...f, publishedDate: e.target.value }))} className="w-1/2 rounded border border-border bg-surface px-2.5 py-1.5 text-xs outline-none focus:border-brand-500" />
                    </div>
                    <input placeholder="Source URL" value={form.sourceUrl} onChange={(e) => setForm((f) => ({ ...f, sourceUrl: e.target.value }))} className="w-full rounded border border-border bg-surface px-2.5 py-1.5 text-xs outline-none focus:border-brand-500" />
                    <button onClick={submitNews} disabled={saving} className="w-full rounded bg-brand-500 py-1.5 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-60">{saving ? "Saving…" : "Add"}</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
