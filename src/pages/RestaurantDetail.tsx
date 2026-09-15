import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, Plus } from "lucide-react";
import { useRestaurants } from "../lib/useRestaurants";
import { updateRestaurant, updateStage, deleteRestaurant, addOutlet, updateOutlet, deleteOutlet } from "../lib/restaurants";
import { overallStatusFor, STAGE_NAMES, STAGE_SLA, type StageName, type Outlet } from "../types";
import { StatusBadge, RiskPill } from "../components/Badges";
import { SectionCard } from "../components/Cards";
import { useAuth } from "../lib/AuthContext";
import RestaurantForm from "../components/RestaurantForm";
import OutletForm from "../components/OutletForm";

export default function RestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { restaurants, loading } = useRestaurants();
  const [showEdit, setShowEdit] = useState(false);
  const [stageDraft, setStageDraft] = useState<StageName | null>(null);
  const [savingStage, setSavingStage] = useState(false);
  const [showAddOutlet, setShowAddOutlet] = useState(false);
  const [editOutlet, setEditOutlet] = useState<Outlet | null>(null);

  const r = restaurants.find((x) => x.id === id);

  if (loading) return <p className="py-16 text-center text-sm text-ink-faint">Loading…</p>;

  if (!r) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-ink-faint">Restaurant not found.</p>
        <Link to="/restaurants" className="mt-2 inline-block text-sm text-brand-600 hover:underline">Back to Restaurants</Link>
      </div>
    );
  }

  const daysInStage = Math.floor((Date.now() - r.stageChangedAt) / 86400000);
  const sla = STAGE_SLA[r.stage];
  const slaTone = daysInStage >= sla.escalateDay ? "text-status-red" : daysInStage >= sla.slaDays ? "text-status-amber" : "text-status-green";

  const handleStageSave = async () => {
    if (!stageDraft || stageDraft === r.stage) { setStageDraft(null); return; }
    setSavingStage(true);
    await updateStage(r, stageDraft, user.email ?? "unknown");
    setSavingStage(false);
    setStageDraft(null);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${r.name}? This can't be undone.`)) return;
    await deleteRestaurant(r.id);
    navigate("/restaurants");
  };

  const handleDeleteOutlet = async (outletId: string) => {
    if (!confirm("Remove this outlet?")) return;
    await deleteOutlet(r, outletId, user.email ?? "unknown");
  };

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs font-medium text-ink-faint hover:text-ink"><ArrowLeft size={14} /> Back</button>

      <div className="rounded border border-border bg-surface p-5 shadow-card">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">{r.name}</h1>
              <StatusBadge status={overallStatusFor(r.stage)} />
              <RiskPill level={r.riskLevel} />
              {r.approvalStatus !== "approved" && (
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${r.approvalStatus === "pending" ? "bg-status-amberBg text-status-amber" : r.approvalStatus === "needs_edit" ? "bg-status-amberBg text-status-amber" : "bg-status-redBg text-status-red"}`}>
                  {r.approvalStatus === "pending" ? "Pending approval" : r.approvalStatus === "needs_edit" ? "Needs edit" : "Rejected"}
                </span>
              )}
            </div>
            <div className="mt-1 text-xs text-ink-faint">{r.id} · added by {r.createdBy}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowEdit(true)} className="flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-paper"><Pencil size={13} /> Edit</button>
            {isAdmin && <button onClick={handleDelete} className="flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-xs font-medium text-status-red hover:bg-status-redBg"><Trash2 size={13} /> Delete</button>}
          </div>
        </div>

        {r.approvalStatus === "needs_edit" && r.approvalNote && (
          <div className="mt-3 rounded bg-status-amberBg px-3 py-2 text-xs text-status-amber">Admin requested edits: {r.approvalNote}</div>
        )}
        {r.approvalStatus === "rejected" && r.approvalNote && (
          <div className="mt-3 rounded bg-status-redBg px-3 py-2 text-xs text-status-red">Rejected: {r.approvalNote}</div>
        )}

        <div className="mt-4 grid grid-cols-4 gap-4 border-t border-border pt-4 text-sm">
          <div><div className="text-xs text-ink-faint">Owner</div><div className="font-medium">{r.ownerName}</div></div>
          <div><div className="text-xs text-ink-faint">Outlets</div><div className="font-medium">{r.outlets.length || "—"}</div></div>
          <div><div className="text-xs text-ink-faint">Days in current stage</div><div className={`font-medium ${slaTone}`}>{daysInStage}d <span className="text-ink-faint">/ SLA {sla.slaDays}d</span></div></div>
          <div><div className="text-xs text-ink-faint">Last Updated</div><div className="font-medium">{new Date(r.updatedAt).toLocaleString()}</div></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SectionCard title="Profile">
          <dl className="space-y-2 text-sm">
            <Row k="Phone" v={r.ownerPhone || "—"} /><Row k="Email" v={r.ownerEmail || "—"} />
            <Row k="Business Type" v={r.businessType} /><Row k="Registration No." v={r.registrationNo || "—"} />
            <Row k="Created" v={new Date(r.createdAt).toLocaleDateString()} />
            <Row k="Assigned BD" v={r.assignedBD || "—"} /><Row k="Assigned Ops" v={r.assignedOps || "—"} /><Row k="Assigned Tech" v={r.assignedTech || "—"} />
          </dl>
        </SectionCard>

        <SectionCard title="Update Stage / Status">
          <select
            className="w-full rounded border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-brand-500"
            value={stageDraft ?? r.stage}
            onChange={(e) => setStageDraft(e.target.value as StageName)}
          >
            {STAGE_NAMES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <p className="mt-2 text-xs text-ink-faint">Maps to status: <span className="font-medium text-ink">{overallStatusFor(stageDraft ?? r.stage)}</span></p>
          <button
            onClick={handleStageSave}
            disabled={savingStage || !stageDraft || stageDraft === r.stage}
            className="mt-3 w-full rounded bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {savingStage ? "Saving…" : "Update Stage"}
          </button>
          {!isAdmin && <p className="mt-2 text-xs text-ink-faint">Your change will be sent to the admin for approval.</p>}
        </SectionCard>
      </div>

      <SectionCard
        title={`Outlets (${r.outlets.length})`}
        action={<button onClick={() => setShowAddOutlet(true)} className="flex items-center gap-1.5 rounded bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600"><Plus size={13} /> Add Outlet</button>}
      >
        {r.outlets.length === 0 ? (
          <p className="text-sm text-ink-faint">No outlets added yet. Every restaurant/owner may run multiple outlets — add each as its own profile.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wide text-ink-faint">
                <th className="py-2 font-medium">Outlet ID</th><th className="py-2 font-medium">Location</th>
                <th className="py-2 font-medium">Contact Person</th><th className="py-2 font-medium">Phone</th>
                <th className="py-2 font-medium">Status</th><th className="py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {r.outlets.map((o) => (
                <tr key={o.id} className="border-b border-border last:border-0">
                  <td className="py-2 font-mono text-xs text-ink-faint">{o.id}</td>
                  <td className="py-2 font-medium">{o.location}</td>
                  <td className="py-2 text-ink-soft">{o.contactPerson || "—"}</td>
                  <td className="py-2 text-ink-soft">{o.phone || "—"}</td>
                  <td className="py-2">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${o.status === "Active" ? "bg-status-greenBg text-status-green" : "bg-status-greyBg text-status-grey"}`}>{o.status}</span>
                  </td>
                  <td className="py-2">
                    <div className="flex justify-end gap-2 text-ink-faint">
                      <button onClick={() => setEditOutlet(o)} className="hover:text-ink"><Pencil size={14} /></button>
                      <button onClick={() => handleDeleteOutlet(o.id)} className="hover:text-status-red"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>

      {r.notes && (
        <SectionCard title="Notes"><p className="whitespace-pre-wrap text-sm text-ink-soft">{r.notes}</p></SectionCard>
      )}

      <SectionCard title="Activity Log">
        <ol className="space-y-3 border-l border-border pl-4">
          {[...r.activity].reverse().map((e, i) => (
            <li key={i} className="relative text-sm">
              <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-brand-500" />
              <div className="text-xs text-ink-faint">{new Date(e.date).toLocaleString()} · {e.actor}</div>
              <div>{e.event}</div>
            </li>
          ))}
        </ol>
      </SectionCard>

      {showEdit && (
        <RestaurantForm
          initial={r}
          onClose={() => setShowEdit(false)}
          onSubmit={async (data) => { await updateRestaurant(r, data, user.email ?? "unknown"); }}
        />
      )}

      {showAddOutlet && (
        <OutletForm
          onClose={() => setShowAddOutlet(false)}
          onSubmit={async (data) => { await addOutlet(r, data, user.email ?? "unknown"); }}
        />
      )}

      {editOutlet && (
        <OutletForm
          initial={editOutlet}
          onClose={() => setEditOutlet(null)}
          onSubmit={async (data) => { await updateOutlet(r, editOutlet.id, data, user.email ?? "unknown"); }}
        />
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-4"><dt className="text-ink-faint">{k}</dt><dd className="text-right font-medium">{v}</dd></div>;
}
