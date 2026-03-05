import { useState, useEffect, useRef } from "react";
import { COUNTRIES } from "./countries.js";
import { roomRef, guestRef, set, update, onValue, get, generateRoomId } from "./firebase.js";

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const G = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800;900&family=Barlow+Condensed:wght@400;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { min-height: 100%; background: #fff; font-family: 'Barlow', sans-serif; color: #0d0d1a; -webkit-font-smoothing: antialiased; }
  .app { min-height: 100vh; display: flex; flex-direction: column; align-items: center; }

  /* HEADER */
  .hdr { width: 100%; display: flex; flex-direction: column; align-items: center; padding: 28px 0 10px; }
  .hdr-logo { font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 1.35rem; letter-spacing: 2px; text-transform: uppercase; }
  .hdr-logo span { color: #4f7fff; }
  .hdr-sub { font-size: 0.62rem; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; color: #aab; margin-top: 2px; }

  /* PAGE */
  .page { width: 100%; max-width: 520px; padding: 0 20px 100px; flex: 1; display: flex; flex-direction: column; }

  /* HOME */
  .home-hero { text-align: center; margin: 56px 0 44px; }
  .home-title { font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: clamp(2.6rem,8vw,3.8rem); line-height: 1; text-transform: uppercase; letter-spacing: -1px; }
  .home-ghost { color: #dde2f0; display: block; }
  .home-sub { font-size: 0.68rem; font-weight: 700; letter-spacing: 5px; text-transform: uppercase; color: #aab; margin-top: 14px; }
  .mode-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .mode-card { border: 1.5px solid #eef0f6; border-radius: 18px; padding: 26px 20px 22px; cursor: pointer; background: #fff; transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s; text-align: left; position: relative; }
  .mode-card:hover { border-color: #c8d0f0; box-shadow: 0 4px 24px rgba(79,127,255,0.09); transform: translateY(-2px); }
  .mode-icon { width: 54px; height: 54px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; font-size: 1.5rem; }
  .icon-dark { background: #0d0d1a; }
  .icon-blue { background: #4f7fff; }
  .mode-card h3 { font-weight: 700; font-size: 1.1rem; color: #0d0d1a; margin-bottom: 5px; }
  .mode-card p { font-size: 0.83rem; color: #7a8099; line-height: 1.4; }
  .social-badge { position: absolute; top: 12px; right: 12px; background: #eef2ff; color: #4f7fff; font-size: 0.6rem; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; padding: 3px 8px; border-radius: 20px; }
  .dots { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 36px; }
  .dot { width: 32px; height: 3px; border-radius: 2px; background: #e0e4f0; }
  .dot.on { background: #4f7fff; width: 10px; height: 10px; border-radius: 50%; }

  /* TOPNAV */
  .topnav { display: flex; align-items: center; justify-content: space-between; padding: 14px 0 22px; }
  .back { width: 36px; height: 36px; border-radius: 50%; border: 1.5px solid #eef0f6; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1rem; transition: border-color 0.2s; }
  .back:hover { border-color: #c8d0f0; }
  .room-pill { display: flex; align-items: center; gap: 6px; background: #0d0d1a; color: #fff; border-radius: 50px; padding: 6px 14px; font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 1rem; letter-spacing: 2px; cursor: pointer; user-select: none; }
  .pill-dot { width: 7px; height: 7px; border-radius: 50%; background: #4CAF50; animation: blink 1.5s ease-in-out infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

  /* FIELDS */
  .field { width: 100%; background: #f4f6fb; border: none; border-radius: 12px; padding: 17px 20px; margin-bottom: 10px; font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 1rem; letter-spacing: 2px; text-transform: uppercase; color: #0d0d1a; outline: none; transition: background 0.2s; }
  .field::placeholder { color: #b0b8cc; }
  .field:focus { background: #eceffe; }
  .field-plain { font-family: 'Barlow', sans-serif; font-weight: 500; letter-spacing: 0; text-transform: none; font-size: 1rem; text-align: center; }

  /* AUTOCOMPLETE */
  .ac { position: relative; width: 100%; }
  .ac-drop { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: #fff; border-radius: 12px; border: 1.5px solid #eef0f6; box-shadow: 0 8px 28px rgba(0,0,0,0.08); max-height: 200px; overflow-y: auto; z-index: 300; }
  .ac-opt { display: flex; align-items: center; gap: 10px; padding: 11px 16px; cursor: pointer; font-size: 0.93rem; font-weight: 500; transition: background 0.1s; }
  .ac-opt:hover, .ac-opt.hi { background: #f4f6fb; }

  /* BUTTONS */
  .btn { width: 100%; padding: 17px; border: none; border-radius: 12px; font-family: 'Barlow Condensed', sans-serif; font-weight: 800; font-size: 0.88rem; letter-spacing: 2.5px; text-transform: uppercase; cursor: pointer; transition: opacity 0.2s, transform 0.12s; }
  .btn:active { transform: scale(0.98); }
  .btn:disabled { opacity: 0.38; cursor: not-allowed; transform: none; }
  .btn-blue { background: #c5d2ff; color: #3355cc; }
  .btn-black { background: #0d0d1a; color: #fff; }
  .or { display: flex; align-items: center; gap: 12px; margin: 12px 0; color: #c0c5d8; font-size: 0.78rem; font-weight: 700; letter-spacing: 1px; }
  .or-line { flex: 1; height: 1px; background: #eef0f6; }

  /* RANDOMISER */
  .rand-center { display: flex; flex-direction: column; align-items: center; text-align: center; padding-top: 20px; }
  .big-flag { font-size: 6rem; display: block; margin-bottom: 6px; }
  .big-name { font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 3rem; text-transform: uppercase; letter-spacing: -1px; }
  .small-label { font-size: 0.68rem; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; color: #aab; margin-top: 4px; }
  .spin-row { display: flex; gap: 10px; font-size: 2.8rem; height: 54px; align-items: center; justify-content: center; margin: 10px 0; }
  .spin-row span { animation: bob 0.14s ease-in-out infinite alternate; }
  .spin-row span:nth-child(2) { animation-delay: 0.05s; }
  .spin-row span:nth-child(3) { animation-delay: 0.1s; }
  @keyframes bob { from{transform:translateY(-5px)} to{transform:translateY(5px)} }
  .btn-row { display: flex; gap: 10px; width: 100%; margin-top: 24px; }
  .btn-row .btn { flex: 1; }

  /* BOARDING PASS */
  .bp-center { display: flex; flex-direction: column; align-items: center; text-align: center; padding-top: 8px; width: 100%; }
  .bp-icon { width: 72px; height: 72px; background: #0d0d1a; border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin-bottom: 18px; }
  .bp-title { font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 2.4rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px; }
  .bp-sub { font-size: 0.68rem; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; color: #aab; margin-bottom: 28px; }

  /* LOUNGE */
  .banner { display: flex; align-items: flex-start; gap: 12px; background: #f4f6fb; border-radius: 12px; padding: 14px 16px; margin-bottom: 22px; }
  .banner-icon { font-size: 1.2rem; margin-top: 1px; }
  .banner-label { font-size: 0.65rem; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #4f7fff; margin-bottom: 3px; }
  .banner-text { font-size: 0.8rem; color: #7a8099; line-height: 1.4; }
  .lounge-title { font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 2.5rem; text-transform: uppercase; line-height: 1; letter-spacing: -0.5px; margin-bottom: 4px; }
  .lounge-sub { font-size: 0.66rem; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; color: #aab; margin-bottom: 20px; }
  .section-box { background: #f4f6fb; border-radius: 14px; padding: 16px; margin-bottom: 12px; }
  .section-label { font-size: 0.62rem; font-weight: 800; letter-spacing: 2.5px; text-transform: uppercase; color: #9aa; margin-bottom: 10px; }
  .guest-row { display: flex; align-items: center; padding: 11px 0; border-bottom: 1px solid #e8eaf2; }
  .guest-row:last-child { border-bottom: none; }
  .g-avatar { width: 34px; height: 34px; border-radius: 8px; background: linear-gradient(135deg,#4f7fff,#8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 1rem; margin-right: 12px; flex-shrink: 0; }
  .g-name { font-weight: 700; font-size: 0.93rem; }
  .g-role { font-size: 0.7rem; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; color: #aab; margin-top: 1px; }
  .g-check { margin-left: auto; color: #4CAF50; font-size: 1.2rem; }
  .g-wait  { margin-left: auto; color: #e0c040; font-size: 1rem; }

  /* STICKY BOTTOM */
  .sticky { position: fixed; bottom: 0; left: 0; right: 0; padding: 16px 20px 28px; background: linear-gradient(to top, #fff 65%, transparent); }
  .sticky-inner { max-width: 520px; margin: 0 auto; }

  /* REVEAL */
  .reveal-center { display: flex; flex-direction: column; align-items: center; text-align: center; padding-top: 16px; }
  .reveal-country { font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 3rem; text-transform: uppercase; letter-spacing: -1px; margin-bottom: 20px; }
  .result-row { display: flex; align-items: center; justify-content: space-between; padding: 13px 0; border-bottom: 1px solid #eef0f6; width: 100%; }
  .result-row:last-child { border-bottom: none; }
  .r-name { font-weight: 700; font-size: 0.93rem; }
  .r-guess { font-size: 0.8rem; color: #7a8099; margin-top: 1px; }
  .r-ok  { color: #2e7d32; font-weight: 800; font-size: 0.82rem; letter-spacing: 1px; }
  .r-no  { color: #c62828; font-weight: 800; font-size: 0.82rem; letter-spacing: 1px; }

  /* WAITING */
  .wait-page { display: flex; flex-direction: column; align-items: center; text-align: center; padding-top: 52px; gap: 12px; }
  .wait-icon { width: 72px; height: 72px; background: #f4f6fb; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; animation: float 2s ease-in-out infinite; }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  .wait-title { font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 2rem; text-transform: uppercase; }
  .wait-sub { font-size: 0.84rem; color: #7a8099; }
  .guess-badge { background: #f4f6fb; border-radius: 50px; padding: 8px 20px; font-weight: 700; font-size: 0.88rem; }
  .progress-wrap { width: 75%; background: #eef0f6; border-radius: 50px; height: 5px; overflow: hidden; }
  .progress-bar { height: 100%; background: #4f7fff; border-radius: 50px; transition: width 0.4s; }

  .err { color: #e05555; font-size: 0.83rem; font-weight: 600; margin: 4px 0 6px; text-align: center; }

  /* TOAST */
  .toast { position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%) translateY(8px); background: #0d0d1a; color: #fff; padding: 10px 22px; border-radius: 50px; font-weight: 700; font-size: 0.86rem; opacity: 0; transition: all 0.22s; pointer-events: none; z-index: 999; white-space: nowrap; }
  .toast.on { opacity: 1; transform: translateX(-50%) translateY(0); }

  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
  .fu { animation: fadeUp 0.32s ease both; }
  @keyframes popIn { from{opacity:0;transform:scale(0.82)} to{opacity:1;transform:scale(1)} }
  .pi { animation: popIn 0.38s cubic-bezier(0.175,0.885,0.32,1.275) both; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// TOAST HOOK
// ─────────────────────────────────────────────────────────────────────────────
function useToast() {
  const [msg, setMsg] = useState("");
  const [on, setOn] = useState(false);
  const t = useRef(null);
  function toast(m) { clearTimeout(t.current); setMsg(m); setOn(true); t.current = setTimeout(() => setOn(false), 2000); }
  return { msg, on, toast };
}

// ─────────────────────────────────────────────────────────────────────────────
// COUNTRY AUTOCOMPLETE
// ─────────────────────────────────────────────────────────────────────────────
function CountryField({ value, onChange, placeholder = "Search for a country…" }) {
  const [q, setQ] = useState(value?.name || "");
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState(0);
  const wrap = useRef(null);
  const filtered = q.length > 0
    ? COUNTRIES.filter(c => c.name.toLowerCase().startsWith(q.toLowerCase())).slice(0, 8)
    : [];

  useEffect(() => {
    const fn = e => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  function pick(c) { setQ(c.name); setOpen(false); onChange(c); }

  return (
    <div className="ac" ref={wrap}>
      <input
        className="field field-plain"
        value={q}
        placeholder={placeholder}
        onChange={e => { setQ(e.target.value); setOpen(true); setCur(0); onChange(null); }}
        onFocus={() => setOpen(true)}
        onKeyDown={e => {
          if (!open) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setCur(c => Math.min(c + 1, filtered.length - 1)); }
          if (e.key === "ArrowUp")   { e.preventDefault(); setCur(c => Math.max(c - 1, 0)); }
          if (e.key === "Enter" && filtered[cur]) pick(filtered[cur]);
          if (e.key === "Escape") setOpen(false);
        }}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="ac-drop">
          {filtered.map((c, i) => (
            <div key={c.name} className={`ac-opt${i === cur ? " hi" : ""}`} onMouseDown={() => pick(c)}>
              <span style={{ fontSize: "1.25rem" }}>{c.flag}</span>{c.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────────────────────────────────────
function Header() {
  return (
    <div className="hdr">
      <div className="hdr-logo">FOODIE<span>EXPEDITION</span></div>
      <div className="hdr-sub">Randomizer</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOME
// ─────────────────────────────────────────────────────────────────────────────
function HomeScreen({ onGo }) {
  return (
    <div className="page fu">
      <div className="home-hero">
        <div className="home-title">
          CHOOSE YOUR<br />
          <span className="home-ghost">EXPEDITION</span>
        </div>
        <div className="home-sub">Select an experience to begin</div>
      </div>
      <div className="mode-cards">
        <div className="mode-card" onClick={() => onGo("rand")}>
          <div className="mode-icon icon-dark">🎲</div>
          <h3>Randomizer</h3>
          <p>Instantly teleport to a random foodie hotspot in the world.</p>
        </div>
        <div className="mode-card" onClick={() => onGo("room")}>
          <div className="social-badge">SOCIAL</div>
          <div className="mode-icon icon-blue">👥</div>
          <h3>Expedition Room</h3>
          <p>Join forces with other explorers and guess the destination.</p>
        </div>
      </div>
      <div className="dots">
        <div className="dot" /><div className="dot on" /><div className="dot" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RANDOMISER
// ─────────────────────────────────────────────────────────────────────────────
function RandomiserScreen({ onBack }) {
  const [result, setResult] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [sf, setSf] = useState([]);
  const { msg, on, toast } = useToast();
  const spinTimer = useRef(null);

  function spin() {
    if (spinning) return;
    setSpinning(true); setResult(null); let n = 0;
    spinTimer.current = setInterval(() => {
      setSf([
        COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
        COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
        COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
      ]);
      if (++n > 22) {
        clearInterval(spinTimer.current);
        setResult(COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)]);
        setSpinning(false);
      }
    }, 80);
  }

  useEffect(() => { spin(); return () => clearInterval(spinTimer.current); }, []);

  return (
    <div className="page fu">
      <div className="topnav">
        <button className="back" onClick={onBack}>←</button>
      </div>
      <div className="rand-center">
        {spinning && (
          <div className="spin-row">
            {sf.map((c, i) => <span key={i}>{c?.flag}</span>)}
          </div>
        )}
        {!spinning && result && (
          <div className="pi" style={{ textAlign: "center", width: "100%" }}>
            <span className="big-flag">{result.flag}</span>
            <div className="big-name">{result.name}</div>
            <div className="small-label">Tonight's destination</div>
            <div className="btn-row">
              <button className="btn btn-blue" onClick={spin}>↩ Re-spin</button>
              <button className="btn btn-black" onClick={() => { navigator.clipboard?.writeText(result.name); toast("Copied!"); }}>Copy</button>
            </div>
          </div>
        )}
      </div>
      <div className={`toast${on ? " on" : ""}`}>{msg}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOARDING PASS — join or host
// ─────────────────────────────────────────────────────────────────────────────
function RoomEntryScreen({ onBack, onHost, onJoined }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [guess, setGuess] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestId] = useState(() => Math.random().toString(36).slice(2, 8));

  async function join() {
    if (!code.trim() || !name.trim()) { setErr("Enter room code and your name"); return; }
    if (!guess) { setErr("Enter your destination guess"); return; }
    setErr(""); setLoading(true);
    const id = code.trim().toUpperCase();
    try {
      const snap = await get(roomRef(id));
      if (!snap.exists()) { setErr("Room not found. Check the code!"); setLoading(false); return; }
      await set(guestRef(id, guestId), { name: name.trim(), guess: guess.name, flag: guess.flag });
      onJoined({ roomId: id, guestId, name: name.trim(), guess });
    } catch (e) { setErr(e.message); setLoading(false); }
  }

  return (
    <div className="page fu">
      <div className="topnav">
        <button className="back" onClick={onBack}>←</button>
      </div>
      <div className="bp-center">
        <div className="bp-icon">✈️</div>
        <div className="bp-title">Boarding Pass</div>
        <div className="bp-sub">Enter the expedition gateway</div>
        <input
          className="field"
          style={{ textAlign: "center", letterSpacing: 6 }}
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
          placeholder="ROOM CODE"
        />
        <input
          className="field field-plain"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name"
        />
        <CountryField value={guess} onChange={setGuess} placeholder="Your Destination Guess" />
        {err && <p className="err">{err}</p>}
        <button className="btn btn-blue" style={{ marginTop: 8 }} onClick={join} disabled={loading || !code || !name}>
          {loading ? "Connecting…" : "Connect to Flight"}
        </button>
        <div className="or"><span className="or-line" />or<span className="or-line" /></div>
        <button className="btn btn-black" onClick={onHost}>Host Private Expedition</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOST — Departure Lounge
// ─────────────────────────────────────────────────────────────────────────────
function HostLoungeScreen({ onBack }) {
  const [roomId] = useState(() => generateRoomId());
  const [country, setCountry] = useState(null);
  const [room, setRoom] = useState({ guests: {}, phase: "waiting" });
  const [phase, setPhase] = useState("waiting");
  const { msg, on, toast } = useToast();
  const unsub = useRef(null);

  useEffect(() => {
    set(roomRef(roomId), { phase: "waiting", guests: {}, country: "", flag: "" });
    unsub.current = onValue(roomRef(roomId), snap => {
      if (snap.exists()) setRoom(snap.val());
    });
    return () => { if (unsub.current) unsub.current(); };
  }, []);

  async function confirm() {
    if (!country) { toast("Set the secret destination first!"); return; }
    await update(roomRef(roomId), { country: country.name, flag: country.flag, phase: "revealed" });
    setPhase("revealed");
  }

  function copyCode() { navigator.clipboard?.writeText(roomId); toast("Code copied!"); }

  const guests = room?.guests ? Object.values(room.guests) : [];

  if (phase === "revealed") {
    return (
      <div className="page fu">
        <div className="topnav">
          <button className="back" onClick={onBack}>←</button>
          <div className="room-pill" onClick={copyCode}><span className="pill-dot" />{roomId}</div>
        </div>
        <div className="reveal-center pi">
          <span className="big-flag">{room.flag}</span>
          <div className="reveal-country">{room.country}</div>
          <div style={{ width: "100%" }}>
            {guests.map(g => {
              const ok = g.guess?.toLowerCase() === room.country?.toLowerCase();
              return (
                <div className="result-row" key={g.name}>
                  <div><div className="r-name">{g.name}</div><div className="r-guess">{g.flag} {g.guess}</div></div>
                  <span className={ok ? "r-ok" : "r-no"}>{ok ? "CORRECT ✓" : "WRONG ✗"}</span>
                </div>
              );
            })}
          </div>
          <button className="btn btn-black" style={{ marginTop: 32, width: "100%" }} onClick={onBack}>New Expedition</button>
        </div>
        <div className={`toast${on ? " on" : ""}`}>{msg}</div>
      </div>
    );
  }

  return (
    <div className="page fu" style={{ paddingBottom: 110 }}>
      <div className="topnav">
        <button className="back" onClick={onBack}>←</button>
        <div className="room-pill" onClick={copyCode}><span className="pill-dot" />{roomId}</div>
      </div>
      <div className="banner">
        <span className="banner-icon">🧪</span>
        <div>
          <div className="banner-label">Expedition Room Mode</div>
          <div className="banner-text">Share code <b>{roomId}</b> with guests — they join from their own devices.</div>
        </div>
      </div>
      <div className="lounge-title">The Departure<br />Lounge</div>
      <div className="lounge-sub">Waiting for all explorers to check in</div>
      <div className="section-box">
        <div className="section-label">Secret Destination</div>
        <CountryField value={country} onChange={setCountry} placeholder="Search for a country…" />
      </div>
      <div className="section-box">
        <div className="guest-row">
          <div className="g-avatar">🧭</div>
          <div><div className="g-name">The Guide (You)</div><div className="g-role">Room Host</div></div>
          <span className="g-check">✓</span>
        </div>
        {guests.map(g => (
          <div className="guest-row" key={g.name}>
            <div className="g-avatar">🧭</div>
            <div>
              <div className="g-name">{g.name}</div>
              <div className="g-role">{g.guess ? `${g.flag} ${g.guess}` : "Thinking…"}</div>
            </div>
            {g.guess ? <span className="g-check">✓</span> : <span className="g-wait">⏳</span>}
          </div>
        ))}
      </div>
      <div className="sticky">
        <div className="sticky-inner">
          <button className="btn btn-black" onClick={confirm} disabled={!country}>
            Confirm Arrival
          </button>
        </div>
      </div>
      <div className={`toast${on ? " on" : ""}`}>{msg}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GUEST — Waiting / Revealed
// ─────────────────────────────────────────────────────────────────────────────
function GuestWaitingScreen({ roomId, guestId, name, guess, onBack }) {
  const [room, setRoom] = useState(null);
  const unsub = useRef(null);

  useEffect(() => {
    unsub.current = onValue(roomRef(roomId), snap => {
      if (snap.exists()) setRoom(snap.val());
    });
    return () => { if (unsub.current) unsub.current(); };
  }, []);

  const guests = room?.guests ? Object.values(room.guests) : [];
  const guessedCount = guests.filter(g => g.guess).length;
  const revealed = room?.phase === "revealed";
  const correct = revealed && guess?.name?.toLowerCase() === room?.country?.toLowerCase();

  if (revealed && room) {
    return (
      <div className="page fu">
        <div className="topnav">
          <button className="back" onClick={onBack}>←</button>
          <div className="room-pill"><span className="pill-dot" />{roomId}</div>
        </div>
        <div className="reveal-center pi">
          <span className="big-flag">{room.flag}</span>
          <div className="reveal-country">{room.country}</div>
          <div style={{ padding: "9px 22px", borderRadius: 50, marginBottom: 20, background: correct ? "rgba(76,175,80,0.1)" : "rgba(224,85,85,0.09)", color: correct ? "#2e7d32" : "#c62828", fontWeight: 800, fontSize: "0.95rem" }}>
            {correct ? "🎉 You got it right!" : `😅 You guessed ${guess?.flag} ${guess?.name}`}
          </div>
          <div style={{ width: "100%" }}>
            {guests.map(g => {
              const ok = g.guess?.toLowerCase() === room.country?.toLowerCase();
              return (
                <div className="result-row" key={g.name}>
                  <div><div className="r-name">{g.name}</div><div className="r-guess">{g.flag} {g.guess}</div></div>
                  <span className={ok ? "r-ok" : "r-no"}>{ok ? "CORRECT ✓" : "WRONG ✗"}</span>
                </div>
              );
            })}
          </div>
          <button className="btn btn-black" style={{ marginTop: 32, width: "100%" }} onClick={onBack}>Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page fu">
      <div className="topnav">
        <button className="back" onClick={onBack}>←</button>
        <div className="room-pill"><span className="pill-dot" />{roomId}</div>
      </div>
      <div className="wait-page">
        <div className="wait-icon">✈️</div>
        <div className="wait-title">On the Runway</div>
        <div className="wait-sub">Waiting for the host to confirm arrival…</div>
        <div className="guess-badge">{guess?.flag} {guess?.name}</div>
        {guests.length > 0 && (
          <>
            <div className="wait-sub">{guessedCount} of {guests.length} explorers ready</div>
            <div className="progress-wrap">
              <div className="progress-bar" style={{ width: `${(guessedCount / guests.length) * 100}%` }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("home");
  const [guestCtx, setGuestCtx] = useState(null);

  return (
    <div className="app">
      <style>{G}</style>
      <Header />
      {screen === "home"  && <HomeScreen onGo={setScreen} />}
      {screen === "rand"  && <RandomiserScreen onBack={() => setScreen("home")} />}
      {screen === "room"  && (
        <RoomEntryScreen
          onBack={() => setScreen("home")}
          onHost={() => setScreen("host")}
          onJoined={ctx => { setGuestCtx(ctx); setScreen("guest"); }}
        />
      )}
      {screen === "host"  && <HostLoungeScreen onBack={() => setScreen("home")} />}
      {screen === "guest" && guestCtx && (
        <GuestWaitingScreen
          {...guestCtx}
          onBack={() => { setScreen("home"); setGuestCtx(null); }}
        />
      )}
    </div>
  );
}
