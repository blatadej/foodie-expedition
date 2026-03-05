import { useState, useEffect, useRef } from "react";

// Approximate [x%, y%] positions on a 1000x500 equirectangular map for each country
const COUNTRY_COORDS = {
  "Afghanistan": [63.5, 33], "Albania": [52.5, 28], "Algeria": [47, 35],
  "Argentina": [28, 72], "Armenia": [57, 30], "Australia": [80, 65],
  "Austria": [51, 25], "Azerbaijan": [58, 30], "Bahrain": [59, 37],
  "Bangladesh": [70, 37], "Belgium": [49, 23], "Bolivia": [27, 63],
  "Bosnia & Herzegovina": [52, 27], "Brazil": [30, 60], "Bulgaria": [53, 27],
  "Cambodia": [74, 42], "Canada": [20, 18], "Chile": [24, 70],
  "China": [73, 32], "Colombia": [24, 52], "Croatia": [51, 26],
  "Cuba": [22, 41], "Czech Republic": [51, 24], "Denmark": [50, 20],
  "Ecuador": [23, 54], "Egypt": [53, 35], "Estonia": [53, 19],
  "Ethiopia": [55, 47], "Finland": [54, 16], "France": [48, 25],
  "Georgia": [57, 29], "Germany": [50, 23], "Ghana": [46, 47],
  "Greece": [53, 29], "Guatemala": [20, 43], "Hungary": [52, 25],
  "Iceland": [43, 15], "India": [67, 38], "Indonesia": [77, 52],
  "Iran": [60, 33], "Iraq": [58, 33], "Ireland": [46, 22],
  "Israel": [55, 33], "Italy": [51, 27], "Jamaica": [23, 43],
  "Japan": [82, 28], "Jordan": [56, 34], "Kazakhstan": [63, 27],
  "Kenya": [56, 50], "South Korea": [80, 30], "Kuwait": [58, 34],
  "Laos": [74, 40], "Latvia": [53, 20], "Lebanon": [55, 32],
  "Lithuania": [53, 21], "Luxembourg": [49, 24], "Malaysia": [75, 48],
  "Malta": [51, 30], "Mexico": [18, 38], "Mongolia": [73, 25],
  "Montenegro": [52, 27], "Morocco": [45, 33], "Myanmar": [72, 38],
  "Nepal": [68, 34], "Netherlands": [49, 22], "New Zealand": [88, 72],
  "Nigeria": [48, 47], "Norway": [50, 17], "Oman": [61, 38],
  "Pakistan": [64, 34], "Panama": [23, 48], "Peru": [24, 60],
  "Philippines": [79, 40], "Poland": [52, 23], "Portugal": [45, 27],
  "Qatar": [59, 36], "Romania": [53, 26], "Russia": [65, 20],
  "Saudi Arabia": [58, 37], "Senegal": [43, 44], "Serbia": [52, 26],
  "Singapore": [75, 50], "Slovakia": [52, 24], "Slovenia": [51, 25],
  "South Africa": [52, 68], "Spain": [46, 28], "Sri Lanka": [68, 46],
  "Sweden": [52, 17], "Switzerland": [50, 25], "Syria": [56, 32],
  "Taiwan": [79, 34], "Tanzania": [56, 54], "Thailand": [73, 41],
  "Tunisia": [49, 31], "Turkey": [55, 30], "Uganda": [55, 49],
  "Ukraine": [54, 25], "United Arab Emirates": [60, 37],
  "United Kingdom": [47, 21], "United States": [18, 32],
  "Uruguay": [29, 71], "Uzbekistan": [63, 30], "Venezuela": [26, 50],
  "Vietnam": [75, 40], "Yemen": [58, 41], "Zimbabwe": [54, 61],
};

const STYLES = `
  .map-reveal-wrap {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
  }

  .map-container {
    position: relative;
    width: 100%;
    max-width: 480px;
    border-radius: 16px;
    overflow: hidden;
    background: #e8f0fe;
    border: 1.5px solid #eef0f6;
  }

  .map-svg {
    width: 100%;
    display: block;
  }

  .map-pin {
    position: absolute;
    font-size: 1.8rem;
    transform: translate(-50%, -100%);
    transition: left 0.18s cubic-bezier(0.4,0,0.2,1), top 0.18s cubic-bezier(0.4,0,0.2,1);
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    z-index: 10;
    pointer-events: none;
  }

  .map-pin.scrambling {
    animation: pinWiggle 0.15s ease-in-out infinite;
  }

  .map-pin.landing {
    transition: left 0.6s cubic-bezier(0.175,0.885,0.32,1.275), top 0.6s cubic-bezier(0.175,0.885,0.32,1.275);
    animation: pinLand 0.5s 0.6s cubic-bezier(0.175,0.885,0.32,1.275) both;
  }

  @keyframes pinWiggle {
    0%   { transform: translate(-50%, -100%) rotate(-15deg) scale(1.1); }
    50%  { transform: translate(-50%, -100%) rotate(15deg) scale(0.9); }
    100% { transform: translate(-50%, -100%) rotate(-15deg) scale(1.1); }
  }

  @keyframes pinLand {
    0%   { transform: translate(-50%, -160%) scale(1.4); }
    60%  { transform: translate(-50%, -90%) scale(0.85); }
    80%  { transform: translate(-50%, -110%) scale(1.1); }
    100% { transform: translate(-50%, -100%) scale(1); }
  }

  .map-pulse {
    position: absolute;
    width: 40px; height: 40px;
    border-radius: 50%;
    background: rgba(79,127,255,0.25);
    transform: translate(-50%, -50%);
    animation: pulse-ring 1s ease-out infinite;
    pointer-events: none;
    z-index: 9;
  }

  @keyframes pulse-ring {
    0%   { width: 12px; height: 12px; opacity: 0.8; }
    100% { width: 52px; height: 52px; opacity: 0; }
  }

  .reveal-result {
    width: 100%;
    text-align: center;
    padding: 20px 0 0;
    animation: fadeUp 0.4s 0.3s ease both;
    opacity: 0;
  }
  .reveal-result.show { animation: fadeUp 0.4s ease both; opacity: 1; }

  .reveal-flag-big { font-size: 4rem; display: block; margin-bottom: 6px; }
  .reveal-country-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900; font-size: 2.6rem;
    text-transform: uppercase; letter-spacing: -1px;
    color: #0d0d1a; margin-bottom: 14px;
  }
  .reveal-verdict {
    display: inline-block;
    padding: 9px 24px; border-radius: 50px;
    font-weight: 800; font-size: 1rem;
    animation: popIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275) both;
    margin-bottom: 20px;
  }
  .verdict-correct { background: rgba(76,175,80,0.12); color: #2e7d32; }
  .verdict-wrong   { background: rgba(224,85,85,0.1);  color: #c62828; }

  .reveal-scores { width: 100%; }
  .result-row { display: flex; align-items: center; justify-content: space-between; padding: 13px 0; border-bottom: 1px solid #eef0f6; width: 100%; }
  .result-row:last-child { border-bottom: none; }
  .r-name { font-weight: 700; font-size: 0.93rem; }
  .r-guess { font-size: 0.8rem; color: #7a8099; margin-top: 1px; }
  .r-ok  { color: #2e7d32; font-weight: 800; font-size: 0.82rem; letter-spacing: 1px; }
  .r-no  { color: #c62828; font-weight: 800; font-size: 0.82rem; letter-spacing: 1px; }

  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
  @keyframes popIn  { from{opacity:0;transform:scale(0.7)} to{opacity:1;transform:scale(1)} }
`;

// Simple SVG world map paths (simplified continents)
function WorldMapSVG() {
  return (
    <svg
      className="map-svg"
      viewBox="0 0 1000 500"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="1000" height="500" fill="#dbeafe" />
      {/* North America */}
      <path d="M 80 60 L 160 50 L 220 70 L 240 100 L 220 140 L 200 180 L 160 220 L 140 260 L 120 280 L 100 260 L 60 200 L 40 160 L 50 120 L 70 90 Z" fill="#c8d8b0" stroke="#b8c8a0" strokeWidth="1.5"/>
      {/* Greenland */}
      <path d="M 170 20 L 220 15 L 240 35 L 220 55 L 185 50 Z" fill="#c8d8b0" stroke="#b8c8a0" strokeWidth="1"/>
      {/* Central America */}
      <path d="M 160 220 L 200 220 L 220 240 L 210 260 L 180 255 L 160 240 Z" fill="#c8d8b0" stroke="#b8c8a0" strokeWidth="1"/>
      {/* South America */}
      <path d="M 200 280 L 260 260 L 300 270 L 320 300 L 310 360 L 290 420 L 260 450 L 230 440 L 210 400 L 200 360 L 195 320 Z" fill="#c8d8b0" stroke="#b8c8a0" strokeWidth="1.5"/>
      {/* Europe */}
      <path d="M 440 60 L 500 55 L 540 65 L 560 80 L 545 100 L 520 110 L 500 130 L 480 125 L 460 110 L 440 95 L 430 80 Z" fill="#c8d8b0" stroke="#b8c8a0" strokeWidth="1.5"/>
      {/* Scandinavia */}
      <path d="M 480 30 L 520 25 L 540 45 L 530 65 L 505 58 L 485 50 Z" fill="#c8d8b0" stroke="#b8c8a0" strokeWidth="1"/>
      {/* Africa */}
      <path d="M 440 130 L 510 120 L 560 130 L 580 170 L 575 230 L 560 300 L 530 370 L 500 410 L 470 400 L 450 350 L 430 280 L 420 210 L 425 160 Z" fill="#c8d8b0" stroke="#b8c8a0" strokeWidth="1.5"/>
      {/* Middle East */}
      <path d="M 550 110 L 620 110 L 640 130 L 625 160 L 590 165 L 560 155 L 548 135 Z" fill="#c8d8b0" stroke="#b8c8a0" strokeWidth="1"/>
      {/* Asia (main) */}
      <path d="M 560 50 L 700 40 L 800 50 L 850 70 L 840 120 L 800 150 L 760 170 L 720 165 L 680 155 L 640 145 L 610 130 L 580 110 L 560 90 Z" fill="#c8d8b0" stroke="#b8c8a0" strokeWidth="1.5"/>
      {/* South Asia */}
      <path d="M 630 150 L 700 155 L 720 180 L 700 220 L 670 230 L 645 210 L 630 185 Z" fill="#c8d8b0" stroke="#b8c8a0" strokeWidth="1"/>
      {/* Southeast Asia */}
      <path d="M 720 160 L 790 165 L 810 190 L 790 210 L 760 205 L 730 190 Z" fill="#c8d8b0" stroke="#b8c8a0" strokeWidth="1"/>
      {/* Indonesia */}
      <path d="M 750 240 L 810 235 L 840 250 L 820 265 L 775 260 Z" fill="#c8d8b0" stroke="#b8c8a0" strokeWidth="1"/>
      {/* Australia */}
      <path d="M 760 310 L 840 300 L 880 330 L 875 390 L 840 420 L 790 415 L 755 385 L 748 345 Z" fill="#c8d8b0" stroke="#b8c8a0" strokeWidth="1.5"/>
      {/* New Zealand */}
      <path d="M 880 370 L 900 360 L 910 385 L 895 400 L 878 390 Z" fill="#c8d8b0" stroke="#b8c8a0" strokeWidth="1"/>
      {/* Japan */}
      <path d="M 820 100 L 835 90 L 845 105 L 835 120 L 820 115 Z" fill="#c8d8b0" stroke="#b8c8a0" strokeWidth="1"/>
      {/* UK / Ireland */}
      <path d="M 455 65 L 470 60 L 475 75 L 465 82 L 452 75 Z" fill="#c8d8b0" stroke="#b8c8a0" strokeWidth="1"/>
      {/* Madagascar */}
      <path d="M 568 310 L 578 300 L 585 325 L 578 350 L 565 340 Z" fill="#c8d8b0" stroke="#b8c8a0" strokeWidth="1"/>
    </svg>
  );
}

export default function MapReveal({ country, flag, guests, myGuess, isGuest, onDone }) {
  const [phase, setPhase] = useState("scrambling"); // scrambling | landing | done
  const [pinPos, setPinPos] = useState({ x: 50, y: 50 });
  const [showResult, setShowResult] = useState(false);
  const containerRef = useRef(null);
  const timerRef = useRef(null);
  const stepRef = useRef(0);

  const targetCoords = COUNTRY_COORDS[country] || [50, 40];

  useEffect(() => {
    // Phase 1: scramble around for ~2.5s
    let count = 0;
    const totalScrambles = 18;
    timerRef.current = setInterval(() => {
      setPinPos({
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 70,
      });
      count++;
      if (count >= totalScrambles) {
        clearInterval(timerRef.current);
        // Phase 2: land on country
        setPhase("landing");
        setPinPos({ x: targetCoords[0], y: targetCoords[1] });
        // Phase 3: show result after landing
        setTimeout(() => {
          setPhase("done");
          setShowResult(true);
        }, 1200);
      }
    }, 130);

    return () => clearInterval(timerRef.current);
  }, []);

  const correct = myGuess?.toLowerCase?.() === country?.toLowerCase?.();

  return (
    <>
      <style>{STYLES}</style>
      <div className="map-reveal-wrap">
        <div className="map-container" ref={containerRef}>
          <WorldMapSVG />
          <div
            className={`map-pin ${phase === "scrambling" ? "scrambling" : phase === "landing" ? "landing" : ""}`}
            style={{ left: `${pinPos.x}%`, top: `${pinPos.y}%` }}
          >
            📍
          </div>
          {phase === "done" && (
            <div
              className="map-pulse"
              style={{ left: `${targetCoords[0]}%`, top: `${targetCoords[1]}%` }}
            />
          )}
        </div>

        {showResult && (
          <div className="reveal-result show">
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

            <button
              className="btn btn-black"
              style={{ marginTop: 24, width: "100%" }}
              onClick={onDone}
            >
              {isGuest ? "Back to Home" : "New Expedition"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
