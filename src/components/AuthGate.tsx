import { useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { ClipboardCheck } from "lucide-react";
import { auth, googleProvider, ADMIN_EMAIL } from "../lib/firebase";
import { ensureAccessRequest, type AccessRecord } from "../lib/access";
import { AuthContext } from "../lib/AuthContext";

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-paper px-6 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded bg-brand-500 text-white"><ClipboardCheck size={20} /></div>
      {children}
    </div>
  );
}

export default function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = still loading
  const [access, setAccess] = useState<AccessRecord | null>(null);
  const [checking, setChecking] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (u) => { setUser(u); setSigningIn(false); }), []);

  useEffect(() => {
    if (!user) { setAccess(null); return; }
    setChecking(true);
    ensureAccessRequest(user)
      .then(setAccess)
      .catch((e) => setAuthError(e?.message ?? "Could not check access status."))
      .finally(() => setChecking(false));
  }, [user]);

  const handleSignIn = () => {
    if (signingIn) return; // ignore extra clicks while a popup is already in flight
    setAuthError(null);
    setSigningIn(true);
    signInWithPopup(auth, googleProvider)
      .catch((e) => {
        // A second click cancels the first popup — Firebase reports that as
        // an error even though the newer attempt is the one that matters.
        // Only surface genuine failures.
        if (e?.code === "auth/cancelled-popup-request" || e?.code === "auth/popup-closed-by-user") return;
        setAuthError(e?.message ?? "Sign-in failed.");
      })
      .finally(() => setSigningIn(false));
  };

  if (user === undefined) {
    return <Frame><p className="text-sm text-ink-faint">Loading…</p></Frame>;
  }

  if (!user) {
    return (
      <Frame>
        <h1 className="text-lg font-semibold text-ink">Restaurant On-Boarding System</h1>
        <p className="max-w-sm text-sm text-ink-faint">Sign in with your Google account to request access. An administrator will need to approve your account before you can enter.</p>
        {authError && <p className="max-w-sm text-xs text-status-red">{authError}</p>}
        <button
          onClick={handleSignIn}
          disabled={signingIn}
          className="mt-2 rounded bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {signingIn ? "Opening Google sign-in…" : "Sign in with Google"}
        </button>
      </Frame>
    );
  }

  if (checking || !access) {
    return (
      <Frame>
        <p className="text-sm text-ink-faint">Checking your access…</p>
        {authError && (
          <>
            <p className="max-w-sm text-xs text-status-red">{authError}</p>
            <button onClick={() => signOut(auth)} className="mt-1 text-sm text-ink-faint hover:underline">Sign out and try again</button>
          </>
        )}
      </Frame>
    );
  }

  if (access.status === "pending") {
    return (
      <Frame>
        <h1 className="text-lg font-semibold text-ink">Access requested</h1>
        <p className="max-w-sm text-sm text-ink-faint">Signed in as <span className="font-medium text-ink">{user.email}</span>. Your request has been sent to the administrator ({ADMIN_EMAIL}) — you'll be able to enter once approved.</p>
        <button onClick={() => signOut(auth)} className="mt-2 text-sm text-ink-faint hover:underline">Sign out</button>
      </Frame>
    );
  }

  if (access.status === "rejected") {
    return (
      <Frame>
        <h1 className="text-lg font-semibold text-ink">Access denied</h1>
        <p className="max-w-sm text-sm text-ink-faint">Your request to access Restaurant On-Boarding System was not approved. Contact the administrator if you believe this is a mistake.</p>
        <button onClick={() => signOut(auth)} className="mt-2 text-sm text-ink-faint hover:underline">Sign out</button>
      </Frame>
    );
  }

  const isAdmin = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  return <AuthContext.Provider value={{ user, isAdmin }}>{children}</AuthContext.Provider>;
}
