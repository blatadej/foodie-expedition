import { useState, useEffect, useRef } from "react";
import { COUNTRIES } from "./countries.js";
import { roomRef, guestRef, set, update, onValue, get, generateRoomId } from "./firebase.js";

// ─────────────────────────────────────────────────────────────────────────────
// DETECT ROOM CODE FROM URL  e.g. ?join=ABCD
// ─────────────────────────────────────────────────────────────────────────────
function getRoomCodeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("join")?.toUpperCase() || null;
}

function setRoomInUrl(code) {
  const url = new URL(window.location.href);
  url.searchParams.set("join", code);
  window.history.pushState({}, "", url);
}

function clearRoomFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("join");
  window.history.pushState({}, "", url);
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const G = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html, body, #root {
    min-height: 100%;
    background: #FFFDF7;
    font-family: "Futura", "Century Gothic", "Trebuchet MS", sans-serif;
    color: #1a1a2e;
    -webkit-font-smoothing: antialiased;
  }

  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #FFFDF7;
  }

  /* ── HEADER ── */
  .hdr {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px 0 8px;
  }
  .hdr-logo {
    font-size: 1.1rem;
    font-weight: 500;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #1a1a2e;
  }
  .hdr-logo span { color: #e8624a; }
  .hdr-sub {
    font-size: 0.58rem;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: #bbb;
    margin-top: 3px;
  }

  /* ── PAGE ── */
  .page {
    width: 100%;
    max-width: 480px;
    padding: 0 20px 120px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  /* ── HOME ── */
  .home-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 32px;
    text-align: center;
  }
  .home-emoji {
    font-size: 3.5rem;
    margin-bottom: 20px;
    animation: float 3s ease-in-out infinite;
  }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }

  .home-title {
    font-size: clamp(1.8rem, 6vw, 2.4rem);
    font-weight: 500;
    letter-spacing: 1px;
    text-transform: uppercase;
    line-height: 1.1;
    margin-bottom: 10px;
  }
  .home-title span { color: #e8624a; }
  .home-desc {
    font-size: 0.9rem;
    color: #7a7a8a;
    line-height: 1.6;
    max-width: 320px;
    margin-bottom: 40px;
    letter-spacing: 0.3px;
  }

  .home-btns {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }

  .home-btn {
    width: 100%;
    padding: 20px 24px;
    border-radius: 16px;
    border: none;
    cursor: pointer;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 16px;
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .home-btn:active { transform: scale(0.98); }
  .home-btn-icon {
    width: 48px; height: 48px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.4rem;
    flex-shrink: 0;
  }
  .home-btn-text { flex: 1; }
  .home-btn-title {
    font-size: 1rem;
    font-weight: 500;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 3px;
  }
  .home-btn-sub {
    font-size: 0.78rem;
    opacity: 0.7;
    letter-spacing: 0.3px;
  }
  .home-btn-arrow { font-size: 1.2rem; opacity: 0.4; }

  .btn-host {
    background: #1a1a2e;
    color: #fff;
    box-shadow: 0 4px 20px rgba(26,26,46,0.2);
  }
  .btn-host .home-btn-icon { background: rgba(255,255,255,0.12); }

  .btn-rand {
    background: #fff;
    color: #1a1a2e;
    border: 1.5px solid #eee;
    box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  }
  .btn-rand .home-btn-icon { background: #fff5f3; }

  /* ── TOPNAV ── */
  .topnav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 0 20px;
  }
  .back {
    width: 38px; height: 38px; border-radius: 50%;
    border: 1.5px solid #e8e8e8; background: #fff;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    font-size: 1rem; color: #1a1a2e;
    transition: border-color 0.2s;
  }
  .back:hover { border-color: #ccc; }
  .room-pill {
    display: flex; align-items: center; gap: 7px;
    background: #1a1a2e; color: #fff;
    border-radius: 50px; padding: 7px 16px;
    font-size: 0.9rem; letter-spacing: 3px;
    cursor: pointer; user-select: none;
    font-weight: 500;
  }
  .pill-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #4CAF50;
    animation: blink 1.5s ease-in-out infinite;
  }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

  /* ── STEP INDICATOR ── */
  .steps {
    display: flex; align-items: center; justify-content: center;
    gap: 6px; margin-bottom: 28px;
  }
  .step-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #e0e0e0; transition: all 0.3s;
  }
  .step-dot.on { background: #e8624a; width: 24px; border-radius: 4px; }
  .step-dot.done { background: #4CAF50; }

  /* ── SECTION TITLE ── */
  .sec-title {
    font-size: 1.6rem;
    font-weight: 500;
    letter-spacing: 1px;
    text-transform: uppercase;
    line-height: 1.1;
    margin-bottom: 6px;
  }
  .sec-sub {
    font-size: 0.75rem;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #bbb;
    margin-bottom: 24px;
  }

  /* ── CARDS ── */
  .card {
    background: #fff;
    border-radius: 16px;
    border: 1.5px solid #f0f0f0;
    padding: 20px;
    margin-bottom: 12px;
  }
  .card-label {
    font-size: 0.6rem;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #bbb;
    margin-bottom: 10px;
  }

  /* ── FIELDS ── */
  .field {
    width: 100%;
    background: #f7f7f7;
    border: 1.5px solid transparent;
    border-radius: 12px;
    padding: 15px 18px;
    margin-bottom: 10px;
    font-family: "Futura", "Century Gothic", "Trebuchet MS", sans-serif;
    font-size: 0.95rem;
    letter-spacing: 1px;
    color: #1a1a2e;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
  }
  .field::placeholder { color: #c0c0c0; }
  .field:focus { border-color: #e8624a; background: #fff; }
  .field-code {
    text-align: center;
    font-size: 1.8rem;
    letter-spacing: 8px;
    text-transform: uppercase;
    padding: 18px;
  }

  /* ── AUTOCOMPLETE ── */
  .ac { position: relative; width: 100%; }
  .ac-drop {
    position: absolute; top: calc(100% + 4px); left: 0; right: 0;
    background: #fff; border-radius: 12px;
    border: 1.5px solid #f0f0f0;
    box-shadow: 0 8px 28px rgba(0,0,0,0.08);
    max-height: 200px; overflow-y: auto; z-index: 300;
  }
  .ac-opt {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px; cursor: pointer;
    font-size: 0.9rem; letter-spacing: 0.5px;
    transition: background 0.1s;
    border-bottom: 1px solid #f7f7f7;
  }
  .ac-opt:last-child { border-bottom: none; }
  .ac-opt:hover, .ac-opt.hi { background: #fff5f3; }

  /* ── BUTTONS ── */
  .btn {
    width: 100%; padding: 17px;
    border: none; border-radius: 14px;
    font-family: "Futura", "Century Gothic", "Trebuchet MS", sans-serif;
    font-size: 0.82rem; font-weight: 500;
    letter-spacing: 2.5px; text-transform: uppercase;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.12s;
  }
  .btn:active { transform: scale(0.98); }
  .btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
  .btn-primary { background: #e8624a; color: #fff; }
  .btn-dark    { background: #1a1a2e; color: #fff; }
  .btn-ghost   { background: #f0f0f0; color: #1a1a2e; }
  .btn-share   { background: #25D366; color: #fff; }

  /* ── SHARE BOX ── */
  .share-box {
    background: #f7f7f7;
    border-radius: 14px;
    padding: 16px 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .share-box:hover { background: #f0f0f0; }
  .share-url {
    font-size: 0.78rem;
    color: #7a7a8a;
    letter-spacing: 0.5px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .share-copy {
    font-size: 0.7rem;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #e8624a;
    font-weight: 500;
    flex-shrink: 0;
  }

  /* ── GUEST LIST ── */
  .guest-list { display: flex; flex-direction: column; gap: 0; }
  .guest-item {
    display: flex; align-items: center;
    padding: 13px 0;
    border-bottom: 1px solid #f5f5f5;
    gap: 12px;
    animation: fadeUp 0.3s ease both;
  }
  .guest-item:last-child { border-bottom: none; }
  .guest-avatar {
    width: 36px; height: 36px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.1rem; flex-shrink: 0;
    background: #fff5f3;
  }
  .guest-info { flex: 1; }
  .guest-name { font-size: 0.9rem; font-weight: 500; letter-spacing: 0.5px; }
  .guest-status { font-size: 0.72rem; letter-spacing: 1px; text-transform: uppercase; color: #bbb; margin-top: 2px; }
  .guest-status.ready { color: #4CAF50; }
  .check { color: #4CAF50; font-size: 1.1rem; }
  .pending { color: #f0c040; font-size: 1rem; }

  /* ── WAITING ── */
  .wait-wrap {
    display: flex; flex-direction: column; align-items: center;
    text-align: center; padding-top: 40px; gap: 14px;
  }
  .wait-emoji {
    font-size: 3.5rem;
    animation: float 2s ease-in-out infinite;
  }
  .wait-title { font-size: 1.6rem; font-weight: 500; letter-spacing: 1px; text-transform: uppercase; }
  .wait-sub { font-size: 0.82rem; color: #7a7a8a; letter-spacing: 0.5px; line-height: 1.5; max-width: 280px; }
  .wait-guess {
    background: #fff;
    border: 1.5px solid #f0f0f0;
    border-radius: 50px;
    padding: 10px 22px;
    font-size: 0.88rem;
    letter-spacing: 1px;
  }
  .progress-wrap { width: 80%; background: #f0f0f0; border-radius: 50px; height: 4px; overflow: hidden; }
  .progress-bar { height: 100%; background: #e8624a; border-radius: 50px; transition: width 0.5s; }

  /* ── REVEAL ── */
  .reveal-wrap {
    display: flex; flex-direction: column; align-items: center;
    text-align: center; padding-top: 8px;
  }
  .reveal-flag {
    font-size: 5rem; display: block;
    animation: popIn 0.45s cubic-bezier(0.175,0.885,0.32,1.275) both;
    margin-bottom: 8px;
  }
  .reveal-name {
    font-size: 2.2rem; font-weight: 500;
    letter-spacing: 2px; text-transform: uppercase;
    margin-bottom: 16px;
    animation: fadeUp 0.35s 0.15s ease both; opacity: 0;
  }
  .reveal-verdict {
    padding: 10px 26px; border-radius: 50px;
    font-size: 0.88rem; letter-spacing: 1px;
    margin-bottom: 24px;
    animation: popIn 0.4s 0.35s cubic-bezier(0.175,0.885,0.32,1.275) both; opacity: 0;
  }
  .verdict-ok  { background: rgba(76,175,80,0.1);  color: #2e7d32; }
  .verdict-no  { background: rgba(232,98,74,0.1);  color: #c0392b; }

  .scores {
    width: 100%;
    animation: fadeUp 0.35s 0.5s ease both; opacity: 0;
  }
  .score-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 13px 0; border-bottom: 1px solid #f5f5f5;
  }
  .score-row:last-child { border-bottom: none; }
  .s-name { font-size: 0.9rem; font-weight: 500; letter-spacing: 0.5px; }
  .s-guess { font-size: 0.78rem; color: #aaa; margin-top: 2px; letter-spacing: 0.3px; }
  .s-ok { color: #2e7d32; font-size: 0.78rem; letter-spacing: 1.5px; text-transform: uppercase; }
  .s-no { color: #c0392b; font-size: 0.78rem; letter-spacing: 1.5px; text-transform: uppercase; }

  .reveal-actions {
    width: 100%; margin-top: 24px;
    animation: fadeUp 0.35s 0.65s ease both; opacity: 0;
    display: flex; flex-direction: column; gap: 10px;
  }

  /* ── RANDOMISER ── */
  .rand-wrap {
    display: flex; flex-direction: column; align-items: center;
    text-align: center; padding-top: 20px;
  }
  .spin-row {
    display: flex; gap: 10px; font-size: 2.8rem;
    height: 60px; align-items: center; justify-content: center;
  }
  .spin-row span { animation: bob 0.14s ease-in-out infinite alternate; }
  .spin-row span:nth-child(2) { animation-delay: 0.05s; }
  .spin-row span:nth-child(3) { animation-delay: 0.1s; }
  @keyframes bob { from{transform:translateY(-6px)} to{transform:translateY(6px)} }
  .rand-flag { font-size: 5.5rem; display: block; margin-bottom: 8px; animation: popIn 0.45s cubic-bezier(0.175,0.885,0.32,1.275) both; }
  .rand-name { font-size: 2.4rem; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px; }
  .rand-sub  { font-size: 0.68rem; letter-spacing: 4px; text-transform: uppercase; color: #bbb; margin-bottom: 28px; }
  .rand-btns { display: flex; gap: 10px; width: 100%; }
  .rand-btns .btn { flex: 1; }

  /* ── INVITED LANDING ── */
  .invite-wrap {
    display: flex; flex-direction: column; align-items: center;
    text-align: center; padding-top: 28px;
  }
  .invite-emoji { font-size: 3rem; margin-bottom: 16px; }
  .invite-title { font-size: 1.6rem; font-weight: 500; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; }
  .invite-sub { font-size: 0.85rem; color: #7a7a8a; line-height: 1.6; margin-bottom: 28px; max-width: 300px; }
  .invite-code {
    background: #f7f7f7; border-radius: 14px;
    padding: 14px 28px; margin-bottom: 24px;
    font-size: 1.8rem; letter-spacing: 6px;
    color: #e8624a;
  }

  /* ── STICKY BOTTOM ── */
  .sticky {
    position: fixed; bottom: 0; left: 0; right: 0;
    padding: 16px 20px 32px;
    background: linear-gradient(to top, #FFFDF7 60%, transparent);
  }
  .sticky-inner { max-width: 480px; margin: 0 auto; display: flex; flex-direction: column; gap: 10px; }

  /* ── OR DIVIDER ── */
  .or { display: flex; align-items: center; gap: 12px; margin: 4px 0; color: #ddd; font-size: 0.75rem; letter-spacing: 1px; }
  .or-line { flex: 1; height: 1px; background: #f0f0f0; }

  /* ── ERROR ── */
  .err { color: #e8624a; font-size: 0.8rem; letter-spacing: 0.5px; text-align: center; margin: 4px 0 8px; }

  /* ── TOAST ── */
  .toast {
    position: fixed; bottom: 100px; left: 50%;
    transform: translateX(-50%) translateY(8px);
    background: #1a1a2e; color: #fff;
    padding: 10px 22px; border-radius: 50px;
    font-size: 0.82rem; letter-spacing: 1px;
    opacity: 0; transition: all 0.22s;
    pointer-events: none; z-index: 999; white-space: nowrap;
  }
  .toast.on { opacity: 1; transform: translateX(-50%) translateY(0); }

  /* ── ANIMATIONS ── */
  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
  @keyframes popIn  { from{opacity:0;transform:scale(0.75)} to{opacity:1;transform:scale(1)} }
  .fu { animation: fadeUp 0.32s ease both; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────────────────────
function useToast() {
  const [msg, setMsg] = useState("");
  const [on, setOn] = useState(false);
  const t = useRef(null);
  function toast(m) { clearTimeout(t.current); setMsg(m); setOn(true); t.current = setTimeout(() => setOn(false), 2200); }
  return { msg, on, toast };
}

// ─────────────────────────────────────────────────────────────────────────────
// COUNTRY AUTOCOMPLETE
// ─────────────────────────────────────────────────────────────────────────────
function CountryField({ value, onChange, placeholder = "Search country…" }) {
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
        className="field"
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
              <span style={{ fontSize: "1.3rem" }}>{c.flag}</span>{c.name}
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
// REVEAL SCREEN (shared by host + guest)
// ─────────────────────────────────────────────────────────────────────────────
function RevealScreen({ room, myGuess, isGuest, onDone, roomId, onCopy }) {
  const guests = room?.guests ? Object.values(room.guests) : [];
  const correct = myGuess?.toLowerCase?.() === room?.country?.toLowerCase?.();

  return (
    <div className="page fu">
      <div className="topnav">
        <button className="back" onClick={onDone}>←</button>
        {roomId && <div className="room-pill" onClick={onCopy}><span className="pill-dot" />{roomId}</div>}
      </div>
      <div className="reveal-wrap">
        <span className="reveal-flag">{room.flag}</span>
        <div className="reveal-name">{room.country}</div>

        {isGuest && (
          <div className={`reveal-verdict ${correct ? "verdict-ok" : "verdict-no"}`}>
            {correct ? "🎉 You got it right!" : `😅 You guessed ${myGuess}`}
          </div>
        )}

        {guests.length > 0 && (
          <div className="scores">
            {guests.map(g => {
              const ok = g.guess?.toLowerCase() === room.country?.toLowerCase();
              return (
                <div className="score-row" key={g.name}>
                  <div>
                    <div className="s-name">{g.name}</div>
                    <div className="s-guess">{g.flag} {g.guess}</div>
                  </div>
                  <span className={ok ? "s-ok" : "s-no"}>{ok ? "Correct ✓" : "Wrong ✗"}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="reveal-actions">
          <button className="btn btn-dark" onClick={onDone}>
            {isGuest ? "Back to Home" : "New Expedition"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOME SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function HomeScreen({ onHost, onRand }) {
  return (
    <div className="page">
      <div className="home-wrap fu">
        <div className="home-emoji">🍽️</div>
        <div className="home-title">Foodie<br /><span>Expedition</span></div>
        <div className="home-desc">
          Cook a mystery cuisine, then let your guests guess where it's from.
        </div>
        <div className="home-btns">
          <button className="home-btn btn-host" onClick={onHost}>
            <div className="home-btn-icon">🎩</div>
            <div className="home-btn-text">
              <div className="home-btn-title">Host a Dinner</div>
              <div className="home-btn-sub">Create a room & invite guests</div>
            </div>
            <span className="home-btn-arrow">→</span>
          </button>
          <button className="home-btn btn-rand" onClick={onRand}>
            <div className="home-btn-icon">🎲</div>
            <div className="home-btn-text">
              <div className="home-btn-title">Randomise</div>
              <div className="home-btn-sub">Spin for tonight's cuisine</div>
            </div>
            <span className="home-btn-arrow">→</span>
          </button>
        </div>
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
      <div className="rand-wrap">
        {spinning && (
          <div className="spin-row">
            {sf.map((c, i) => <span key={i}>{c?.flag}</span>)}
          </div>
        )}
        {!spinning && result && (
          <div style={{ width: "100%", textAlign: "center" }}>
            <span className="rand-flag">{result.flag}</span>
            <div className="rand-name">{result.name}</div>
            <div className="rand-sub">Tonight's destination</div>
            <div className="rand-btns">
              <button className="btn btn-ghost" onClick={spin}>↩ Re-spin</button>
              <button className="btn btn-dark" onClick={() => { navigator.clipboard?.writeText(result.name); toast("Copied!"); }}>Copy</button>
            </div>
          </div>
        )}
      </div>
      <div className={`toast${on ? " on" : ""}`}>{msg}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOST FLOW — step by step
// ─────────────────────────────────────────────────────────────────────────────
function HostFlow({ onBack }) {
  const [step, setStep] = useState(1); // 1=pick country, 2=share link, 3=lounge, 4=revealed
  const [country, setCountry] = useState(null);
  const [roomId] = useState(() => generateRoomId());
  const [room, setRoom] = useState({ guests: {}, phase: "waiting" });
  const { msg, on, toast } = useToast();
  const unsub = useRef(null);

  const shareUrl = `${window.location.origin}${window.location.pathname}?join=${roomId}`;

  useEffect(() => {
    set(roomRef(roomId), { phase: "waiting", guests: {}, country: "", flag: "" });
    unsub.current = onValue(roomRef(roomId), snap => {
      if (snap.exists()) setRoom(snap.val());
    });
    return () => { if (unsub.current) unsub.current(); };
  }, []);

  function copyLink() {
    navigator.clipboard?.writeText(shareUrl);
    toast("Link copied! Share it with your guests 🎉");
  }

  function shareWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Join my Foodie Expedition dinner! Tap to guess the cuisine: ${shareUrl}`)}`);
  }

  async function reveal() {
    await update(roomRef(roomId), { country: country.name, flag: country.flag, phase: "revealed" });
    setStep(4);
  }

  function handleDone() {
    clearRoomFromUrl();
    onBack();
  }

  const guests = room?.guests ? Object.values(room.guests) : [];

  // STEP 4 — Revealed
  if (step === 4) {
    return (
      <RevealScreen
        room={room}
        isGuest={false}
        onDone={handleDone}
        roomId={roomId}
        onCopy={copyLink}
      />
    );
  }

  return (
    <div className="page fu" style={{ paddingBottom: 120 }}>
      <div className="topnav">
        <button className="back" onClick={onBack}>←</button>
        {step >= 2 && (
          <div className="room-pill" onClick={copyLink}>
            <span className="pill-dot" />{roomId}
          </div>
        )}
      </div>

      {/* Step indicators */}
      <div className="steps">
        {[1,2,3].map(s => (
          <div key={s} className={`step-dot ${s === step ? "on" : s < step ? "done" : ""}`} />
        ))}
      </div>

      {/* STEP 1 — Pick country */}
      {step === 1 && (
        <>
          <div className="sec-title">What did you<br />cook tonight?</div>
          <div className="sec-sub">Pick the secret country</div>
          <div className="card">
            <div className="card-label">Secret Destination</div>
            <CountryField value={country} onChange={setCountry} placeholder="Search for a country…" />
            {country && (
              <div style={{ textAlign: "center", padding: "12px 0 4px" }}>
                <span style={{ fontSize: "3.5rem" }}>{country.flag}</span>
                <div style={{ fontSize: "1.1rem", letterSpacing: "2px", textTransform: "uppercase", marginTop: 6 }}>{country.name}</div>
                <div style={{ fontSize: "0.7rem", letterSpacing: "2px", textTransform: "uppercase", color: "#bbb", marginTop: 4 }}>Keep this secret! 🤫</div>
              </div>
            )}
          </div>
        </>
      )}

      {/* STEP 2 — Share link */}
      {step === 2 && (
        <>
          <div className="sec-title">Invite your<br />guests</div>
          <div className="sec-sub">Share the link below</div>
          <div className="card">
            <div className="card-label">Your room link</div>
            <div className="share-box" onClick={copyLink}>
              <span className="share-url">{shareUrl}</span>
              <span className="share-copy">Copy</span>
            </div>
            <button className="btn btn-share" onClick={shareWhatsApp}>
              Share via WhatsApp
            </button>
          </div>
          <div className="card" style={{ marginTop: 8 }}>
            <div className="card-label">Or share the room code</div>
            <div style={{ textAlign: "center", fontSize: "2.5rem", letterSpacing: "8px", color: "#e8624a", padding: "8px 0" }}>
              {roomId}
            </div>
          </div>
        </>
      )}

      {/* STEP 3 — Lounge */}
      {step === 3 && (
        <>
          <div className="sec-title">The Departure<br />Lounge</div>
          <div className="sec-sub">Waiting for guests to check in</div>
          <div className="card">
            <div className="card-label">Share link</div>
            <div className="share-box" onClick={copyLink}>
              <span className="share-url">{shareUrl}</span>
              <span className="share-copy">Copy</span>
            </div>
          </div>
          <div className="card">
            <div className="card-label">{guests.length} guest{guests.length !== 1 ? "s" : ""} joined</div>
            <div className="guest-list">
              {guests.length === 0 && (
                <div style={{ textAlign: "center", color: "#bbb", fontSize: "0.82rem", letterSpacing: "1px", padding: "12px 0" }}>
                  Waiting for guests to join…
                </div>
              )}
              {guests.map(g => (
                <div className="guest-item" key={g.name}>
                  <div className="guest-avatar">{g.flag || "🧭"}</div>
                  <div className="guest-info">
                    <div className="guest-name">{g.name}</div>
                    <div className={`guest-status ${g.guess ? "ready" : ""}`}>
                      {g.guess ? `Guessed ${g.flag} ${g.guess}` : "Thinking…"}
                    </div>
                  </div>
                  {g.guess ? <span className="check">✓</span> : <span className="pending">⏳</span>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* STICKY BOTTOM */}
      <div className="sticky">
        <div className="sticky-inner">
          {step === 1 && (
            <button className="btn btn-primary" onClick={() => setStep(2)} disabled={!country}>
              Next — Share with Guests →
            </button>
          )}
          {step === 2 && (
            <>
              <button className="btn btn-dark" onClick={() => setStep(3)}>
                Guests are joining →
              </button>
              <button className="btn btn-ghost" onClick={() => setStep(1)}>
                ← Change Country
              </button>
            </>
          )}
          {step === 3 && (
            <button className="btn btn-primary" onClick={reveal} disabled={guests.length === 0}>
              🥁 Reveal the Answer!
            </button>
          )}
        </div>
      </div>

      <div className={`toast${on ? " on" : ""}`}>{msg}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GUEST FLOW — invited via link or manual code entry
// ─────────────────────────────────────────────────────────────────────────────
function GuestFlow({ prefillCode, onBack }) {
  const [phase, setPhase] = useState(prefillCode ? "name" : "code"); // code | name | waiting | revealed
  const [code, setCode] = useState(prefillCode || "");
  const [name, setName] = useState("");
  const [guess, setGuess] = useState(null);
  const [room, setRoom] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestId] = useState(() => Math.random().toString(36).slice(2, 8));
  const unsub = useRef(null);

  useEffect(() => {
    return () => { if (unsub.current) unsub.current(); };
  }, []);

  async function joinRoom() {
    if (!name.trim()) { setErr("Enter your name"); return; }
    if (!guess) { setErr("Enter your guess"); return; }
    setErr(""); setLoading(true);
    const id = code.trim().toUpperCase();
    try {
      const snap = await get(roomRef(id));
      if (!snap.exists()) { setErr("Room not found. Check the code!"); setLoading(false); return; }
      await set(guestRef(id, guestId), { name: name.trim(), guess: guess.name, flag: guess.flag });
      unsub.current = onValue(roomRef(id), s => { if (s.exists()) setRoom(s.val()); });
      setPhase("waiting");
    } catch (e) { setErr(e.message); setLoading(false); }
  }

  async function validateCode() {
    if (code.length < 4) { setErr("Enter the 4-letter room code"); return; }
    setErr(""); setLoading(true);
    try {
      const snap = await get(roomRef(code.toUpperCase()));
      if (!snap.exists()) { setErr("Room not found. Check the code!"); setLoading(false); return; }
      setLoading(false);
      setPhase("name");
    } catch(e) { setErr(e.message); setLoading(false); }
  }

  const guests = room?.guests ? Object.values(room.guests) : [];
  const guessedCount = guests.filter(g => g.guess).length;
  const revealed = room?.phase === "revealed";

  function handleDone() {
    clearRoomFromUrl();
    onBack();
  }

  // Revealed
  if (revealed && room) {
    return (
      <RevealScreen
        room={room}
        myGuess={guess?.name}
        isGuest={true}
        onDone={handleDone}
        roomId={code.toUpperCase()}
      />
    );
  }

  // Enter code manually
  if (phase === "code") {
    return (
      <div className="page fu">
        <div className="topnav">
          <button className="back" onClick={onBack}>←</button>
        </div>
        <div className="invite-wrap">
          <div className="invite-emoji">🎟️</div>
          <div className="invite-title">Enter Room Code</div>
          <div className="invite-sub">Ask your host for the 4-letter code</div>
          <input
            className="field field-code"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase().slice(0, 4))}
            placeholder="ABCD"
            autoFocus
          />
          {err && <p className="err">{err}</p>}
        </div>
        <div className="sticky">
          <div className="sticky-inner">
            <button className="btn btn-primary" onClick={validateCode} disabled={loading || code.length < 4}>
              {loading ? "Checking…" : "Join Room →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Enter name + guess (after arriving via link or code)
  if (phase === "name") {
    return (
      <div className="page fu">
        <div className="topnav">
          <button className="back" onClick={() => { prefillCode ? onBack() : setPhase("code"); }}>←</button>
          <div className="room-pill"><span className="pill-dot" />{code.toUpperCase()}</div>
        </div>
        <div className="invite-wrap" style={{ alignItems: "stretch", textAlign: "left" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div className="invite-emoji">✈️</div>
            <div className="invite-title">You're In!</div>
            <div className="invite-sub">Enter your name and take a guess at the cuisine</div>
          </div>
          <div className="card">
            <div className="card-label">Your name</div>
            <input
              className="field"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Sofia"
              autoFocus
            />
          </div>
          <div className="card">
            <div className="card-label">Your guess — what cuisine did you eat?</div>
            <CountryField value={guess} onChange={setGuess} placeholder="Search for a country…" />
            {guess && (
              <div style={{ textAlign: "center", padding: "10px 0 4px" }}>
                <span style={{ fontSize: "2.8rem" }}>{guess.flag}</span>
                <div style={{ fontSize: "1rem", letterSpacing: "1.5px", textTransform: "uppercase", marginTop: 4 }}>{guess.name}</div>
              </div>
            )}
          </div>
          {err && <p className="err">{err}</p>}
        </div>
        <div className="sticky">
          <div className="sticky-inner">
            <button className="btn btn-primary" onClick={joinRoom} disabled={loading || !name || !guess}>
              {loading ? "Joining…" : "Lock in my Guess 🔒"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Waiting for host to reveal
  return (
    <div className="page fu">
      <div className="topnav">
        <button className="back" onClick={handleDone}>←</button>
        <div className="room-pill"><span className="pill-dot" />{code.toUpperCase()}</div>
      </div>
      <div className="wait-wrap">
        <div className="wait-emoji">✈️</div>
        <div className="wait-title">On the Runway</div>
        <div className="wait-sub">Your guess is locked in. Waiting for the host to reveal the answer…</div>
        <div className="wait-guess">{guess?.flag} {guess?.name}</div>
        {guests.length > 0 && (
          <>
            <div style={{ fontSize: "0.78rem", color: "#aaa", letterSpacing: "1px" }}>
              {guessedCount} of {guests.length} guests ready
            </div>
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
  const inviteCode = getRoomCodeFromUrl();

  // If URL has ?join=XXXX, go straight to guest flow
  useEffect(() => {
    if (inviteCode) setScreen("guest");
  }, []);

  return (
    <div className="app">
      <style>{G}</style>
      <Header />
      {screen === "home" && (
        <HomeScreen
          onHost={() => setScreen("host")}
          onRand={() => setScreen("rand")}
        />
      )}
      {screen === "rand" && <RandomiserScreen onBack={() => setScreen("home")} />}
      {screen === "host" && <HostFlow onBack={() => { clearRoomFromUrl(); setScreen("home"); }} />}
      {screen === "guest" && (
        <GuestFlow
          prefillCode={inviteCode}
          onBack={() => { clearRoomFromUrl(); setScreen("home"); }}
        />
      )}
    </div>
  );
}
