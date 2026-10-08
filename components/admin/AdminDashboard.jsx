"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase-browser.mjs";
const statuses = ["new", "contacted", "quoted", "won", "lost", "archived"];
const label = (value) =>
  value.replaceAll("_", " ").replace(/^./, (x) => x.toUpperCase());
const date = (value) =>
  new Date(value).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
export default function AdminDashboard({ activation = false }) {
  const [session, setSession] = useState(null),
    [ready, setReady] = useState(false),
    [member, setMember] = useState(null);
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState("");
  const [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const [rows, setRows] = useState([]),
    [counts, setCounts] = useState({}),
    [total, setTotal] = useState(0),
    [page, setPage] = useState(0),
    [filter, setFilter] = useState(""),
    [search, setSearch] = useState(""),
    [query, setQuery] = useState("");
  const [view, setView] = useState("enquiries"),
    [selected, setSelected] = useState(null),
    [status, setStatus] = useState("new"),
    [notes, setNotes] = useState(""),
    [members, setMembers] = useState([]),
    [events, setEvents] = useState([]),
    [invite, setInvite] = useState("");
  const [loading, setLoading] = useState(false);
  const generation = useRef(0);
  const identity = useRef(null);
  useEffect(() => {
    let disposed = false,
      subscription;
    async function start() {
      try {
        const auth = getSupabase().auth;
        ({
          data: { subscription },
        } = auth.onAuthStateChange((_event, next) => {
          if (!disposed) {
            setSession(next);
            if (identity.current !== (next?.user.id || null) || !next) {
              generation.current++;
              setMember(null);
              setRows([]);
              setCounts({});
              setMembers([]);
              setEvents([]);
              setSelected(null);
              setInvite("");
              setNotes("");
              setNotice("");
              setView("enquiries");
              setPage(0);
              setFilter("");
              setSearch("");
              setQuery("");
              setTotal(0);
            }
            identity.current = next?.user.id || null;
          }
        }));
        if (activation) {
          const params = new URLSearchParams(window.location.search);
          const token = params.get("token_hash"),
            type = params.get("type");
          if (token && ["invite", "recovery"].includes(type)) {
            window.history.replaceState({}, "", window.location.pathname);
            const { data, error } = await auth.verifyOtp({
              token_hash: token,
              type,
            });
            if (error) throw error;
            if (!disposed) setSession(data.session);
          }
        }
        const {
          data: { session },
        } = await auth.getSession();
        if (!disposed) setSession(session);
      } catch (e) {
        if (!disposed) setError(e.message);
      } finally {
        if (!disposed) setReady(true);
      }
    }
    start();
    return () => {
      disposed = true;
      subscription?.unsubscribe();
    };
  }, [activation]);
  const api = useCallback(async (operation, data) => {
    const {
      data: { session: current },
    } = await getSupabase().auth.getSession();
    if (!current) throw new Error("Please sign in again.");
    const response = await fetch(`/api/admin/${operation}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${current.access_token}`,
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (current.user.id !== identity.current)
      throw new Error("Your session changed. Please reload the workspace.");
    if (!response.ok) {
      if ([401, 403].includes(response.status)) {
        generation.current++;
        setMember(null);
        setSelected(null);
        setRows([]);
        setMembers([]);
        setEvents([]);
        setInvite("");
        setLoading(false);
        setError(result.error || "Admin access required.");
      }
      throw new Error(result.error || "Request failed");
    }
    return result;
  }, []);
  const load = useCallback(async () => {
    const request = ++generation.current;
    setLoading(true);
    setError("");
    try {
      const data = await api("dashboard", {
        action: "list",
        page,
        status: filter,
        search: query,
      });
      if (request !== generation.current) return;
      setMember(data.member);
      setRows(data.enquiries);
      setCounts(data.counts);
      setTotal(data.count);
      if (data.member.role !== "super_admin" && view !== "enquiries") {
        setView("enquiries");
        return;
      }
      if (view === "team") {
        const result = await api("users", { action: "list" });
        if (request === generation.current) setMembers(result.members);
      }
      if (view === "audit") {
        const result = await api("dashboard", { action: "audit" });
        if (request === generation.current) setEvents(result.events);
      }
    } catch (e) {
      if (request === generation.current) setError(e.message);
    } finally {
      if (request === generation.current) setLoading(false);
    }
  }, [api, page, filter, query, view]);
  useEffect(() => {
    if (session && !activation) load();
  }, [session, activation, load]);
  async function authAction(event, reset = false) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const auth = getSupabase().auth;
      if (reset) {
        const { error } = await auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/admin/activate`,
        });
        if (error) throw error;
        setNotice(
          "If this account exists, Supabase will email a password reset link.",
        );
      } else if (activation) {
        if (password.length < 12 || password !== confirm)
          throw new Error("Use at least 12 characters and matching passwords.");
        const { error } = await auth.updateUser({ password });
        if (error) throw error;
        window.location.replace("/admin");
      } else {
        const { error } = await auth.signInWithPassword({ email, password });
        if (error) throw error;
        setPassword("");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    setError("");
    const { error } = await getSupabase().auth.signOut();
    if (error) setError(error.message);
    else {
      generation.current++;
      setSession(null);
      setMember(null);
      setSelected(null);
      setRows([]);
      setMembers([]);
      setEvents([]);
      setInvite("");
    }
  }
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await api("dashboard", {
        action: "update",
        id: selected.id,
        version: selected.version,
        status,
        notes,
      });
      setSelected(result.enquiry);
      setNotice("Enquiry saved.");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function inviteAdmin(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setInvite("");
    try {
      const email = new FormData(event.currentTarget).get("email");
      const result = await api("users", { action: "invite", email });
      setInvite(
        `${window.location.origin}/admin/activate?type=invite&token_hash=${encodeURIComponent(result.tokenHash)}`,
      );
      event.target.reset();
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function changeAccess(row) {
    setBusy(true);
    setError("");
    try {
      await api("users", {
        action: "access",
        userId: row.user_id,
        active: !row.active,
      });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const alerts = (
    <>
      {error && (
        <p className="admin-alert error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="admin-alert" role="status">
          {notice}
        </p>
      )}
    </>
  );
  if (!ready)
    return (
      <main className="optitech-admin admin-login">
        <p role="status">Loading secure workspace…</p>
      </main>
    );
  if (!session || activation)
    return (
      <main className="optitech-admin admin-login">
        <a href="/" className="admin-brand">
          <img src="/assets/local/optitech-logo.svg" alt="" />
          Optitech<span>ADMIN</span>
        </a>
        <section className="admin-login-card">
          <p className="admin-eyebrow">Your workspace</p>
          <h1>{activation ? "Set your password" : "Welcome back."}</h1>
          <p>
            {activation
              ? "Activate your invited account with a password of at least 12 characters."
              : "Sign in with your Supabase Auth account to manage Optitech."}
          </p>
          {alerts}
          {activation && !session ? (
            <p>
              Your invitation is missing or expired. Request a new invitation
              from a super admin.
            </p>
          ) : (
            <form onSubmit={authAction}>
              {!activation && (
                <label>
                  Email address
                  <input
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
              )}
              <label>
                {activation ? "New password" : "Password"}
                <input
                  type="password"
                  autoComplete={
                    activation ? "new-password" : "current-password"
                  }
                  required
                  minLength={activation ? 12 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              {activation && (
                <label>
                  Confirm password
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={12}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </label>
              )}
              <button className="admin-primary" disabled={busy}>
                {busy
                  ? "Please wait…"
                  : activation
                    ? "Save password & open dashboard"
                    : "Sign in →"}
              </button>
              {!activation && (
                <button
                  className="admin-text-button"
                  type="button"
                  disabled={busy || !email}
                  onClick={(e) => authAction(e, true)}
                >
                  Forgot password?
                </button>
              )}
            </form>
          )}
          <a href="/">← Back to website</a>
        </section>
      </main>
    );
  return (
    <div className="optitech-admin admin-app">
      <aside className="admin-sidebar">
        <a href="/admin" className="admin-brand">
          <img src="/assets/local/optitech-logo.svg" alt="" />
          Optitech<span>ADMIN</span>
        </a>
        <nav aria-label="Admin navigation">
          <button
            aria-current={view === "enquiries" ? "page" : undefined}
            onClick={() => {
              setView("enquiries");
              setSelected(null);
              setInvite("");
            }}
          >
            ↗ Enquiries
          </button>
          {member?.role === "super_admin" && (
            <>
              <button
                aria-current={view === "team" ? "page" : undefined}
                onClick={() => {
                  setView("team");
                  setSelected(null);
                }}
              >
                ◎ Team access
              </button>
              <button
                aria-current={view === "audit" ? "page" : undefined}
                onClick={() => {
                  setView("audit");
                  setSelected(null);
                  setInvite("");
                }}
              >
                ≡ Activity log
              </button>
            </>
          )}
        </nav>
        <div className="admin-sidebar-bottom">
          <a href="/" target="_blank" rel="noreferrer">
            View website ↗
          </a>
          <button onClick={signOut}>Sign out</button>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <span>
            Optitech /{" "}
            {view === "team"
              ? "Team access"
              : view === "audit"
                ? "Activity log"
                : "Enquiries"}
          </span>
          <div>
            {member?.email || session.user.email}
            <span className="admin-role">
              {label(member?.role || "Checking access")}
            </span>
          </div>
        </header>
        {alerts}
        <div className="admin-heading">
          <div>
            <p className="admin-eyebrow">Business workspace</p>
            <h1>
              {view === "team"
                ? "Manage your team."
                : view === "audit"
                  ? "Activity log."
                  : "Let’s move things forward."}
            </h1>
            <p>
              {view === "team"
                ? "Invite staff and manage access to your workspace."
                : view === "audit"
                  ? "A record of changes made by your admin team."
                  : "Review enquiries and keep every conversation moving."}
            </p>
          </div>
          <button disabled={loading || busy} onClick={load}>
            ↻ Refresh
          </button>
        </div>
        {loading && <p role="status">Loading workspace…</p>}
        {member && (
          <>
            {view === "enquiries" && (
              <>
                <section
                  className="admin-stats"
                  aria-label="Enquiry statistics"
                >
                  {["new", "contacted", "quoted", "won"].map((item) => (
                    <button
                      key={item}
                      onClick={() => {
                        setFilter(item);
                        setPage(0);
                        setSelected(null);
                      }}
                    >
                      <span>{label(item)} enquiries</span>
                      <strong>{counts[item] || 0}</strong>
                      <span>View requests ↗</span>
                    </button>
                  ))}
                </section>
                {selected ? (
                  <section className="admin-detail">
                    <button
                      onClick={() => {
                        setSelected(null);
                        setNotice("");
                      }}
                    >
                      ← All enquiries
                    </button>
                    <div className="admin-detail-heading">
                      <div>
                        <p className="admin-eyebrow">
                          {selected.service.title}
                        </p>
                        <h2>{selected.name}</h2>
                        <p>
                          {selected.business || "Individual enquiry"} ·{" "}
                          {date(selected.created_at)}
                        </p>
                      </div>
                      <span className={`admin-status ${selected.status}`}>
                        {label(selected.status)}
                      </span>
                    </div>
                    <div className="admin-detail-grid">
                      <article>
                        <h3>Contact & request</h3>
                        <p>
                          <a href={`mailto:${selected.email}`}>
                            {selected.email}
                          </a>
                        </p>
                        {selected.phone && <p>{selected.phone}</p>}
                        <h3>Selected package</h3>
                        <p>
                          {selected.package?.name || "Help me choose / bespoke"}
                          {selected.package && (
                            <>
                              {" "}
                              · {selected.package.indicativePrice}
                              <br />
                              {selected.package.estimatedDelivery}
                            </>
                          )}
                        </p>
                        <h3>Requirements</h3>
                        <p className="admin-prewrap">{selected.requirements}</p>
                        <p className="admin-muted">
                          Consent received · Reference {selected.id}
                        </p>
                      </article>
                      <form onSubmit={save}>
                        <h3>Manage enquiry</h3>
                        <label>
                          Status
                          <select
                            aria-label="Status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                          >
                            {statuses.map((item) => (
                              <option key={item} value={item}>
                                {label(item)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Internal notes
                          <textarea
                            aria-label="Internal notes"
                            maxLength={10000}
                            rows={10}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add follow-up details, quote notes or next steps…"
                          />
                        </label>
                        <p className="admin-muted">
                          Internal notes are visible to your admin team.
                        </p>
                        <button className="admin-primary" disabled={busy}>
                          {busy ? "Saving…" : "Save changes"}
                        </button>
                      </form>
                    </div>
                  </section>
                ) : (
                  <section className="admin-panel">
                    <div className="admin-panel-heading">
                      <h2>
                        All enquiries <span>{total}</span>
                      </h2>
                      <form
                        className="admin-filters"
                        onSubmit={(e) => {
                          e.preventDefault();
                          setQuery(search);
                          setPage(0);
                        }}
                      >
                        <input
                          aria-label="Search enquiries"
                          placeholder="Search name, email or business"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                        <button>Search</button>
                        <select
                          aria-label="Filter by status"
                          value={filter}
                          onChange={(e) => {
                            setFilter(e.target.value);
                            setPage(0);
                          }}
                        >
                          <option value="">All statuses</option>
                          {statuses.map((item) => (
                            <option key={item} value={item}>
                              {label(item)}
                            </option>
                          ))}
                        </select>
                      </form>
                    </div>
                    <div className="admin-table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Client</th>
                            <th>Service / package</th>
                            <th>Status</th>
                            <th>Received</th>
                            <th>
                              <span className="admin-sr">Open enquiry</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row) => (
                            <tr key={row.id}>
                              <td>
                                <strong>{row.name}</strong>
                                <span>{row.email}</span>
                              </td>
                              <td>
                                {row.service.title}
                                <span>
                                  {row.package?.name || "Bespoke request"}
                                </span>
                              </td>
                              <td>
                                <span className={`admin-status ${row.status}`}>
                                  {label(row.status)}
                                </span>
                              </td>
                              <td>{date(row.created_at)}</td>
                              <td>
                                <button
                                  aria-label={`Open enquiry from ${row.name}`}
                                  onClick={() => {
                                    setSelected(row);
                                    setStatus(row.status);
                                    setNotes(row.internal_notes);
                                    setNotice("");
                                  }}
                                >
                                  Open ↗
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {!loading && !rows.length && (
                      <div className="admin-empty">
                        <span>↗</span>
                        <h3>
                          {query || filter
                            ? "No matching enquiries"
                            : "Your next opportunity starts here."}
                        </h3>
                        <p>
                          {query || filter
                            ? "Try another search or status."
                            : "New quote requests will appear here automatically."}
                        </p>
                      </div>
                    )}
                    <div className="admin-pagination">
                      <span>
                        {total
                          ? `${page * 20 + 1}–${Math.min((page + 1) * 20, total)} of ${total}`
                          : "0 enquiries"}
                      </span>
                      <div>
                        <button
                          disabled={page === 0 || loading}
                          onClick={() => setPage((x) => x - 1)}
                        >
                          Previous
                        </button>
                        <button
                          disabled={(page + 1) * 20 >= total || loading}
                          onClick={() => setPage((x) => x + 1)}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </section>
                )}
              </>
            )}
            {view === "team" && (
              <section className="admin-panel">
                <h2>Team access</h2>
                <form className="admin-invite-form" onSubmit={inviteAdmin}>
                  <label>
                    Staff email
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="name@company.com"
                    />
                  </label>
                  <button className="admin-primary" disabled={busy}>
                    Create staff invitation
                  </button>
                </form>
                {invite && (
                  <div className="admin-alert">
                    <p>
                      Share this one-time invitation privately with the invited
                      person. No email has been sent.
                    </p>
                    <input
                      aria-label="Invitation link"
                      readOnly
                      value={invite}
                      onFocus={(e) => e.target.select()}
                    />
                  </div>
                )}
                <div className="admin-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Account</th>
                        <th>Role</th>
                        <th>Access</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((row) => (
                        <tr key={row.user_id}>
                          <td>
                            {row.email}
                            <span>
                              {row.confirmed
                                ? "Verified account"
                                : "Awaiting activation"}
                            </span>
                          </td>
                          <td>{label(row.role)}</td>
                          <td>{row.active ? "Active" : "Disabled"}</td>
                          <td>
                            {row.role === "admin" ? (
                              <button
                                disabled={busy}
                                onClick={() => changeAccess(row)}
                              >
                                {row.active
                                  ? "Disable access"
                                  : "Enable access"}
                              </button>
                            ) : (
                              <span>Protected owner</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
            {view === "audit" && (
              <section className="admin-panel">
                <h2>Recent activity</h2>
                <p className="admin-muted">
                  Latest 100 events. Notes and customer messages are excluded
                  from this log.
                </p>
                <div className="admin-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Action</th>
                        <th>Reference</th>
                        <th>Actor</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((row) => (
                        <tr key={row.id}>
                          <td>{label(row.action.replaceAll(".", " "))}</td>
                          <td>{row.entity_id || "—"}</td>
                          <td>{row.actor_id || "System"}</td>
                          <td>{date(row.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!events.length && <p>No activity recorded yet.</p>}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
