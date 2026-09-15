import { useEffect, useState, type ReactNode } from "react";
import { Check, X, RotateCcw } from "lucide-react";
import { subscribeAllAccess, setAccessStatus, type AccessRecord } from "../lib/access";
import { useAuth } from "../lib/AuthContext";
import { SectionCard } from "../components/Cards";

function Row({ r, action }: { r: AccessRecord; action: ReactAction }) {
  return (
    <li className="flex items-center justify-between rounded border border-border px-3 py-2 text-sm">
      <div className="flex items-center gap-2">
        {r.photoURL && <img src={r.photoURL} alt="" className="h-7 w-7 rounded-full" />}
        <div>
          <div className="font-medium">{r.name || r.email}</div>
          <div className="text-xs text-ink-faint">{r.email}</div>
        </div>
      </div>
      <div className="flex gap-2">{action}</div>
    </li>
  );
}

type ReactAction = ReactNode;

export default function AdminAccess() {
  const { isAdmin } = useAuth();
  const [records, setRecords] = useState<AccessRecord[]>([]);

  useEffect(() => subscribeAllAccess(setRecords), []);

  if (!isAdmin) {
    return <p className="text-sm text-ink-faint">You don't have access to this page.</p>;
  }

  const pending = records.filter((r) => r.status === "pending");
  const approved = records.filter((r) => r.status === "approved");
  const rejected = records.filter((r) => r.status === "rejected");

  const btn = "flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-medium";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Access Control</h1>
        <p className="text-sm text-ink-faint">Approve or reject who can sign in to Restaurant On-Boarding System with their Google account.</p>
      </div>

      <SectionCard title={`Pending Requests (${pending.length})`}>
        {pending.length === 0 ? <p className="text-sm text-ink-faint">No pending requests.</p> : (
          <ul className="space-y-2">
            {pending.map((r) => (
              <Row key={r.uid} r={r} action={<>
                <button onClick={() => setAccessStatus(r.uid, "approved")} className={`${btn} bg-status-green text-white hover:opacity-90`}><Check size={13} /> Approve</button>
                <button onClick={() => setAccessStatus(r.uid, "rejected")} className={`${btn} bg-status-red text-white hover:opacity-90`}><X size={13} /> Reject</button>
              </>} />
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title={`Approved (${approved.length})`}>
        {approved.length === 0 ? <p className="text-sm text-ink-faint">No approved users yet.</p> : (
          <ul className="space-y-2">
            {approved.map((r) => (
              <Row key={r.uid} r={r} action={
                <button onClick={() => setAccessStatus(r.uid, "rejected")} className={`${btn} border border-border text-ink-soft hover:bg-paper`}><X size={13} /> Revoke</button>
              } />
            ))}
          </ul>
        )}
      </SectionCard>

      {rejected.length > 0 && (
        <SectionCard title={`Rejected (${rejected.length})`}>
          <ul className="space-y-2">
            {rejected.map((r) => (
              <Row key={r.uid} r={r} action={
                <button onClick={() => setAccessStatus(r.uid, "approved")} className={`${btn} border border-border text-ink-soft hover:bg-paper`}><RotateCcw size={13} /> Approve instead</button>
              } />
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}
