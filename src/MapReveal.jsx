const STYLES = `
  .map-reveal-wrap {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 12px;
  }

  .reveal-flag-big {
    font-size: 5rem;
    display: block;
    text-align: center;
    animation: popIn 0.45s cubic-bezier(0.175,0.885,0.32,1.275) both;
    margin-bottom: 8px;
  }

  .reveal-country-name {
    font-family: "Futura", "Century Gothic", "Trebuchet MS", sans-serif;
    font-weight: 500;
    font-size: 2.4rem;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #0d0d1a;
    text-align: center;
    margin-bottom: 16px;
    animation: fadeUp 0.35s 0.2s ease both;
    opacity: 0;
  }

  .reveal-verdict {
    display: inline-block;
    padding: 9px 24px;
    border-radius: 50px;
    font-family: "Futura", "Century Gothic", "Trebuchet MS", sans-serif;
    font-weight: 500;
    font-size: 0.95rem;
    letter-spacing: 1px;
    margin-bottom: 24px;
    animation: popIn 0.4s 0.4s cubic-bezier(0.175,0.885,0.32,1.275) both;
    opacity: 0;
  }
  .verdict-correct { background: rgba(76,175,80,0.12); color: #2e7d32; }
  .verdict-wrong   { background: rgba(224,85,85,0.1);  color: #c62828; }

  .reveal-scores {
    width: 100%;
    animation: fadeUp 0.35s 0.5s ease both;
    opacity: 0;
  }

  .result-row { display: flex; align-items: center; justify-content: space-between; padding: 13px 0; border-bottom: 1px solid #eef0f6; width: 100%; }
  .result-row:last-child { border-bottom: none; }
  .r-name { font-weight: 500; font-size: 0.93rem; }
  .r-guess { font-size: 0.8rem; color: #7a8099; margin-top: 1px; }
  .r-ok  { color: #2e7d32; font-weight: 500; font-size: 0.82rem; letter-spacing: 1px; }
  .r-no  { color: #c62828; font-weight: 500; font-size: 0.82rem; letter-spacing: 1px; }

  .reveal-btn-wrap {
    width: 100%;
    margin-top: 24px;
    animation: fadeUp 0.35s 0.65s ease both;
    opacity: 0;
  }

  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
  @keyframes popIn  { from{opacity:0;transform:scale(0.75)} to{opacity:1;transform:scale(1)} }
`;

export default function MapReveal({ country, flag, guests, myGuess, isGuest, onDone }) {
  const correct = myGuess?.toLowerCase?.() === country?.toLowerCase?.();

  return (
    <>
      <style>{STYLES}</style>
      <div className="map-reveal-wrap">
        <span className="reveal-flag-big">{flag}</span>
        <div className="reveal-country-name">{country}</div>

        {isGuest && (
          <div className={`reveal-verdict ${correct ? "verdict-correct" : "verdict-wrong"}`}>
            {correct ? "🎉 You got it right!" : `😅 You guessed ${myGuess}`}
          </div>
        )}

        {guests && guests.length > 0 && (
          <div className="reveal-scores">
            {guests.map(g => {
              const ok = g.guess?.toLowerCase() === country?.toLowerCase();
              return (
                <div className="result-row" key={g.name}>
                  <div>
                    <div className="r-name">{g.name}</div>
                    <div className="r-guess">{g.flag} {g.guess}</div>
                  </div>
                  <span className={ok ? "r-ok" : "r-no"}>{ok ? "CORRECT ✓" : "WRONG ✗"}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="reveal-btn-wrap">
          <button
            className="btn btn-black"
            style={{ width: "100%" }}
            onClick={onDone}
          >
            {isGuest ? "Back to Home" : "New Expedition"}
          </button>
        </div>
      </div>
    </>
  );
}
