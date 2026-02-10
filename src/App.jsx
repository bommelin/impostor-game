import { useState, useEffect, useRef, useCallback } from "react";
import { CATEGORIES } from "./wordBank";
import CustomWordBanksScreen from "./screens/CustomWordBanks";
import {
  loadCustomWordBanks,
  saveCustomWordBanks,
  getNextCustomWordBankName,
  createCustomWordBank,
  updateCustomWordBank,
  deleteCustomWordBank,
} from "./customWordBanks";

// ─── STORAGE HELPERS ─────────────────────────────────────────────────────────
const STORAGE_KEY = "impostor_game_v1";
const load = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
};
const save = (data) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...load(), ...data })); } catch {}
};

// ─── UTILS ────────────────────────────────────────────────────────────────────
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
const pickN = (arr, n) => shuffle(arr).slice(0, n);
const TIMER_MIN_MINUTES = 1;
const TIMER_MAX_MINUTES = 15;
const TIMER_DEFAULT_MINUTES = 5;
const TIMER_STORAGE_KEY = "roundTimerMinutes";
const clampTimerMinutes = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return TIMER_DEFAULT_MINUTES;
  return Math.min(TIMER_MAX_MINUTES, Math.max(TIMER_MIN_MINUTES, Math.round(parsed)));
};
const formatTimer = (totalSeconds) => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

// ─── COLOUR PALETTE ───────────────────────────────────────────────────────────
const PALETTE = {
  bg: "#FFF9F0",
  card: "#FFFFFF",
  primary: "#FF6B6B",
  secondary: "#FFD93D",
  accent: "#6BCB77",
  blue: "#4ECDC4",
  purple: "#C77DFF",
  text: "#2D2D2D",
  muted: "#888",
  border: "#F0E8DC",
};

// const CATEGORY_COLORS = {
//   "Movies & TV": ["#FF6B6B", "#FF8E53"],
//   "Countries": ["#4ECDC4", "#44A3AA"],
//   "Celebrities": ["#C77DFF", "#9D4EDD"],
// };

const CATEGORY_COLORS = ["#FF6B6B", "#FF8E53"];


// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #root { height: 100%; width: 100%; overflow: hidden; }
    body {
      font-family: 'Nunito', sans-serif;
      background: ${PALETTE.bg};
      color: ${PALETTE.text};
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }
    input { font-family: 'Nunito', sans-serif; }
    button { font-family: 'Fredoka One', cursive; cursor: pointer; border: none; outline: none; }

    @keyframes popIn {
      0% { transform: scale(0.7) rotate(-3deg); opacity: 0; }
      70% { transform: scale(1.05) rotate(1deg); }
      100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }
    @keyframes slideUp {
      from { transform: translateY(30px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes wiggle {
      0%,100% { transform: rotate(-2deg); }
      50% { transform: rotate(2deg); }
    }
    @keyframes pulse {
      0%,100% { transform: scale(1); }
      50% { transform: scale(1.04); }
    }
    @keyframes confetti {
      0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
      100% { transform: translateY(80px) rotate(720deg); opacity: 0; }
    }
    .pop { animation: popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
    .slide-up { animation: slideUp 0.35s ease both; }
    .wiggle { animation: wiggle 0.5s ease infinite; }
    .pulse { animation: pulse 2s ease infinite; }
  `}</style>
);

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function Screen({ children, style }) {
  return (
    <div style={{
      height: "100dvh", width: "100%", maxWidth: 480,
      margin: "0 auto", display: "flex", flexDirection: "column",
      padding: "0 20px 24px", overflowY: "auto",
      background: PALETTE.bg, position: "relative",
      ...style
    }}>
      {children}
    </div>
  );
}

function BigButton({ children, onClick, color = PALETTE.primary, style, disabled, small }) {
  const [pressed, setPressed] = useState(false);
  const startedOnButton = useRef(false);
  return (
    <button
      disabled={disabled}
      onPointerDown={(e) => {
        // Only register a press that physically began on this button
        startedOnButton.current = true;
        setPressed(true);
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerUp={() => {
        setPressed(false);
        if (!disabled && startedOnButton.current) onClick?.();
        startedOnButton.current = false;
      }}
      onPointerLeave={() => {
        setPressed(false);
        startedOnButton.current = false;
      }}
      onPointerCancel={() => {
        setPressed(false);
        startedOnButton.current = false;
      }}
      style={{
        background: disabled ? "#DDD" : color,
        color: disabled ? "#AAA" : "#FFF",
        fontSize: small ? 16 : 20,
        padding: small ? "12px 20px" : "16px 24px",
        borderRadius: 18,
        width: "100%",
        boxShadow: pressed || disabled ? "none" : `0 5px 0 ${disabled ? "#BBB" : darken(color)}`,
        transform: pressed ? "translateY(4px)" : "translateY(0)",
        transition: "transform 0.08s, box-shadow 0.08s",
        letterSpacing: 0.5,
        touchAction: "none",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function OutlineButton({ children, onClick, color = PALETTE.primary, style, small }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => { setPressed(false); onClick?.(); }}
      onPointerLeave={() => setPressed(false)}
      style={{
        background: "transparent",
        color: color,
        fontSize: small ? 15 : 18,
        padding: small ? "10px 16px" : "14px 20px",
        borderRadius: 16,
        width: "100%",
        border: `2.5px solid ${color}`,
        transform: pressed ? "scale(0.97)" : "scale(1)",
        transition: "transform 0.08s",
        letterSpacing: 0.3,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function PillButton({ children, onClick, color = PALETTE.primary, disabled, style }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      disabled={disabled}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => {
        setPressed(false);
        if (!disabled) onClick?.();
      }}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      style={{
        borderRadius: 999,
        padding: "8px 14px",
        fontSize: 13,
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 800,
        background: disabled ? "#E7E7E7" : color,
        color: disabled ? "#AAA" : "#FFF",
        letterSpacing: 0.2,
        transform: pressed ? "scale(0.96)" : "scale(1)",
        transition: "transform 0.08s",
        boxShadow: disabled ? "none" : `0 3px 0 ${darken(color)}`,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function Chip({ label, selected, onClick, color }) {
  const [c1, c2] = CATEGORY_COLORS[label] || ["#FF6B6B", "#FF8E53"];
  return (
    <button
      onClick={onClick}
      style={{
        padding: "12px 18px",
        borderRadius: 50,
        fontSize: 16,
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 700,
        border: `3px solid ${selected ? c1 : "#E0D6CC"}`,
        background: selected ? `linear-gradient(135deg, ${c1}, ${c2})` : "#FFF",
        color: selected ? "#FFF" : PALETTE.muted,
        transition: "all 0.2s",
        transform: selected ? "scale(1.04)" : "scale(1)",
        boxShadow: selected ? `0 4px 12px ${c1}55` : "none",
        whiteSpace: "nowrap",
        letterSpacing: 0.2,
      }}
    >
      {selected ? "✓ " : ""}{label}
    </button>
  );
}

function Counter({ label, value, onDec, onInc, disableInc, disableDec }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
      background: "#FFF", borderRadius: 16, padding: "14px 18px",
      border: `2px solid ${PALETTE.border}`, marginBottom: 10 }}>
      <span style={{ fontWeight: 700, fontSize: 16 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={onDec} disabled={disableDec} style={{
          width: 38, height: 38, aspectRatio: "1 / 1", borderRadius: 10,
          background: disableDec ? "#EEE" : PALETTE.primary,
          color: disableDec ? "#AAA" : "#FFF",
          fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: disableDec ? "none" : "0 3px 0 #CC4444",
        }}>−</button>
        <span style={{ fontSize: 22, fontFamily: "'Fredoka One', cursive", minWidth: 24, textAlign: "center" }}>{value}</span>
        <button onClick={onInc} disabled={disableInc} style={{
          width: 38, height: 38, aspectRatio: "1 / 1", borderRadius: 10,
          background: disableInc ? "#EEE" : PALETTE.accent,
          color: disableInc ? "#AAA" : "#FFF",
          fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: disableInc ? "none" : "0 3px 0 #3A8A45",
        }}>+</button>
      </div>
    </div>
  );
}

function Title({ children, sub, style }) {
  return (
    <div style={{ textAlign: "center", ...style }}>
      <h1 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 36, color: PALETTE.primary, lineHeight: 1.1 }}>{children}</h1>
      {sub && <p style={{ color: PALETTE.muted, fontSize: 15, marginTop: 6, fontWeight: 600 }}>{sub}</p>}
    </div>
  );
}

function darken(hex) {
  // simple darken by 20%
  const n = parseInt(hex.replace("#",""), 16);
  const r = Math.max(0, (n >> 16) - 40);
  const g = Math.max(0, ((n >> 8) & 0xFF) - 40);
  const b = Math.max(0, (n & 0xFF) - 40);
  return `#${[r,g,b].map(v => v.toString(16).padStart(2,"0")).join("")}`;
}

// ─── SWIPE PEEK ──────────────────────────────────────────────────────────────
// Default state: solid opaque cover plate — nothing leaks through.
// Drag the thumb right to peek; content shows only while held past threshold.
// Releasing snaps everything back. onReveal fires once to unlock the Next button.
function SwipeReveal({ onReveal, revealed, children }) {
  const thumbRef = useRef(null);
  const trackRef = useRef(null);
  const startX = useRef(null);
  const isDragging = useRef(false);
  const [progress, setProgress] = useState(0); // 0–1
  const [peeking, setPeeking] = useState(false);
  const THRESHOLD = 0.78;
  const THUMB_W = 58;

  // Only start drag if pointer lands on the thumb
  const handleThumbStart = (clientX) => {
    startX.current = clientX;
    isDragging.current = true;
  };

  const handleMove = (clientX) => {
    if (!isDragging.current) return;
    const trackW = trackRef.current?.offsetWidth || 300;
    const maxTravel = trackW - THUMB_W - 8;
    const delta = Math.max(0, Math.min(clientX - startX.current, maxTravel));
    const p = delta / maxTravel;
    setProgress(p);
    const nowPeeking = p >= THRESHOLD;
    setPeeking(nowPeeking);
    if (nowPeeking && !revealed) onReveal?.();
  };

  const handleEnd = () => {
    isDragging.current = false;
    startX.current = null;
    setProgress(0);
    setPeeking(false);
  };

  // Attach global move/up so drag works even if finger leaves thumb
  useEffect(() => {
    const onMouseMove = (e) => handleMove(e.clientX);
    const onTouchMove = (e) => { if (isDragging.current) { e.preventDefault(); handleMove(e.touches[0].clientX); }};
    const onUp = () => { if (isDragging.current) handleEnd(); };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [revealed]);

  const thumbLeft = progress * (( trackRef.current?.offsetWidth || 300) - THUMB_W - 8) + 4;

  return (
    <div style={{ width: "100%", position: "relative" }}>

      {/* ── Content area ── */}
      <div style={{ position: "relative", borderRadius: 20, overflow: "hidden",
        boxShadow: "0 6px 20px rgba(0,0,0,0.08)" }}>

        {/* The actual role card — always rendered but hidden under cover */}
        <div style={{
          background: "linear-gradient(135deg, #FFD93D, #FFB347)",
          padding: "28px 24px", textAlign: "center",
          userSelect: "none", pointerEvents: "none",
          visibility: peeking ? "visible" : "hidden",
        }}>
          {children}
        </div>

        {/* Solid cover — sits on top when not peeking, slides away when peeking */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, #E8E0D8, #D4CCC4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: 8,
          opacity: peeking ? 0 : 1,
          transition: peeking ? "opacity 0.08s" : "opacity 0.2s",
          pointerEvents: "none",
        }}>
          <div style={{ fontSize: 40 }}>🔒</div>
          <p style={{ fontFamily: "'Fredoka One', cursive", fontSize: 18,
            color: "#999", letterSpacing: 0.5 }}>Slide to peek</p>
        </div>
      </div>

      {/* ── Slider track ── */}
      <div
        ref={trackRef}
        style={{
          position: "relative", height: 68, borderRadius: 18, marginTop: 14,
          background: peeking ? "#FFF3CD" : "#F0E8DC",
          border: `2.5px solid ${peeking ? "#FFD93D" : PALETTE.border}`,
          transition: "background 0.2s, border-color 0.2s",
          overflow: "hidden",
          userSelect: "none",
        }}
      >
        {/* fill */}
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0,
          width: `calc(${progress * 100}% + ${THUMB_W / 2}px)`,
          background: peeking
            ? "linear-gradient(90deg, #FFD93D, #FFB347)"
            : "linear-gradient(90deg, #D4ECD4, #A8D5A8)",
          borderRadius: 16,
          transition: isDragging.current ? "none" : "width 0.25s ease",
          opacity: 0.6,
        }} />

        {/* thumb — drag starts here */}
        <div
          ref={thumbRef}
          onMouseDown={e => { e.stopPropagation(); handleThumbStart(e.clientX); }}
          onTouchStart={e => { e.stopPropagation(); handleThumbStart(e.touches[0].clientX); }}
          style={{
            position: "absolute",
            left: thumbLeft,
            top: "50%", transform: "translateY(-50%)",
            width: THUMB_W, height: THUMB_W - 4, borderRadius: 14,
            background: peeking ? "#FFD93D" : "#FFF",
            boxShadow: peeking
              ? "0 4px 14px rgba(255,217,61,0.5)"
              : "0 3px 10px rgba(0,0,0,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, cursor: isDragging.current ? "grabbing" : "grab",
            transition: isDragging.current ? "none" : "left 0.25s ease, background 0.15s, box-shadow 0.15s",
            zIndex: 3, touchAction: "none",
            border: `2px solid ${peeking ? "#F0C030" : "#EEE"}`,
          }}
        >
          {peeking ? "👁️" : "👉"}
        </div>

      </div>
    </div>
  );
}

// ─── SCREENS ──────────────────────────────────────────────────────────────────

function HomeScreen({ onStart, onPlayAgain, onOpenCustomWordBanks, hasPlayers }) {
  return (
    <Screen style={{ justifyContent: "center", alignItems: "center", gap: 0 }}>
      <div className="pop" style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{
          fontFamily: "'Archivo Black', 'Fredoka One', sans-serif",
          fontSize: 62,
          color: "#E54848",
          lineHeight: 1,
          textShadow: "0 4px 0 #B73333",
        }}>Impostor!</h1>
      </div>
      <div className="slide-up" style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
        <BigButton onClick={onStart} color={PALETTE.primary}>
          New Game
        </BigButton>
        <BigButton onClick={onPlayAgain} color={PALETTE.blue} disabled={!hasPlayers}>
          Play Again
        </BigButton>
        <BigButton onClick={onOpenCustomWordBanks} color="#FF8E53">
          Custom Categories
        </BigButton>
      </div>
      {/* decorative blobs */}
      <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%",
        background: "#FFD93D33", zIndex: -1 }} />
      <div style={{ position: "absolute", bottom: 60, left: -40, width: 160, height: 160, borderRadius: "50%",
        background: "#6BCB7722", zIndex: -1 }} />
      <p
        style={{
          position: "absolute",
          bottom: 10,
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: 11,
          fontWeight: 600,
          color: "#9A9A9A",
          letterSpacing: 0.2,
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      >
        Made by Felix Bommelin
      </p>
    </Screen>
  );
}

function PlayersScreen({ initial, onContinue, onBack }) {
  const stored = load();
  const [n, setN] = useState(initial?.n || stored.lastPlayerCount || 4);
  const [k, setK] = useState(initial?.k || stored.lastImpostorCount || 1);
  const [names, setNames] = useState(() => {
    const saved = stored.savedPlayers || [];
    const count = initial?.n || stored.lastPlayerCount || 4;
    return Array.from({ length: count }, (_, i) => saved[i] || "");
  });

  useEffect(() => {
    setNames(prev => {
      const next = Array.from({ length: n }, (_, i) => prev[i] ?? "");
      return next;
    });
    if (k > n - 1) setK(Math.max(1, n - 1));
  }, [n]);

  const finalNames = names.map((nm, i) => nm.trim() || `Player ${i + 1}`);

  const handleContinue = () => {
    save({ savedPlayers: finalNames, lastPlayerCount: n, lastImpostorCount: k });
    onContinue({ players: finalNames, k });
  };

  return (
    <Screen>
      <div style={{ paddingTop: 24, marginBottom: 16 }}>
        <Title>Players</Title>
      </div>
      <Counter
        label="Players"
        value={n}
        onDec={() => setN(v => Math.max(2, v - 1))}
        onInc={() => setN(v => Math.min(12, v + 1))}
        disableDec={n <= 2}
        disableInc={n >= 12}
      />
      <Counter
        label="Impostors"
        value={k}
        onDec={() => setK(v => Math.max(1, v - 1))}
        onInc={() => setK(v => v + 1)}
        disableDec={k <= 1}
        disableInc={k >= n - 1}
      />
      <div style={{ background: "#FFF", borderRadius: 16, padding: 16,
        border: `2px solid ${PALETTE.border}`, marginTop: 4, marginBottom: 16 }}>
        <p style={{ fontWeight: 800, fontSize: 14, color: PALETTE.muted,
          textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Name your players</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {names.map((name, i) => (
            <input
              key={i}
              value={name}
              onChange={e => setNames(prev => prev.map((v, j) => j === i ? e.target.value : v))}
              placeholder={`Player ${i + 1}`}
              style={{
                padding: "10px 14px", borderRadius: 12, fontSize: 15, fontWeight: 600,
                border: `2px solid ${PALETTE.border}`, outline: "none",
                background: PALETTE.bg, color: PALETTE.text,
              }}
            />
          ))}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: "auto" }}>
        <BigButton onClick={handleContinue} color={PALETTE.accent}>Continue</BigButton>
        <OutlineButton onClick={onBack} color={PALETTE.muted} small>Back</OutlineButton>
      </div>
    </Screen>
  );
}

function CategoriesScreen({
  selectedBuiltInCategories,
  selectedCustomBankIds,
  customWordBanks,
  onToggleBuiltInCategory,
  onToggleCustomBankSelection,
  onOpenCustomWordBanks,
  onPlay,
  onBack,
}) {
  const allCats = Object.keys(CATEGORIES);
  const selectedCustomBanks = customWordBanks.filter((bank) => selectedCustomBankIds.includes(bank.id));
  const selectedEntries = [
    ...selectedBuiltInCategories.map((cat) => ({ id: `built_in_${cat}`, label: cat, words: CATEGORIES[cat] || [] })),
    ...selectedCustomBanks.map((bank) => ({ id: bank.id, label: bank.name, words: bank.words })),
  ];
  const totalWords = selectedEntries.reduce((sum, entry) => sum + entry.words.length, 0);

  return (
    <Screen>
      <div style={{ paddingTop: 24, marginBottom: 20 }}>
        <Title sub="Pick one or more categories">Choose Category</Title>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginBottom: 20 }}>
        {allCats.map(cat => (
          <Chip
            key={cat}
            label={cat}
            selected={selectedBuiltInCategories.includes(cat)}
            onClick={() => onToggleBuiltInCategory(cat)}
          />
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <button
          onClick={onOpenCustomWordBanks}
          style={{
            borderRadius: 999,
            background: "#FFF",
            border: `2px solid ${PALETTE.border}`,
            color: PALETTE.muted,
            padding: "8px 18px",
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: 0.2,
          }}
        >
          Custom Categories
        </button>
        {selectedCustomBanks.map((bank) => (
          <Chip
            key={bank.id}
            label={bank.name}
            selected
            onClick={() => onToggleCustomBankSelection(bank.id)}
          />
        ))}
      </div>

      {/* Preview — shows only when something is selected */}
      <div style={{
        background: "#FFF", borderRadius: 16, padding: 16,
        border: `2px solid ${selectedEntries.length ? PALETTE.border : "#F5F0EB"}`,
        marginBottom: 16, flex: 1,
        opacity: selectedEntries.length ? 1 : 0.5,
        transition: "opacity 0.2s",
      }}>
        {selectedEntries.length === 0 ? (
          <p style={{ fontWeight: 700, fontSize: 14, color: "#CCC", textAlign: "center", padding: "8px 0" }}>
            No categories selected yet
          </p>
        ) : (
          <>
            <p style={{ fontWeight: 800, fontSize: 13, color: PALETTE.muted,
              textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
              {selectedEntries.length} categor{selectedEntries.length === 1 ? "y" : "ies"} · {totalWords} words
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {selectedEntries.map((entry) => {
                const [c1] = CATEGORY_COLORS[entry.label] || ["#FF6B6B"];
                const samples = entry.words.slice(0, 3);
                return (
                  <div key={entry.id} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: 12, fontWeight: 800, color: c1,
                      textTransform: "uppercase", letterSpacing: 0.8, minWidth: 80,
                    }}>{entry.label}</span>
                    {samples.map((w) => (
                      <span key={w} style={{
                        background: PALETTE.bg, borderRadius: 8, padding: "3px 9px",
                        fontSize: 13, fontWeight: 600, color: PALETTE.muted,
                      }}>{w}</span>
                    ))}
                    {entry.words.length > 3 ? (
                      <span style={{ fontSize: 13, color: "#CCC", fontWeight: 700 }}>…</span>
                    ) : entry.words.length === 0 ? (
                      <span style={{ fontSize: 13, color: "#CCC", fontWeight: 700 }}>No words yet</span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <BigButton onClick={onPlay} color={PALETTE.primary} disabled={totalWords === 0}>
          Let's Play!
        </BigButton>
        <OutlineButton onClick={onBack} color={PALETTE.muted} small>Back</OutlineButton>
      </div>
    </Screen>
  );
}

function PassScreen({ name, onReady }) {
  return (
    <Screen style={{ justifyContent: "center", alignItems: "center" }}>
      <div className="pop" style={{ textAlign: "center", width: "100%" }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>📱</div>
        <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 28,
          color: PALETTE.text, marginBottom: 8 }}>Pass the phone to</h2>
        <div style={{
          fontFamily: "'Fredoka One', cursive", fontSize: 44,
          color: PALETTE.primary, background: "#FFF",
          borderRadius: 20, padding: "14px 28px",
          boxShadow: "0 6px 20px rgba(255,107,107,0.2)",
          display: "inline-block", marginBottom: 32,
          border: `3px solid ${PALETTE.primary}`,
        }}>{name}</div>
        <div style={{ width: "100%", paddingTop: 8 }}>
          <BigButton onClick={onReady} color={PALETTE.blue}>
            I'm ready
          </BigButton>
        </div>
      </div>
    </Screen>
  );
}

function RevealScreen({ name, isImpostor, word, onNext, isLast }) {
  const [revealed, setRevealed] = useState(false);
  const [nextReady, setNextReady] = useState(false);

  const handleReveal = () => {
    if (revealed) return;
    setRevealed(true);
    setTimeout(() => setNextReady(true), 1200);
  };

  return (
    <Screen style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <p style={{ fontWeight: 800, fontSize: 15, color: PALETTE.muted,
            textTransform: "uppercase", letterSpacing: 1.5 }}>
            {name}'s role
          </p>
        </div>

        <SwipeReveal onReveal={handleReveal} revealed={revealed}>
          {isImpostor ? (
            <div>
              <div style={{ fontSize: 56, marginBottom: 8 }}>🕵️</div>
              <p style={{ fontFamily: "'Fredoka One', cursive", fontSize: 30, color: "#C0392B" }}>
                You are the
              </p>
              <p style={{ fontFamily: "'Fredoka One', cursive", fontSize: 48,
                color: "#C0392B", textShadow: "2px 2px 0 #F1948A" }}>IMPOSTOR!</p>
              <p style={{ fontSize: 15, color: "#666", marginTop: 10, fontWeight: 600 }}>
                Blend in. Don't get caught.
              </p>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 56, marginBottom: 8 }}>🌟</div>
              <p style={{ fontFamily: "'Fredoka One', cursive", fontSize: 22, color: "#555" }}>
                Your word is
              </p>
              <p style={{ fontFamily: "'Fredoka One', cursive", fontSize: 42,
                color: PALETTE.text, marginTop: 4 }}>{word}</p>
              <p style={{ fontSize: 15, color: "#666", marginTop: 10, fontWeight: 600 }}>
                Find the impostor!
              </p>
            </div>
          )}
        </SwipeReveal>

        <div style={{
          marginTop: 20,
          opacity: revealed ? 1 : 0,
          transform: revealed ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.3s, transform 0.3s",
          pointerEvents: revealed ? "auto" : "none",
        }}>
          <BigButton
            onClick={onNext}
            color={nextReady ? PALETTE.blue : "#C8C0B8"}
            disabled={!nextReady}
            style={{ transition: "background 0.4s, box-shadow 0.4s" }}
          >
            {!nextReady
              ? "Memorise your role…"
              : isLast ? "See who starts" : "Next player"}
          </BigButton>
        </div>
      </div>
    </Screen>
  );
}


function DiscussionBriefScreen({ starterName, categories, impostorCount, onStartDiscussion }) {
  const initialTimerMinutes = useRef(clampTimerMinutes(load()[TIMER_STORAGE_KEY]));
  const [selectedMinutes, setSelectedMinutes] = useState(initialTimerMinutes.current);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(initialTimerMinutes.current * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (!isRunning) return undefined;
    const timerId = window.setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          setIsPaused(false);
          setIsTimeUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [isRunning]);

  const handleMinuteChange = (delta) => {
    if (hasStarted) return;
    const nextMinutes = clampTimerMinutes(selectedMinutes + delta);
    setSelectedMinutes(nextMinutes);
    setTimeLeftSeconds(nextMinutes * 60);
    setIsTimeUp(false);
    setIsPaused(false);
    save({ [TIMER_STORAGE_KEY]: nextMinutes });
  };

  const handleStart = () => {
    if (timeLeftSeconds <= 0) return;
    setHasStarted(true);
    setIsPaused(false);
    setIsTimeUp(false);
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
    setIsPaused(true);
  };

  const handleResume = () => {
    if (timeLeftSeconds <= 0) return;
    setHasStarted(true);
    setIsPaused(false);
    setIsRunning(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setHasStarted(false);
    setIsTimeUp(false);
    setTimeLeftSeconds(selectedMinutes * 60);
    setShowResetConfirm(false);
  };

  const handleEndTimer = () => {
    setIsRunning(false);
    setIsPaused(false);
    setHasStarted(true);
    setTimeLeftSeconds(0);
    setIsTimeUp(true);
  };

  return (
    <Screen style={{ overflowY: "auto" }}>
      <div style={{ paddingTop: 28, paddingBottom: 8, textAlign: "center" }}>
        <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 30, color: PALETTE.text }}>
          Ready to play!
        </h2>
      </div>

      {/* Starting player hero card */}
      <div className="pop" style={{
        background: "linear-gradient(135deg, #FF6B6B, #C77DFF)",
        borderRadius: 22, padding: "18px 20px", textAlign: "center",
        marginBottom: 14, boxShadow: "0 8px 24px rgba(199,125,255,0.3)",
      }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.75)",
          textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>
          Starting Player
        </p>
        <p style={{ fontFamily: "'Fredoka One', cursive", fontSize: 38, color: "#FFF",
          textShadow: "2px 2px 0 rgba(0,0,0,0.15)", lineHeight: 1.1 }}>
          {starterName}
        </p>
      </div>

      {/* Categories this round */}
      <div style={{ background: "#FFF", borderRadius: 16, padding: "14px 16px",
        border: "2px solid #F0E8DC", marginBottom: 14 }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: PALETTE.muted,
          textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>
          Categories This Round
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {categories.map(cat => {
            const [c1, c2] = ["#FF6B6B", "#FF8E53"];
            return (
              <span key={cat} style={{
                background: "linear-gradient(135deg, " + c1 + ", " + c2 + ")",
                color: "#FFF", borderRadius: 50, padding: "6px 14px",
                fontSize: 14, fontWeight: 800, boxShadow: "0 3px 8px " + c1 + "44",
              }}>{cat}</span>
            );
          })}
        </div>
      </div>

      {/* Impostors this round */}
      <div style={{ background: "#FFF", borderRadius: 16, padding: "14px 16px",
        border: "2px solid #F0E8DC", marginBottom: 14 }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: PALETTE.muted,
          textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>
          Impostors This Round
        </p>
        <p style={{ color: PALETTE.text, fontWeight: 700, textAlign: "center", fontSize: 15 }}>
          There are <span style={{ color: PALETTE.primary }}>{impostorCount}</span> impostors among you
        </p>
      </div>

      <div style={{ background: "#FFF", borderRadius: 16, padding: "14px 16px",
        border: "2px solid #F0E8DC", marginBottom: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: PALETTE.muted,
          textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>
          TIMER
        </p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <button
            onClick={() => handleMinuteChange(-1)}
            disabled={hasStarted || selectedMinutes <= TIMER_MIN_MINUTES}
            style={{
              width: 34, height: 34, aspectRatio: "1 / 1", borderRadius: 9,
              background: hasStarted || selectedMinutes <= TIMER_MIN_MINUTES ? "#EEE" : PALETTE.primary,
              color: hasStarted || selectedMinutes <= TIMER_MIN_MINUTES ? "#AAA" : "#FFF",
              fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: hasStarted || selectedMinutes <= TIMER_MIN_MINUTES ? "none" : "0 3px 0 #CC4444",
            }}
          >
            −
          </button>
          <p style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: 52,
            lineHeight: 1,
            color: isTimeUp ? "#C0392B" : PALETTE.text,
            letterSpacing: 1,
          }}>
            {formatTimer(timeLeftSeconds)}
          </p>
          <button
            onClick={() => handleMinuteChange(1)}
            disabled={hasStarted || selectedMinutes >= TIMER_MAX_MINUTES}
            style={{
              width: 34, height: 34, aspectRatio: "1 / 1", borderRadius: 9,
              background: hasStarted || selectedMinutes >= TIMER_MAX_MINUTES ? "#EEE" : PALETTE.accent,
              color: hasStarted || selectedMinutes >= TIMER_MAX_MINUTES ? "#AAA" : "#FFF",
              fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: hasStarted || selectedMinutes >= TIMER_MAX_MINUTES ? "none" : "0 3px 0 #3A8A45",
            }}
          >
            +
          </button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          {isRunning ? (
            <PillButton color="#FF8E53" onClick={handlePause}>Pause</PillButton>
          ) : isPaused ? (
            <PillButton color={PALETTE.blue} onClick={handleResume}>Resume</PillButton>
          ) : timeLeftSeconds > 0 ? (
            <PillButton color={PALETTE.accent} onClick={handleStart}>Start timer</PillButton>
          ) : null}
          <PillButton color={PALETTE.muted} onClick={() => setShowResetConfirm(true)}>Reset timer</PillButton>
          <PillButton color={PALETTE.primary} onClick={handleEndTimer}>End timer</PillButton>
        </div>

        {isTimeUp && (
          <p style={{
            marginTop: 12,
            textAlign: "center",
            color: "#C0392B",
            fontSize: 15,
            fontWeight: 800,
          }}>
            Time is up! Time to vote! ⏰
          </p>
        )}
      </div>

      <div style={{ marginTop: "auto" }}>
        <BigButton onClick={onStartDiscussion} color={PALETTE.primary}>
          End Game
        </BigButton>
      </div>

      {showResetConfirm && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(45,45,45,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          zIndex: 10,
        }}>
          <div style={{
            width: "100%",
            maxWidth: 320,
            background: "#FFF",
            borderRadius: 16,
            border: "2px solid #F0E8DC",
            padding: "16px 14px",
            boxShadow: "0 14px 32px rgba(0,0,0,0.16)",
          }}>
            <p style={{
              textAlign: "center",
              fontFamily: "'Fredoka One', cursive",
              color: PALETTE.text,
              fontSize: 24,
              marginBottom: 14,
            }}>
              Reset timer?
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
              <PillButton color={PALETTE.muted} onClick={() => setShowResetConfirm(false)}>
                Cancel
              </PillButton>
              <PillButton color={PALETTE.primary} onClick={handleReset}>
                Reset
              </PillButton>
            </div>
          </div>
        </div>
      )}
    </Screen>
  );
}

function PostGameScreen({ onNewGame, onEditPlayers, onExit, everyoneWasImpostor }) {
  return (
    <Screen style={{ justifyContent: "center", alignItems: "center" }}>
      <div className="pop" style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontSize: 72, marginBottom: 8 }}>🎉</div>
        <Title>Round Over!</Title>
      </div>
      {everyoneWasImpostor && (
        <div style={{
          width: "100%",
          background: "#FFF",
          borderRadius: 16,
          border: `2px solid ${PALETTE.border}`,
          padding: "14px 16px",
          marginBottom: 14,
          textAlign: "center",
        }}>
          <p style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: 24,
            lineHeight: 1.2,
            color: PALETTE.text,
          }}>
            Everyone was the impostor!
          </p>
        </div>
      )}
      <div className="slide-up" style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
        <BigButton onClick={onNewGame} color={PALETTE.primary}>
          Play Again
        </BigButton>
        <OutlineButton onClick={onEditPlayers} color={PALETTE.blue}>
          Back
        </OutlineButton>
        <OutlineButton onClick={onExit} color={PALETTE.muted} small>
          Exit
        </OutlineButton>
      </div>
    </Screen>
  );
}

// ─── GAME STATE MACHINE ──────────────────────────────────────────────────────
// screens: home | players | categories | custom_word_banks | reveal_loop | discussion | postgame

export default function App() {
  const stored = load();
  const initialCustomWordBanks = loadCustomWordBanks();
  const hasPlayers = !!(stored.savedPlayers?.length);

  const [screen, setScreen] = useState("home");
  const [customWordBanksOrigin, setCustomWordBanksOrigin] = useState("categories");
  const [players, setPlayers] = useState(stored.savedPlayers || []);
  const [k, setK] = useState(stored.lastImpostorCount || 1);
  const [selectedCats, setSelectedCats] = useState(stored.lastSelectedCategories || []);
  const [customWordBanks, setCustomWordBanks] = useState(initialCustomWordBanks);
  const [selectedBuiltInCategories, setSelectedBuiltInCategories] = useState(() => {
    const storedBuiltIn = Array.isArray(stored.lastSelectedCategories) ? stored.lastSelectedCategories : [];
    return storedBuiltIn.filter((cat) => Object.prototype.hasOwnProperty.call(CATEGORIES, cat));
  });
  const [selectedCustomBankIds, setSelectedCustomBankIds] = useState(() => {
    const storedCustomIds = Array.isArray(stored.lastSelectedCustomBankIds) ? stored.lastSelectedCustomBankIds : [];
    const knownIds = new Set(initialCustomWordBanks.map((bank) => bank.id));
    return storedCustomIds.filter((id) => knownIds.has(id));
  });
  // runtime
  const [word, setWord] = useState("");
  const [impostorIds, setImpostorIds] = useState([]);
  const [startingId, setStartingId] = useState(0);
  const [revealIndex, setRevealIndex] = useState(0);
  const [phase, setPhase] = useState("pass");

  const toggleBuiltInCategory = useCallback((cat) => {
    setSelectedBuiltInCategories((prev) =>
      prev.includes(cat) ? prev.filter((entry) => entry !== cat) : [...prev, cat],
    );
  }, []);

  const toggleCustomBankSelection = useCallback((bankId) => {
    setSelectedCustomBankIds((prev) =>
      prev.includes(bankId) ? prev.filter((entry) => entry !== bankId) : [...prev, bankId],
    );
  }, []);

  const handleCreateCustomBank = useCallback(({ name, wordsInput }) => {
    setCustomWordBanks((prev) => {
      const next = createCustomWordBank(prev, { name, wordsInput });
      saveCustomWordBanks(next);
      return next;
    });
  }, []);

  const handleUpdateCustomBank = useCallback((id, { name, wordsInput }) => {
    setCustomWordBanks((prev) => {
      const next = updateCustomWordBank(prev, id, { name, wordsInput });
      saveCustomWordBanks(next);
      return next;
    });
  }, []);

  const handleDeleteCustomBank = useCallback((id) => {
    setCustomWordBanks((prev) => {
      const next = deleteCustomWordBank(prev, id);
      saveCustomWordBanks(next);
      return next;
    });
    setSelectedCustomBankIds((prev) => {
      const next = prev.filter((bankId) => bankId !== id);
      save({ lastSelectedCustomBankIds: next });
      return next;
    });
  }, []);

  const startRound = useCallback(() => {
    const selectedCustomBanks = customWordBanks.filter((bank) => selectedCustomBankIds.includes(bank.id));
    const pool = [
      ...selectedBuiltInCategories.flatMap((cat) => CATEGORIES[cat] || []),
      ...selectedCustomBanks.flatMap((bank) => bank.words),
    ];
    if (pool.length === 0) return;

    const chosenWord = pick(pool);
    const ids = Array.from({ length: players.length }, (_, i) => i);
    const everyoneImpostor = Math.random() < 0.02;
    const impostors = everyoneImpostor ? ids : pickN(ids, k);
    const starter = pick(ids);
    setSelectedCats([
      ...selectedBuiltInCategories,
      ...selectedCustomBanks.map((bank) => bank.name),
    ]);
    save({
      lastSelectedCategories: selectedBuiltInCategories,
      lastSelectedCustomBankIds: selectedCustomBankIds,
    });
    setWord(chosenWord);
    setImpostorIds(impostors);
    setStartingId(starter);
    setRevealIndex(0);
    setPhase("pass");
    setScreen("reveal_loop");
  }, [customWordBanks, k, players, selectedBuiltInCategories, selectedCustomBankIds]);

  if (screen === "home") return (
    <>
      <GlobalStyle />
      <HomeScreen
        hasPlayers={hasPlayers}
        onStart={() => setScreen("players")}
        onPlayAgain={() => setScreen("categories")}
        onOpenCustomWordBanks={() => {
          setCustomWordBanksOrigin("home");
          setScreen("custom_word_banks");
        }}
      />
    </>
  );

  if (screen === "players") return (
    <>
      <GlobalStyle />
      <PlayersScreen
        initial={{ n: players.length || 4, k }}
        onContinue={({ players: ps, k: ki }) => {
          setPlayers(ps); setK(ki);
          setScreen("categories");
        }}
        onBack={() => setScreen("home")}
      />
    </>
  );

  if (screen === "categories") return (
    <>
      <GlobalStyle />
      <CategoriesScreen
        selectedBuiltInCategories={selectedBuiltInCategories}
        selectedCustomBankIds={selectedCustomBankIds}
        customWordBanks={customWordBanks}
        onToggleBuiltInCategory={toggleBuiltInCategory}
        onToggleCustomBankSelection={toggleCustomBankSelection}
        onOpenCustomWordBanks={() => {
          setCustomWordBanksOrigin("categories");
          setScreen("custom_word_banks");
        }}
        onPlay={startRound}
        onBack={() => setScreen("players")}
      />
    </>
  );

  if (screen === "custom_word_banks") return (
    <>
      <GlobalStyle />
      <CustomWordBanksScreen
        banks={customWordBanks}
        selectedBankIds={customWordBanksOrigin === "categories" ? selectedCustomBankIds : []}
        selectable={customWordBanksOrigin === "categories"}
        nextDefaultName={getNextCustomWordBankName(customWordBanks)}
        onBack={() => setScreen(customWordBanksOrigin)}
        onToggleSelection={toggleCustomBankSelection}
        onCreateBank={handleCreateCustomBank}
        onUpdateBank={handleUpdateCustomBank}
        onDeleteBank={handleDeleteCustomBank}
      />
    </>
  );

  if (screen === "reveal_loop") {
    // All reveals done → go to discussion brief
    if (revealIndex >= players.length) return (
      <>
        <GlobalStyle />
        <DiscussionBriefScreen
          starterName={players[startingId]}
          categories={selectedCats}
          impostorCount={k}
          onStartDiscussion={() => setScreen("postgame")}
        />
      </>
    );

    const currentName = players[revealIndex];
    const isImpostor = impostorIds.includes(revealIndex);

    if (phase === "pass") return (
      <>
        <GlobalStyle />
        <PassScreen
          name={currentName}
          onReady={() => setPhase("reveal")}
        />
      </>
    );

    return (
      <>
        <GlobalStyle />
        <RevealScreen
          name={currentName}
          isImpostor={isImpostor}
          word={word}
          isLast={revealIndex === players.length - 1}
          onNext={() => {
            setRevealIndex(i => i + 1);
            setPhase("pass");
          }}
        />
      </>
    );
  }

  if (screen === "postgame") return (
    <>
      <GlobalStyle />
      <PostGameScreen
        onNewGame={() => setScreen("categories")}
        onEditPlayers={() => setScreen("players")}
        onExit={() => setScreen("home")}
        everyoneWasImpostor={impostorIds.length === players.length}
      />
    </>
  );

  return null;
}
