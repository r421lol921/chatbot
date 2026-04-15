"use client";

import { useState } from "react";

const ADMIN_PASSPHRASE = "Peyton William Price";

export default function AdminPage() {
  const [name, setName] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [nameError, setNameError] = useState(false);

  const [email, setEmail] = useState("");
  const [type, setType] = useState<"plus" | "regular">("plus");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().toLowerCase() === ADMIN_PASSPHRASE.toLowerCase()) {
      setAuthorized(true);
      setNameError(false);
    } else {
      setNameError(true);
      setName("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/grant-plus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(`Done — ${data.user?.email} is now ${data.user?.userType}.`);
        setEmail("");
      } else {
        setStatus(`Error: ${data.error}`);
      }
    } catch {
      setStatus("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!authorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-xs rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-lg font-bold text-foreground mb-1">Admin Access</h1>
          <p className="text-[12px] text-muted-foreground mb-6">
            Enter your full name to continue.
          </p>
          <form onSubmit={handleNameSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              autoFocus
              autoComplete="off"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(false); }}
              placeholder="Full name"
              className={`h-9 rounded-lg border bg-background px-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-colors ${nameError ? "border-red-500" : "border-border"}`}
            />
            {nameError && (
              <p className="text-[11px] text-red-500 -mt-2">Incorrect name. Try again.</p>
            )}
            <button
              type="submit"
              className="h-9 rounded-lg bg-foreground text-background text-[13px] font-semibold hover:opacity-90 transition-opacity"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-lg font-bold text-foreground mb-1">Admin Panel</h1>
        <p className="text-[12px] text-muted-foreground mb-6">
          Assign or revoke Plus access for any user.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-foreground" htmlFor="email">
              User Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="h-9 rounded-lg border border-border bg-background px-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-foreground" htmlFor="type">
              Subscription Type
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as "plus" | "regular")}
              className="h-9 rounded-lg border border-border bg-background px-3 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            >
              <option value="plus">Plus</option>
              <option value="regular">Basic (revoke Plus)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-9 rounded-lg bg-foreground text-background text-[13px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update User"}
          </button>
        </form>

        {status && (
          <p className="mt-4 text-[12px] text-center text-muted-foreground rounded-lg border border-border/50 bg-muted/40 px-3 py-2">
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
