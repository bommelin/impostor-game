import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { CATEGORIES } from "./wordBank";
import {
  PREDEFINED_CUSTOM_WORD_BANK,
  PREDEFINED_CUSTOM_WORD_BANK_THEMES,
} from "./predefinedCustomWordBank";
import CustomWordBanksScreen from "./screens/CustomWordBanks";
import CreateCustomWordBankScreen from "./screens/CreateCustomWordBank";
import {
  CUSTOM_WORD_BANK_SORT_MODE_ORDER_OF_SAVING,
  CUSTOM_WORD_BANK_SORT_MODE_RECENTLY_PLAYED,
  DEFAULT_CUSTOM_WORD_BANK_SORT_MODE,
  loadCustomWordBanks,
  saveCustomWordBanks,
  getNextCustomWordBankName,
  createCustomWordBank,
  updateCustomWordBank,
  deleteCustomWordBank,
  normalizeCustomWordBankSortMode,
  sortCustomWordBanks,
} from "./customWordBanks";
import {
  formatCustomCategoriesForExport,
  IMPORT_EXPORT_FORMAT_EXAMPLE,
  normalizeCategoryNameKey,
  parseImportCategoriesInput,
} from "./importExportCategories";

// ─── STORAGE HELPERS ─────────────────────────────────────────────────────────
const STORAGE_KEY = "impostor_game_v1";
const CUSTOM_CATEGORIES_SORT_MODE_KEY = "customCategoriesSortMode";
const ALL_IMPOSTOR_COOLDOWN_KEY = "allImpostorCooldown";
const ALL_IMPOSTOR_COOLDOWN_MAX = 9;
const PLAYER_PRESETS_KEY = "playerPresets";
const PLAYER_PRESETS_SORT_MODE_KEY = "playerPresetsSortMode";
const PLAYER_PRESETS_LIMIT = 10;
const PLAYER_PRESETS_SORT_MODE_RECENTLY_PLAYED = "recently_played";
const PLAYER_PRESETS_SORT_MODE_RECENTLY_STORED = "recently_stored";
const DEFAULT_PLAYER_PRESETS_SORT_MODE = PLAYER_PRESETS_SORT_MODE_RECENTLY_STORED;
const MIN_PLAYER_COUNT = 2;
const MAX_PLAYER_COUNT = 12;
const load = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
};
let cachedStoredState = null;
const readStoredState = () => {
  if (cachedStoredState !== null) return cachedStoredState;
  cachedStoredState = load();
  return cachedStoredState;
};
const save = (data) => {
  try {
    const next = { ...readStoredState(), ...data };
    cachedStoredState = next;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
};
const clampAllImpostorCooldown = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) return 0;
  return Math.max(0, Math.min(ALL_IMPOSTOR_COOLDOWN_MAX, parsed));
};
const loadAllImpostorCooldown = () => {
  try {
    return clampAllImpostorCooldown(localStorage.getItem(ALL_IMPOSTOR_COOLDOWN_KEY));
  } catch {
    return 0;
  }
};
const saveAllImpostorCooldown = (value) => {
  try {
    localStorage.setItem(ALL_IMPOSTOR_COOLDOWN_KEY, String(clampAllImpostorCooldown(value)));
  } catch {}
};
const clampPlayerCount = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return MIN_PLAYER_COUNT;
  return Math.max(MIN_PLAYER_COUNT, Math.min(MAX_PLAYER_COUNT, Math.round(parsed)));
};
const clampImpostorCount = (value, playerCount) => {
  const maxImpostors = Math.max(1, clampPlayerCount(playerCount) - 1);
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.min(maxImpostors, Math.round(parsed)));
};
const sanitizePlayerNames = (names, playerCount) =>
  Array.from({ length: clampPlayerCount(playerCount) }, (_, i) =>
    typeof names?.[i] === "string" ? names[i] : "",
  );
const normalizePlayerPresetsSortMode = (mode) => (
  mode === PLAYER_PRESETS_SORT_MODE_RECENTLY_PLAYED || mode === PLAYER_PRESETS_SORT_MODE_RECENTLY_STORED
    ? mode
    : DEFAULT_PLAYER_PRESETS_SORT_MODE
);
const getPresetStoredAt = (preset) => {
  const updatedAt = Number(preset?.updatedAt);
  if (Number.isFinite(updatedAt)) return updatedAt;
  const createdAt = Number(preset?.createdAt);
  if (Number.isFinite(createdAt)) return createdAt;
  return 0;
};
const getPresetLastUsedAt = (preset) => {
  const lastUsedAt = Number(preset?.lastUsedAt);
  return Number.isFinite(lastUsedAt) ? lastUsedAt : null;
};
const sortPlayerPresets = (presets, mode = DEFAULT_PLAYER_PRESETS_SORT_MODE) => {
  const normalizedMode = normalizePlayerPresetsSortMode(mode);
  const list = [...presets];

  if (normalizedMode === PLAYER_PRESETS_SORT_MODE_RECENTLY_PLAYED) {
    return list.sort((a, b) => {
      const aLastUsedAt = getPresetLastUsedAt(a);
      const bLastUsedAt = getPresetLastUsedAt(b);
      if (aLastUsedAt === null && bLastUsedAt === null) {
        return getPresetStoredAt(b) - getPresetStoredAt(a);
      }
      if (aLastUsedAt === null) return 1;
      if (bLastUsedAt === null) return -1;
      if (bLastUsedAt !== aLastUsedAt) return bLastUsedAt - aLastUsedAt;
      return getPresetStoredAt(b) - getPresetStoredAt(a);
    });
  }

  return list.sort((a, b) => getPresetStoredAt(b) - getPresetStoredAt(a));
};
const parsePlayerPreset = (candidate) => {
  if (!candidate || typeof candidate !== "object") return null;
  if (typeof candidate.id !== "string" || candidate.id.trim() === "") return null;
  const playerCount = clampPlayerCount(candidate.playerCount);
  const players = sanitizePlayerNames(candidate.players, playerCount);
  const createdAt = Number.isFinite(Number(candidate.createdAt))
    ? Number(candidate.createdAt)
    : Date.now();
  const updatedAt = Number.isFinite(Number(candidate.updatedAt))
    ? Number(candidate.updatedAt)
    : createdAt;
  const lastUsedAt = Number.isFinite(Number(candidate.lastUsedAt))
    ? Number(candidate.lastUsedAt)
    : null;
  return {
    id: candidate.id,
    name: typeof candidate.name === "string" && candidate.name.trim() ? candidate.name : "Preset",
    players,
    playerCount,
    impostorCount: clampImpostorCount(candidate.impostorCount, playerCount),
    createdAt,
    updatedAt,
    lastUsedAt,
  };
};
const loadPlayerPresets = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(PLAYER_PRESETS_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    const parsed = raw.map(parsePlayerPreset).filter(Boolean).slice(0, PLAYER_PRESETS_LIMIT);
    return sortPlayerPresets(parsed, DEFAULT_PLAYER_PRESETS_SORT_MODE);
  } catch {
    return [];
  }
};
const savePlayerPresets = (presets) => {
  try {
    const sorted = sortPlayerPresets(presets, DEFAULT_PLAYER_PRESETS_SORT_MODE)
      .slice(0, PLAYER_PRESETS_LIMIT);
    localStorage.setItem(PLAYER_PRESETS_KEY, JSON.stringify(sorted));
  } catch {}
};
const uniqueString = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
};
const buildPresetName = (playerNames, playerCount) => {
  const safeNames = sanitizePlayerNames(playerNames, playerCount)
    .map((name, i) => name.trim() || `Player ${i + 1}`);
  const baseName = safeNames.length >= 2 ? `${safeNames[0]} + ${safeNames[1]}` : safeNames[0] || "Preset";
  return playerCount > 2 ? `${baseName} (${playerCount} players)` : baseName;
};
const createPlayersSetupDraft = ({ names, playerCount, impostorCount }) => {
  const nextPlayerCount = clampPlayerCount(playerCount ?? names?.length ?? 4);
  return {
    n: nextPlayerCount,
    k: clampImpostorCount(impostorCount, nextPlayerCount),
    names: sanitizePlayerNames(names, nextPlayerCount),
  };
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
    button { font-family: 'Fredoka One', cursive; cursor: pointer; border: none; }
    button:focus-visible {
      outline: 3px solid #4ECDC4;
      outline-offset: 2px;
    }
    .btn-pressable {
      cursor: pointer;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
      transition: transform 80ms ease, box-shadow 80ms ease, filter 80ms ease, opacity 80ms ease;
    }
    .btn-pressable:active {
      transform: translateY(2px) !important;
      box-shadow: none !important;
      filter: brightness(0.98);
    }
    .btn-pressable:disabled,
    .btn-pressable[aria-disabled="true"] {
      cursor: not-allowed;
      opacity: 0.5;
      transform: none !important;
      box-shadow: none !important;
      filter: none;
    }

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
    .buttonDisabled {
      opacity: 0.7;
      cursor: not-allowed !important;
      box-shadow: none !important;
    }
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

function BigButton({ children, onClick, color = PALETTE.primary, style, disabled, small, className }) {
  const buttonClassName = className ? `btn-pressable ${className}` : "btn-pressable";
  return (
    <button
      type="button"
      className={buttonClassName}
      disabled={disabled}
      onClick={onClick}
      style={{
        background: disabled ? "#DDD" : color,
        color: disabled ? "#AAA" : "#FFF",
        fontSize: small ? 16 : 20,
        padding: small ? "12px 20px" : "16px 24px",
        borderRadius: 18,
        width: "100%",
        boxShadow: disabled ? "none" : `0 5px 0 ${darken(color)}`,
        letterSpacing: 0.5,
        minHeight: 44,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function OutlineButton({ children, onClick, color = PALETTE.primary, style, small, disabled }) {
  return (
    <button
      type="button"
      className="btn-pressable"
      disabled={disabled}
      onClick={onClick}
      style={{
        background: "transparent",
        color: disabled ? "#AAA" : color,
        fontSize: small ? 15 : 18,
        padding: small ? "10px 16px" : "14px 20px",
        borderRadius: 16,
        width: "100%",
        border: `2.5px solid ${disabled ? "#DDD" : color}`,
        letterSpacing: 0.3,
        minHeight: 44,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function BackButton({ onClick, style }) {
  return (
    <OutlineButton onClick={onClick} color={PALETTE.muted} small style={style}>
      Back
    </OutlineButton>
  );
}

function PillButton({ children, onClick, color = PALETTE.primary, disabled, style }) {
  return (
    <button
      type="button"
      className="btn-pressable"
      disabled={disabled}
      onClick={onClick}
      style={{
        borderRadius: 999,
        padding: "8px 14px",
        fontSize: 13,
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 800,
        background: disabled ? "#E7E7E7" : color,
        color: disabled ? "#AAA" : "#FFF",
        letterSpacing: 0.2,
        boxShadow: disabled ? "none" : `0 3px 0 ${darken(color)}`,
        minHeight: 34,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function Chip({ label, selected, onClick }) {
  const [c1, c2] = CATEGORY_COLORS[label] || ["#FF6B6B", "#FF8E53"];
  return (
    <button
      type="button"
      className="btn-pressable category-tile"
      onClick={onClick}
      style={{
        padding: "10px 8px",
        borderRadius: 14,
        fontSize: 14,
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 700,
        border: `3px solid ${selected ? c1 : "#E0D6CC"}`,
        background: selected ? `linear-gradient(135deg, ${c1}, ${c2})` : "#FFF",
        color: selected ? "#FFF" : PALETTE.muted,
        transition: "all 0.2s",
        transform: selected ? "scale(1.04)" : "scale(1)",
        boxShadow: selected ? `0 4px 12px ${c1}55` : "none",
        whiteSpace: "normal",
        letterSpacing: 0.2,
        width: "100%",
        minHeight: 58,
        lineHeight: 1.2,
        overflow: "hidden",
        textOverflow: "ellipsis",
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
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
        <button type="button" className="btn-pressable" onClick={onDec} disabled={disableDec} style={{
          width: 38, height: 38, aspectRatio: "1 / 1", borderRadius: 10,
          background: disableDec ? "#EEE" : PALETTE.primary,
          color: disableDec ? "#AAA" : "#FFF",
          fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: disableDec ? "none" : "0 3px 0 #CC4444",
        }}>−</button>
        <span style={{ fontSize: 22, fontFamily: "'Fredoka One', cursive", minWidth: 24, textAlign: "center" }}>{value}</span>
        <button type="button" className="btn-pressable" onClick={onInc} disabled={disableInc} style={{
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

function AppModal({ children, maxWidth = 360 }) {
  return (
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
        maxWidth,
        maxHeight: "calc(100dvh - 40px)",
        overflowY: "auto",
        background: "#FFF",
        borderRadius: 16,
        border: "2px solid #F0E8DC",
        padding: "16px 14px",
        boxShadow: "0 14px 32px rgba(0,0,0,0.16)",
      }}>
        {children}
      </div>
    </div>
  );
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

function HomeScreen({
  onStart,
  onPlayAgain,
  onOpenCustomWordBanks,
  hasPlayers,
}) {
  const getInstallHint = () => {
    if (typeof window === "undefined" || typeof navigator === "undefined") return null;

    const userAgent = window.navigator.userAgent || "";
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent) && !window.MSStream;
    const isAndroid = /Android/i.test(userAgent);
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      window.navigator.standalone === true;

    if (isStandalone) return null;
    if (isIOS) return "Safari → Share → Add to Home Screen.";
    if (isAndroid) return "Chrome → Menu → Add to Home screen (or Install app).";
    return null;
  };

  const hintText = getInstallHint();

  return (
    <Screen style={{ justifyContent: "center", alignItems: "center", gap: 0, overflowX: "hidden" }}>
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
          More Categories
        </BigButton>
        {hintText && (
          <div
            style={{
              width: "100%",
              marginTop: 8,
              marginBottom: 22,
              padding: "12px 14px",
              borderRadius: 18,
              background: "#F1F1F1",
              color: "#737373",
              fontSize: "0.8rem",
              lineHeight: 1.35,
              fontWeight: 600,
              textAlign: "center",
            }}
          >
            <span style={{ display: "block", color: "#5B5B5B", fontWeight: 800 }}>
              💡 Tip: For a better experience, do the following:
            </span>
            <span style={{ display: "block", color: "#585858", fontSize: "0.78rem" }}>
              {hintText}
            </span>
          </div>
        )}
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
          fontSize: 13,
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

function PlayersScreen({ draft, onDraftChange, onContinue, onOpenPresets, onBack }) {
  const n = clampPlayerCount(draft?.n);
  const names = sanitizePlayerNames(draft?.names, n);
  const k = clampImpostorCount(draft?.k, n);

  const setDraft = (updater) => {
    onDraftChange((prevRaw) => {
      const prev = createPlayersSetupDraft({
        playerCount: prevRaw?.n ?? n,
        impostorCount: prevRaw?.k ?? k,
        names: prevRaw?.names ?? names,
      });
      const candidate = typeof updater === "function" ? updater(prev) : updater;
      return createPlayersSetupDraft({
        playerCount: candidate?.n ?? prev.n,
        impostorCount: candidate?.k ?? prev.k,
        names: candidate?.names ?? prev.names,
      });
    });
  };

  const setN = (nextN) => {
    setDraft((prev) => {
      const prevN = clampPlayerCount(prev.n);
      const prevK = clampImpostorCount(prev.k, prevN);
      const resolvedN = typeof nextN === "function" ? nextN(prevN) : nextN;
      const nextNClamped = clampPlayerCount(resolvedN);
      const nextMaxK = Math.max(1, nextNClamped - 1);
      return {
        ...prev,
        n: nextNClamped,
        k: prevK > nextMaxK ? nextMaxK : prevK,
      };
    });
  };

  const setK = (nextK) => {
    setDraft((prev) => ({ ...prev, k: typeof nextK === "function" ? nextK(prev.k) : nextK }));
  };

  const setNames = (nextNames) => {
    setDraft((prev) => ({ ...prev, names: typeof nextNames === "function" ? nextNames(prev.names) : nextNames }));
  };

  useEffect(() => {
    setK((value) => Math.min(value, n - 1));
  }, [n]);

  useEffect(() => {
    save({
      savedPlayers: sanitizePlayerNames(draft?.names, n),
      lastPlayerCount: n,
      lastImpostorCount: k,
    });
  }, [draft?.names, k, n]);

  const finalNames = names.map((name, i) => name.trim() || `Player ${i + 1}`);

  const handleContinue = () => {
    save({ savedPlayers: finalNames, lastPlayerCount: n, lastImpostorCount: k });
    onContinue({ players: finalNames, k });
  };

  return (
    <Screen>
      <div style={{ paddingTop: 24, marginBottom: 16 }}>
        <Title>Choose players</Title>
      </div>
      <Counter
        label="Players"
        value={n}
        onDec={() => setN((value) => Math.max(MIN_PLAYER_COUNT, value - 1))}
        onInc={() => setN((value) => Math.min(MAX_PLAYER_COUNT, value + 1))}
        disableDec={n <= MIN_PLAYER_COUNT}
        disableInc={n >= MAX_PLAYER_COUNT}
      />
      <Counter
        label="Impostors"
        value={k}
        onDec={() => setK((value) => Math.max(value - 1, 1))}
        onInc={() => setK((value) => Math.min(value + 1, n - 1))}
        disableDec={k <= 1}
        disableInc={k >= n - 1}
      />
      <div style={{
        background: "#FFF",
        borderRadius: 16,
        padding: 16,
        border: `2px solid ${PALETTE.border}`,
        marginTop: 4,
        marginBottom: 16,
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 12,
        }}>
          <p style={{
            fontWeight: 800,
            fontSize: 14,
            color: PALETTE.muted,
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 0,
          }}>
            Name your players
          </p>
          <PillButton
            color={PALETTE.muted}
            onClick={onOpenPresets}
            style={{
              padding: "6px 12px",
              fontSize: 12,
              boxShadow: "0 3px 0 #4A4A4A",
            }}
          >
            Saved presets
          </PillButton>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {names.map((name, i) => (
            <input
              key={i}
              value={name}
              onChange={(e) => setNames((prev) => prev.map((value, index) => (
                index === i ? e.target.value : value
              )))}
              placeholder={`Player ${i + 1}`}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                border: `2px solid ${PALETTE.border}`,
                outline: "none",
                background: PALETTE.bg,
                color: PALETTE.text,
              }}
            />
          ))}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: "auto" }}>
        <BigButton onClick={handleContinue} color={PALETTE.primary}>Continue</BigButton>
        <OutlineButton onClick={onBack} color={PALETTE.muted} small>Back</OutlineButton>
      </div>
    </Screen>
  );
}

function PlayerPresetsScreen({ draft, onDraftChange, onBack }) {
  const [presets, setPresets] = useState(() => loadPlayerPresets());
  const [sortMode, setSortMode] = useState(() =>
    normalizePlayerPresetsSortMode(
      readStoredState()[PLAYER_PRESETS_SORT_MODE_KEY] || DEFAULT_PLAYER_PRESETS_SORT_MODE,
    ),
  );
  const [infoModal, setInfoModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [editingPreset, setEditingPreset] = useState(null);

  const persistPresets = useCallback((nextPresets) => {
    const normalized = nextPresets
      .map(parsePlayerPreset)
      .filter(Boolean)
      .slice(0, PLAYER_PRESETS_LIMIT);
    const sortedForStorage = sortPlayerPresets(normalized, DEFAULT_PLAYER_PRESETS_SORT_MODE);
    setPresets(sortedForStorage);
    savePlayerPresets(sortedForStorage);
    return sortedForStorage;
  }, []);

  const sortedPresets = useMemo(
    () => sortPlayerPresets(presets, sortMode),
    [presets, sortMode],
  );

  const confirmPreset = confirmModal?.presetId
    ? presets.find((preset) => preset.id === confirmModal.presetId) || null
    : null;
  const hasPresets = presets.length > 0;
  const playerCount = clampPlayerCount(draft?.n);
  const playerNames = sanitizePlayerNames(draft?.names, playerCount);
  const impostorCount = clampImpostorCount(draft?.k, playerCount);

  const handleSortModeChange = (nextSortMode) => {
    const normalizedMode = normalizePlayerPresetsSortMode(nextSortMode);
    setSortMode(normalizedMode);
    save({ [PLAYER_PRESETS_SORT_MODE_KEY]: normalizedMode });
  };

  const handleSaveCurrentAsPreset = () => {
    if (presets.length >= PLAYER_PRESETS_LIMIT) {
      setInfoModal({
        title: "Preset limit reached",
        body: "You can save up to 10 presets. Delete one to add a new preset.",
      });
      return;
    }

    const now = Date.now();
    const nextPreset = {
      id: uniqueString(),
      name: buildPresetName(playerNames, playerCount),
      players: playerNames,
      playerCount,
      impostorCount,
      createdAt: now,
      updatedAt: now,
      lastUsedAt: null,
    };
    persistPresets([nextPreset, ...presets]);
  };

  const openEditPreset = (preset) => {
    const nextPlayerCount = clampPlayerCount(preset.playerCount);
    setEditingPreset({
      id: preset.id,
      name: preset.name,
      playerCount: nextPlayerCount,
      impostorCount: clampImpostorCount(preset.impostorCount, nextPlayerCount),
      players: sanitizePlayerNames(preset.players, nextPlayerCount),
    });
  };

  const handleEditPlayerCount = (delta) => {
    setEditingPreset((prev) => {
      if (!prev) return prev;
      const nextPlayerCount = clampPlayerCount(prev.playerCount + delta);
      return {
        ...prev,
        playerCount: nextPlayerCount,
        players: sanitizePlayerNames(prev.players, nextPlayerCount),
        impostorCount: clampImpostorCount(prev.impostorCount, nextPlayerCount),
      };
    });
  };

  const handleEditImpostorCount = (delta) => {
    setEditingPreset((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        impostorCount: clampImpostorCount(prev.impostorCount + delta, prev.playerCount),
      };
    });
  };

  const handleSaveEditedPreset = () => {
    if (!editingPreset) return;

    const existingPreset = presets.find((preset) => preset.id === editingPreset.id);
    const nextPlayerCount = clampPlayerCount(editingPreset.playerCount);
    const nextPlayers = sanitizePlayerNames(editingPreset.players, nextPlayerCount);
    const updatedPreset = {
      id: editingPreset.id,
      name: editingPreset.name.trim() || buildPresetName(nextPlayers, nextPlayerCount),
      players: nextPlayers,
      playerCount: nextPlayerCount,
      impostorCount: clampImpostorCount(editingPreset.impostorCount, nextPlayerCount),
      createdAt: existingPreset?.createdAt || Date.now(),
      updatedAt: Date.now(),
      lastUsedAt: existingPreset?.lastUsedAt ?? null,
    };

    persistPresets(
      presets.map((preset) => (preset.id === updatedPreset.id ? updatedPreset : preset)),
    );
    setEditingPreset(null);
  };

  const handleConfirmLoadPreset = () => {
    if (!confirmPreset) {
      setConfirmModal(null);
      return;
    }

    const loadedAt = Date.now();
    const nextPlayerCount = clampPlayerCount(confirmPreset.playerCount);
    const nextImpostorCount = clampImpostorCount(confirmPreset.impostorCount, nextPlayerCount);
    const nextNames = sanitizePlayerNames(confirmPreset.players, nextPlayerCount);
    const updatedPreset = { ...confirmPreset, lastUsedAt: loadedAt };
    persistPresets(
      presets.map((preset) => (preset.id === updatedPreset.id ? updatedPreset : preset)),
    );
    onDraftChange(createPlayersSetupDraft({
      playerCount: nextPlayerCount,
      impostorCount: nextImpostorCount,
      names: nextNames,
    }));
    setConfirmModal(null);
    onBack();
  };

  const handleConfirmDeletePreset = () => {
    if (!confirmPreset) {
      setConfirmModal(null);
      return;
    }
    persistPresets(presets.filter((preset) => preset.id !== confirmPreset.id));
    setConfirmModal(null);
  };

  const handleConfirmClearAll = () => {
    persistPresets([]);
    setConfirmModal(null);
  };

  return (
    <Screen>
      <div style={{ paddingTop: 24, marginBottom: 20 }}>
        <Title>Player Presets</Title>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
        <BigButton onClick={handleSaveCurrentAsPreset} color="#FF8E53">
          Save current as preset
        </BigButton>
        <BackButton onClick={onBack} />
      </div>

      <div style={{
        background: "#FFF",
        borderRadius: 16,
        border: `2px solid ${PALETTE.border}`,
        padding: 12,
        marginBottom: 14,
        flex: 1,
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            minWidth: 0,
          }}>
            <select
              value={sortMode}
              onChange={(e) => handleSortModeChange(e.target.value)}
              style={{
                borderRadius: 999,
                border: `2px solid ${PALETTE.border}`,
                background: "#FFF",
                color: PALETTE.text,
                fontSize: 13,
                fontWeight: 700,
                padding: "6px 10px",
                minWidth: 148,
                flex: 1,
                textAlign: "center",
                textAlignLast: "center",
              }}
            >
              <option value={PLAYER_PRESETS_SORT_MODE_RECENTLY_PLAYED}>
                Recently played
              </option>
              <option value={PLAYER_PRESETS_SORT_MODE_RECENTLY_STORED}>
                Recently stored
              </option>
            </select>
            <PillButton
              disabled={!hasPresets}
              color={PALETTE.primary}
              onClick={() => setConfirmModal({ type: "clear_all" })}
              style={{ padding: "6px 12px", fontSize: 12, whiteSpace: "nowrap" }}
            >
              Clear all
            </PillButton>
          </div>
        </div>

        {sortedPresets.length === 0 ? (
          <p style={{ textAlign: "center", color: "#AAA", fontWeight: 700, padding: "8px 0" }}>
            No presets saved yet.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sortedPresets.map((preset) => (
              <div
                key={preset.id}
                style={{
                  borderRadius: 12,
                  border: `2px solid ${PALETTE.border}`,
                  padding: "10px 10px 9px",
                  background: "#FFF",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div>
                  <p style={{ fontSize: 16, fontWeight: 800, color: PALETTE.text, lineHeight: 1.2 }}>
                    {preset.name}
                  </p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: PALETTE.muted, marginTop: 2 }}>
                    {preset.playerCount} players • {preset.impostorCount} impostor{preset.impostorCount === 1 ? "" : "s"}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <PillButton
                    color={PALETTE.accent}
                    onClick={() => setConfirmModal({ type: "load", presetId: preset.id })}
                    style={{ padding: "6px 12px", fontSize: 12 }}
                  >
                    Load
                  </PillButton>
                  <PillButton
                    color={PALETTE.blue}
                    onClick={() => openEditPreset(preset)}
                    style={{ padding: "6px 12px", fontSize: 12 }}
                  >
                    Edit
                  </PillButton>
                  <PillButton
                    color={PALETTE.primary}
                    onClick={() => setConfirmModal({ type: "delete", presetId: preset.id })}
                    style={{ padding: "6px 12px", fontSize: 12 }}
                  >
                    Delete
                  </PillButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {infoModal && (
        <AppModal>
          <p style={{
            textAlign: "center",
            fontFamily: "'Fredoka One', cursive",
            color: PALETTE.text,
            fontSize: 24,
            marginBottom: 10,
            lineHeight: 1.2,
          }}>
            {infoModal.title}
          </p>
          <p style={{
            textAlign: "center",
            color: PALETTE.muted,
            fontWeight: 700,
            fontSize: 14,
            lineHeight: 1.35,
            marginBottom: 12,
          }}>
            {infoModal.body}
          </p>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <PillButton color={PALETTE.primary} onClick={() => setInfoModal(null)}>
              OK
            </PillButton>
          </div>
        </AppModal>
      )}

      {confirmModal?.type === "load" && confirmPreset && (
        <AppModal>
          <p style={{
            textAlign: "center",
            fontFamily: "'Fredoka One', cursive",
            color: PALETTE.text,
            fontSize: 24,
            marginBottom: 10,
          }}>
            Load preset?
          </p>
          <p style={{
            textAlign: "center",
            color: PALETTE.muted,
            fontWeight: 700,
            fontSize: 14,
            marginBottom: 12,
            lineHeight: 1.35,
          }}>
            This will replace your current players and impostor count.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
            <PillButton color={PALETTE.muted} onClick={() => setConfirmModal(null)}>
              Cancel
            </PillButton>
            <PillButton color={PALETTE.primary} onClick={handleConfirmLoadPreset}>
              Load
            </PillButton>
          </div>
        </AppModal>
      )}

      {confirmModal?.type === "delete" && confirmPreset && (
        <AppModal>
          <p style={{
            textAlign: "center",
            fontFamily: "'Fredoka One', cursive",
            color: PALETTE.text,
            fontSize: 24,
            marginBottom: 10,
          }}>
            Delete preset?
          </p>
          <p style={{
            textAlign: "center",
            color: PALETTE.muted,
            fontWeight: 700,
            fontSize: 14,
            marginBottom: 12,
            lineHeight: 1.35,
          }}>
            This cannot be undone.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
            <PillButton color={PALETTE.muted} onClick={() => setConfirmModal(null)}>
              Cancel
            </PillButton>
            <PillButton color={PALETTE.primary} onClick={handleConfirmDeletePreset}>
              Delete
            </PillButton>
          </div>
        </AppModal>
      )}

      {confirmModal?.type === "clear_all" && (
        <AppModal>
          <p style={{
            textAlign: "center",
            fontFamily: "'Fredoka One', cursive",
            color: PALETTE.text,
            fontSize: 24,
            marginBottom: 10,
            lineHeight: 1.2,
          }}>
            Clear all presets?
          </p>
          <p style={{
            textAlign: "center",
            color: PALETTE.muted,
            fontWeight: 700,
            fontSize: 14,
            lineHeight: 1.35,
            marginBottom: 14,
          }}>
            This will permanently delete all saved presets.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
            <PillButton color={PALETTE.muted} onClick={() => setConfirmModal(null)}>
              Cancel
            </PillButton>
            <PillButton color={PALETTE.primary} onClick={handleConfirmClearAll}>
              Clear
            </PillButton>
          </div>
        </AppModal>
      )}

      {editingPreset && (
        <AppModal maxWidth={440}>
          <div style={{
            height: "min(680px, calc(100dvh - 72px))",
            display: "flex",
            flexDirection: "column",
          }}>
            <p style={{
              textAlign: "center",
              fontFamily: "'Fredoka One', cursive",
              color: PALETTE.text,
              fontSize: 24,
              marginBottom: 12,
            }}>
              Edit preset
            </p>
            <div style={{ marginBottom: 10 }}>
              <p style={{
                fontWeight: 800,
                fontSize: 12,
                color: PALETTE.muted,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 6,
              }}>
                Preset name
              </p>
              <input
                value={editingPreset.name}
                onChange={(e) => setEditingPreset((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                placeholder="Preset name"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 700,
                  border: `2px solid ${PALETTE.border}`,
                  outline: "none",
                  background: PALETTE.bg,
                  color: PALETTE.text,
                }}
              />
            </div>
            <Counter
              label="Players"
              value={editingPreset.playerCount}
              onDec={() => handleEditPlayerCount(-1)}
              onInc={() => handleEditPlayerCount(1)}
              disableDec={editingPreset.playerCount <= MIN_PLAYER_COUNT}
              disableInc={editingPreset.playerCount >= MAX_PLAYER_COUNT}
            />
            <Counter
              label="Impostors"
              value={editingPreset.impostorCount}
              onDec={() => handleEditImpostorCount(-1)}
              onInc={() => handleEditImpostorCount(1)}
              disableDec={editingPreset.impostorCount <= 1}
              disableInc={editingPreset.impostorCount >= editingPreset.playerCount - 1}
            />
            <div style={{
              background: "#FFF",
              borderRadius: 12,
              border: `2px solid ${PALETTE.border}`,
              padding: 10,
              overflowY: "auto",
              marginBottom: 12,
              flex: 1,
              minHeight: 0,
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {editingPreset.players.map((name, i) => (
                  <input
                    key={`${editingPreset.id}_${i}`}
                    value={name}
                    onChange={(e) => setEditingPreset((prev) => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        players: prev.players.map((entry, index) => (index === i ? e.target.value : entry)),
                      };
                    })}
                    placeholder={`Player ${i + 1}`}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 10,
                      fontSize: 16,
                      fontWeight: 600,
                      border: `2px solid ${PALETTE.border}`,
                      outline: "none",
                      background: PALETTE.bg,
                      color: PALETTE.text,
                    }}
                  />
                ))}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
              <PillButton color={PALETTE.muted} onClick={() => setEditingPreset(null)}>
                Cancel
              </PillButton>
              <PillButton color={PALETTE.primary} onClick={handleSaveEditedPreset}>
                Save
              </PillButton>
            </div>
          </div>
        </AppModal>
      )}
    </Screen>
  );
}

function CategoriesScreen({
  selectedBuiltInCategories,
  enabledCustomBankIds,
  selectedCustomBankIds,
  customWordBanks,
  onToggleBuiltInCategory,
  onToggleCustomBankSelection,
  onOpenCustomWordBanks,
  onPlay,
  onBack,
}) {
  const allCats = Object.keys(CATEGORIES);
  const enabledCustomBanks = customWordBanks.filter((bank) => enabledCustomBankIds.includes(bank.id));
  const categoryTiles = [
    ...allCats.map((cat) => ({
      key: `built_in_${cat}`,
      label: cat,
      selected: selectedBuiltInCategories.includes(cat),
      onClick: () => onToggleBuiltInCategory(cat),
    })),
    ...enabledCustomBanks.map((bank) => ({
      key: `custom_${bank.id}`,
      label: bank.name,
      selected: selectedCustomBankIds.includes(bank.id),
      onClick: () => onToggleCustomBankSelection(bank.id),
    })),
  ];
  const selectedCustomBanks = enabledCustomBanks.filter((bank) => selectedCustomBankIds.includes(bank.id));
  const selectedEntries = [
    ...selectedBuiltInCategories.map((cat) => ({ id: `built_in_${cat}`, label: cat, words: CATEGORIES[cat] || [] })),
    ...selectedCustomBanks.map((bank) => ({ id: bank.id, label: bank.name, words: bank.words })),
  ];
  const totalWords = selectedEntries.reduce((sum, entry) => sum + entry.words.length, 0);

  return (
    <Screen>
      <style>{`
        .categories-tile-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }
        @media (max-width: 339px) {
          .categories-tile-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
      <div style={{ paddingTop: 24, marginBottom: 20 }}>
        <Title sub="Pick one or more categories">Choose Category</Title>
      </div>
      <div className="categories-tile-grid" style={{ marginBottom: 20 }}>
        {categoryTiles.map((tile) => (
          <Chip
            key={tile.key}
            label={tile.label}
            selected={tile.selected}
            onClick={tile.onClick}
          />
        ))}
      </div>

      <div style={{ marginBottom: 12 }}>
        <BigButton onClick={onOpenCustomWordBanks} color="#FF8E53" small>
          More Categories
        </BigButton>
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
                const previewText = entry.words.slice(0, 3).join(", ");
                return (
                  <div key={entry.id} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap" }}>
                    <span style={{
                      fontSize: 12, fontWeight: 800, color: c1,
                      textTransform: "uppercase", letterSpacing: 0.8, minWidth: 80, flexShrink: 0,
                    }}>{entry.label}</span>
                    <span style={{
                      background: PALETTE.bg,
                      borderRadius: 8,
                      padding: "3px 9px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: PALETTE.muted,
                      flex: 1,
                      minWidth: 0,
                      maxWidth: "100%",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {previewText || "No words yet"}
                    </span>
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

function SelectCustomWordBanksScreen({
  banks,
  draftEnabledBankIds,
  baselineEnabledBankIds,
  sortMode,
  onDraftEnabledBankIdsChange,
  onSortModeChange,
  onApply,
  onOpenCustomWordBanks,
  onBack,
}) {
  const selectedCategories = Array.isArray(draftEnabledBankIds) ? draftEnabledBankIds : [];
  const baselineCategories = Array.isArray(baselineEnabledBankIds) ? baselineEnabledBankIds : [];
  const hasSelectionChanges = useMemo(() => {
    const selectedSet = new Set(selectedCategories);
    const baselineSet = new Set(baselineCategories);
    if (selectedSet.size !== baselineSet.size) return true;
    for (const id of selectedSet) {
      if (!baselineSet.has(id)) return true;
    }
    return false;
  }, [baselineCategories, selectedCategories]);
  const handleAddCategories = () => onApply(selectedCategories);
  const hasBanks = banks.length > 0;
  const allBanksSelected = hasBanks && banks.every((bank) => selectedCategories.includes(bank.id));

  const toggleBank = (bankId) => {
    onDraftEnabledBankIdsChange((prev) =>
      prev.includes(bankId) ? prev.filter((entry) => entry !== bankId) : [...prev, bankId],
    );
  };

  const handleSelectAll = () => {
    if (!hasBanks) return;
    onDraftEnabledBankIdsChange(banks.map((bank) => bank.id));
  };

  const handleDeselectAll = () => {
    if (!hasBanks) return;
    onDraftEnabledBankIdsChange([]);
  };

  return (
    <Screen>
      <div style={{ paddingTop: 24, marginBottom: 20 }}>
        <Title>Select more categories</Title>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
        <BigButton
          disabled={!hasSelectionChanges}
          onClick={handleAddCategories}
          color="#FF8E53"
        >
          Update category selection
        </BigButton>
        <BigButton onClick={onOpenCustomWordBanks} color={PALETTE.blue}>
          Create & browse categories
        </BigButton>
        <OutlineButton onClick={onBack} color={PALETTE.muted} small>
          Back
        </OutlineButton>
      </div>

      <div style={{
        background: "#FFF",
        borderRadius: 16,
        border: `2px solid ${PALETTE.border}`,
        padding: 12,
        marginBottom: 14,
        flex: 1,
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}>
          <select
            aria-label="Sort categories"
            value={sortMode}
            onChange={(e) => onSortModeChange(e.target.value)}
            style={{
              borderRadius: 999,
              border: `2px solid ${PALETTE.border}`,
              background: "#FFF",
              color: PALETTE.text,
              fontSize: 12,
              fontWeight: 700,
              padding: "5px 8px",
              minWidth: 0,
              width: "100%",
              flex: 1,
            }}
          >
            <option value={CUSTOM_WORD_BANK_SORT_MODE_RECENTLY_PLAYED}>
              Recently played
            </option>
            <option value={CUSTOM_WORD_BANK_SORT_MODE_ORDER_OF_SAVING}>
              Order of saving
            </option>
          </select>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <PillButton
              color={PALETTE.muted}
              disabled={!hasBanks || allBanksSelected}
              onClick={handleSelectAll}
              style={{
                padding: "4px 8px",
                fontSize: 10,
                lineHeight: 1.1,
                whiteSpace: "nowrap",
                flexShrink: 0,
                boxShadow: !hasBanks || allBanksSelected ? "none" : "0 3px 0 #4A4A4A",
                cursor: !hasBanks || allBanksSelected ? "not-allowed" : "pointer",
              }}
            >
              Select all
            </PillButton>
            <PillButton
              color={PALETTE.muted}
              disabled={!hasBanks || selectedCategories.length === 0}
              onClick={handleDeselectAll}
              style={{
                padding: "4px 8px",
                fontSize: 10,
                lineHeight: 1.1,
                whiteSpace: "nowrap",
                flexShrink: 0,
                boxShadow: !hasBanks || selectedCategories.length === 0 ? "none" : "0 3px 0 #4A4A4A",
                cursor: !hasBanks || selectedCategories.length === 0 ? "not-allowed" : "pointer",
              }}
            >
              Deselect all
            </PillButton>
          </div>
        </div>

        {banks.length === 0 ? (
          <p style={{ textAlign: "center", color: "#BBB", fontWeight: 700, padding: "10px 0" }}>
            No custom categories available. Create your own or browse predefined categories using the button above or from the Home screen.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {banks.map((bank) => {
              const isSelected = selectedCategories.includes(bank.id);
              return (
                <button
                  type="button"
                  className="btn-pressable"
                  key={bank.id}
                  onClick={() => toggleBank(bank.id)}
                  style={{
                    width: "100%",
                    borderRadius: 12,
                    border: `2px solid ${isSelected ? PALETTE.primary : PALETTE.border}`,
                    background: isSelected ? "#FFF0F0" : "#FFF",
                    padding: "10px 12px",
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 800, fontSize: 16, color: PALETTE.text }}>
                      {bank.name}
                    </p>
                    <p style={{ fontSize: 12, color: PALETTE.muted, fontWeight: 700 }}>
                      {bank.words.length} word{bank.words.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: isSelected ? PALETTE.primary : "#AAA" }}>
                    {isSelected ? "Selected" : "Tap to select"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Screen>
  );
}

function ImportExportCategoriesScreen({ banks, onImportCategories, onBack }) {
  const [selectedExportIds, setSelectedExportIds] = useState([]);
  const [importText, setImportText] = useState("");
  const [exportFeedback, setExportFeedback] = useState({ type: "", message: "" });
  const [importFeedback, setImportFeedback] = useState({ type: "", message: "" });
  const [overwriteSession, setOverwriteSession] = useState(null);

  useEffect(() => {
    const knownIds = new Set(banks.map((bank) => bank.id));
    setSelectedExportIds((prev) => prev.filter((bankId) => knownIds.has(bankId)));
  }, [banks]);

  useEffect(() => {
    if (!exportFeedback.message) return undefined;
    const timeoutId = window.setTimeout(() => {
      setExportFeedback({ type: "", message: "" });
    }, 1800);
    return () => window.clearTimeout(timeoutId);
  }, [exportFeedback]);

  useEffect(() => {
    if (!importFeedback.message) return undefined;
    const timeoutId = window.setTimeout(() => {
      setImportFeedback({ type: "", message: "" });
    }, 1800);
    return () => window.clearTimeout(timeoutId);
  }, [importFeedback]);

  const selectedExportIdSet = useMemo(() => new Set(selectedExportIds), [selectedExportIds]);
  const selectedExportBanks = useMemo(
    () => banks.filter((bank) => selectedExportIdSet.has(bank.id)),
    [banks, selectedExportIdSet],
  );
  const hasExportBanks = banks.length > 0;
  const allExportBanksSelected = hasExportBanks && selectedExportIds.length === banks.length;
  const isExportDisabled = selectedExportBanks.length === 0;

  const importValidation = useMemo(() => {
    const trimmedInput = importText.trim();
    if (!trimmedInput) return { categories: [], error: "", isValid: false };
    const parsed = parseImportCategoriesInput(trimmedInput);
    return {
      categories: parsed.categories,
      error: parsed.error,
      isValid: !parsed.error,
    };
  }, [importText]);
  const importErrorMessage = importText.trim() ? importValidation.error : "";
  const isImportDisabled = !importValidation.isValid || !importText.trim();

  const toggleExportSelection = (bankId) => {
    setSelectedExportIds((prev) => (
      prev.includes(bankId)
        ? prev.filter((id) => id !== bankId)
        : [...prev, bankId]
    ));
  };

  const toggleSelectAllExport = () => {
    if (!hasExportBanks) return;
    setSelectedExportIds(allExportBanksSelected ? [] : banks.map((bank) => bank.id));
  };

  const completeImport = (categories, overwriteNameKeys) => {
    onImportCategories(categories, overwriteNameKeys);
    setImportText("");
    setImportFeedback({ type: "success", message: "Imported!" });
    setOverwriteSession(null);
  };

  const startImport = () => {
    if (!importValidation.isValid) return;
    setImportFeedback({ type: "", message: "" });

    const existingByNameKey = new Map(
      banks.map((bank) => [normalizeCategoryNameKey(bank.name), bank.name]),
    );
    const conflicts = [];
    const seenConflictKeys = new Set();

    for (const category of importValidation.categories) {
      const nameKey = normalizeCategoryNameKey(category.name);
      if (!existingByNameKey.has(nameKey) || seenConflictKeys.has(nameKey)) continue;
      seenConflictKeys.add(nameKey);
      conflicts.push({
        nameKey,
        displayName: existingByNameKey.get(nameKey) || category.name,
      });
    }

    if (conflicts.length === 0) {
      completeImport(importValidation.categories, new Set());
      return;
    }

    setOverwriteSession({
      categories: importValidation.categories,
      conflicts,
      conflictIndex: 0,
      overwriteNameKeys: [],
    });
  };

  const cancelImportSession = () => {
    setOverwriteSession(null);
    setImportFeedback({ type: "", message: "" });
  };

  const handleOverwriteDecision = () => {
    if (!overwriteSession) return;

    const currentConflict = overwriteSession.conflicts[overwriteSession.conflictIndex];
    const nextOverwriteNameKeys = [...overwriteSession.overwriteNameKeys, currentConflict.nameKey];
    const nextConflictIndex = overwriteSession.conflictIndex + 1;

    if (nextConflictIndex >= overwriteSession.conflicts.length) {
      completeImport(overwriteSession.categories, new Set(nextOverwriteNameKeys));
      return;
    }

    setOverwriteSession({
      ...overwriteSession,
      conflictIndex: nextConflictIndex,
      overwriteNameKeys: nextOverwriteNameKeys,
    });
  };

  const handleExport = async () => {
    if (isExportDisabled) return;

    const exportText = formatCustomCategoriesForExport(selectedExportBanks);

    try {
      if (!navigator?.clipboard?.writeText) throw new Error("clipboard_not_available");
      await navigator.clipboard.writeText(exportText);
      setExportFeedback({ type: "success", message: "Copied to clipboard!" });
    } catch {
      setExportFeedback({ type: "error", message: "Could not copy. Please try again." });
    }
  };

  const activeOverwriteConflict = overwriteSession
    ? overwriteSession.conflicts[overwriteSession.conflictIndex]
    : null;

  return (
    <Screen>
      <div style={{ paddingTop: 24, marginBottom: 16 }}>
        <Title>Import / Export Categories</Title>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <section style={{
          background: "#FFF",
          borderRadius: 16,
          border: `2px solid ${PALETTE.border}`,
          padding: "14px 12px",
        }}>
          <p style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: 24,
            color: PALETTE.text,
            marginBottom: 8,
            textAlign: "center",
          }}>
            Import
          </p>
          <p style={{ color: PALETTE.muted, fontWeight: 700, fontSize: 13, lineHeight: 1.35 }}>
            1. Format text like this, using a semicolon between categories:
          </p>
          <p style={{
            color: PALETTE.muted,
            fontWeight: 700,
            fontSize: 12,
            lineHeight: 1.35,
            background: "#F6F0E8",
            borderRadius: 10,
            padding: "8px 10px",
            marginBottom: 6,
            wordBreak: "break-word",
            userSelect: "text",
            WebkitUserSelect: "text",
            cursor: "text",
          }}>
            {IMPORT_EXPORT_FORMAT_EXAMPLE}
          </p>
          <p style={{ color: PALETTE.muted, fontWeight: 700, fontSize: 13, lineHeight: 1.35, marginBottom: 10 }}>
            2. Paste below and click Import
          </p>

          <textarea
            value={importText}
            onChange={(e) => {
              setImportText(e.target.value);
              setImportFeedback({ type: "", message: "" });
            }}
            rows={5}
            placeholder="Paste texte here"
            style={{
              width: "100%",
              minHeight: 120,
              resize: "vertical",
              padding: "10px 12px",
              borderRadius: 10,
              border: `2px solid ${importErrorMessage ? "#C0392B" : PALETTE.border}`,
              fontSize: 16,
              fontWeight: 600,
              fontFamily: "'Nunito', sans-serif",
              background: "#FFF",
              color: PALETTE.text,
              marginBottom: 6,
            }}
          />

          {importErrorMessage && (
            <p style={{
              color: "#C0392B",
              fontWeight: 700,
              fontSize: 13,
              lineHeight: 1.35,
              marginBottom: 10,
            }}>
              {importErrorMessage}
            </p>
          )}

          {importFeedback.message && (
            <p style={{
              color: importFeedback.type === "error" ? "#C0392B" : PALETTE.accent,
              fontWeight: 700,
              fontSize: 13,
              lineHeight: 1.35,
              marginBottom: 10,
            }}>
              {importFeedback.message}
            </p>
          )}

          <BigButton onClick={startImport} color={PALETTE.primary} disabled={isImportDisabled}>
            Import
          </BigButton>
        </section>

        <section style={{
          background: "#FFF",
          borderRadius: 16,
          border: `2px solid ${PALETTE.border}`,
          padding: "14px 12px",
        }}>
          <p style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: 24,
            color: PALETTE.text,
            marginBottom: 8,
            textAlign: "center",
          }}>
            Export
          </p>
          <div style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 8,
            marginBottom: 8,
          }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ color: PALETTE.muted, fontWeight: 700, fontSize: 13, lineHeight: 1.35 }}>
                1. Choose categories you want to export
              </p>
              <p style={{ color: PALETTE.muted, fontWeight: 700, fontSize: 13, lineHeight: 1.35 }}>
                2. Click Export (copies to clipboard)
              </p>
            </div>
            <PillButton
              color={PALETTE.muted}
              disabled={!hasExportBanks}
              onClick={toggleSelectAllExport}
              style={{
                padding: "5px 9px",
                fontSize: 11,
                lineHeight: 1.1,
                whiteSpace: "nowrap",
                flexShrink: 0,
                boxShadow: hasExportBanks ? "0 3px 0 #4A4A4A" : "none",
                cursor: hasExportBanks ? "pointer" : "not-allowed",
              }}
            >
              {allExportBanksSelected ? "Deselect all" : "Select all"}
            </PillButton>
          </div>

          <div style={{
            borderRadius: 12,
            border: `2px solid ${PALETTE.border}`,
            padding: 8,
            background: "#FFF",
            maxHeight: 220,
            overflowY: "auto",
            marginBottom: 10,
          }}>
            {banks.length === 0 ? (
              <p style={{ textAlign: "center", color: "#BBB", fontWeight: 700, padding: "10px 0" }}>
                No custom categories available
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {banks.map((bank) => {
                  const isSelected = selectedExportIdSet.has(bank.id);
                  return (
                    <button
                      type="button"
                      className="btn-pressable"
                      key={bank.id}
                      onClick={() => toggleExportSelection(bank.id)}
                      style={{
                        width: "100%",
                        borderRadius: 10,
                        border: `2px solid ${isSelected ? PALETTE.primary : PALETTE.border}`,
                        background: isSelected ? "#FFF0F0" : "#FFF",
                        padding: "9px 10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        textAlign: "left",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 800, fontSize: 15, color: PALETTE.text }}>
                          {bank.name}
                        </p>
                        <p style={{ fontSize: 12, color: PALETTE.muted, fontWeight: 700 }}>
                          {bank.words.length} word{bank.words.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      <span style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: isSelected ? PALETTE.primary : "#AAA",
                        whiteSpace: "nowrap",
                      }}>
                        {isSelected ? "Selected" : "Tap to select"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <BigButton onClick={handleExport} color={PALETTE.primary} disabled={isExportDisabled}>
            Export
          </BigButton>
          {exportFeedback.message && (
            <p style={{
              marginTop: 8,
              textAlign: "center",
              fontWeight: 700,
              fontSize: 13,
              color: exportFeedback.type === "error" ? "#C0392B" : PALETTE.accent,
            }}>
              {exportFeedback.message}
            </p>
          )}
        </section>
      </div>

      <BackButton onClick={onBack} style={{ marginTop: 12 }} />

      {activeOverwriteConflict && (
        <AppModal maxWidth={340}>
          <p style={{
            textAlign: "center",
            fontFamily: "'Fredoka One', cursive",
            color: PALETTE.text,
            fontSize: 24,
            marginBottom: 10,
            lineHeight: 1.2,
          }}>
            Overwrite existing category?
          </p>
          <p style={{
            textAlign: "center",
            color: PALETTE.muted,
            fontWeight: 700,
            fontSize: 14,
            lineHeight: 1.35,
            marginBottom: 14,
          }}>
            '{activeOverwriteConflict.displayName}' already exists. Replace it with the imported version?
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
            <PillButton color={PALETTE.muted} onClick={cancelImportSession}>
              Cancel
            </PillButton>
            <PillButton color={PALETTE.primary} onClick={handleOverwriteDecision}>
              Overwrite
            </PillButton>
          </div>
        </AppModal>
      )}
    </Screen>
  );
}

function PassScreen({ name, onReady }) {
  return (
    <Screen style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center", width: "100%" }}>
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
  const initialTimerMinutes = useRef(clampTimerMinutes(readStoredState()[TIMER_STORAGE_KEY]));
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
      <div style={{ paddingTop: 24, paddingBottom: 8 }}>
        <Title>Ready to play!</Title>
      </div>

      {/* Starting player hero card */}
      <div style={{
        background: "linear-gradient(135deg, #FF8E53, #FFB347)",
        borderRadius: 22, padding: "18px 20px", textAlign: "center",
        marginBottom: 14, boxShadow: "0 8px 24px rgba(255,142,83,0.3)",
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
            type="button"
            className="btn-pressable"
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
            type="button"
            className="btn-pressable"
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

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
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

function PostGameScreen({ onPlayAgain, onBackToHome, everyoneWasImpostor }) {
  return (
    <Screen style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
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
        <BigButton onClick={onPlayAgain} color={PALETTE.blue}>
          Play Again
        </BigButton>
        <BigButton onClick={onBackToHome} color={PALETTE.muted}>
          Return to home screen
        </BigButton>
      </div>
    </Screen>
  );
}

// ─── GAME STATE MACHINE ──────────────────────────────────────────────────────
// screens: home | players | player_presets | categories | custom_word_banks | create_custom_word_bank | select_custom_word_banks | import_export_categories | reveal_loop | discussion | postgame

export default function App() {
  const [initialStored] = useState(() => readStoredState());
  const [initialCustomWordBanks] = useState(() => loadCustomWordBanks());
  const storedEnabledCustomBankIds = Array.isArray(initialStored.enabledCustomBankIds)
    ? initialStored.enabledCustomBankIds
    : [];
  const storedSelectedCustomBankIds = Array.isArray(initialStored.lastSelectedCustomBankIds)
    ? initialStored.lastSelectedCustomBankIds
    : [];
  const initialKnownCustomBankIds = new Set(initialCustomWordBanks.map((bank) => bank.id));
  const initialEnabledCustomBankIds = Array.from(new Set(
    (storedEnabledCustomBankIds.length > 0 ? storedEnabledCustomBankIds : storedSelectedCustomBankIds)
      .filter((id) => initialKnownCustomBankIds.has(id)),
  ));
  const initialEnabledCustomBankSet = new Set(initialEnabledCustomBankIds);
  const initialSelectedCustomBankIds = Array.from(new Set(
    storedSelectedCustomBankIds.filter((id) => initialEnabledCustomBankSet.has(id)),
  ));

  const [screenHistory, setScreenHistory] = useState(["home"]);
  const screen = screenHistory[screenHistory.length - 1];
  const [customWordBanksOrigin, setCustomWordBanksOrigin] = useState("home");
  const [customWordBanksInitialTab, setCustomWordBanksInitialTab] = useState("browse");
  const [players, setPlayers] = useState(initialStored.savedPlayers || []);
  const [k, setK] = useState(initialStored.lastImpostorCount || 1);
  const [playersSetupDraft, setPlayersSetupDraft] = useState(() => createPlayersSetupDraft({
    playerCount: initialStored.savedPlayers?.length || initialStored.lastPlayerCount || 4,
    impostorCount: initialStored.lastImpostorCount || 1,
    names: initialStored.savedPlayers || [],
  }));
  const [selectedCats, setSelectedCats] = useState(initialStored.lastSelectedCategories || []);
  const [customWordBanks, setCustomWordBanks] = useState(initialCustomWordBanks);
  const [selectedBuiltInCategories, setSelectedBuiltInCategories] = useState(() => {
    const storedBuiltIn = Array.isArray(initialStored.lastSelectedCategories)
      ? initialStored.lastSelectedCategories
      : [];
    return storedBuiltIn.filter((cat) => Object.prototype.hasOwnProperty.call(CATEGORIES, cat));
  });
  const [enabledCustomBankIds, setEnabledCustomBankIds] = useState(initialEnabledCustomBankIds);
  const [selectedCustomBankIds, setSelectedCustomBankIds] = useState(initialSelectedCustomBankIds);
  const [selectCustomWordBanksDraftIds, setSelectCustomWordBanksDraftIds] = useState([]);
  const [selectCustomWordBanksOrigin, setSelectCustomWordBanksOrigin] = useState("categories");
  const [customWordBanksSortMode, setCustomWordBanksSortMode] = useState(() =>
    normalizeCustomWordBankSortMode(
      initialStored[CUSTOM_CATEGORIES_SORT_MODE_KEY] || DEFAULT_CUSTOM_WORD_BANK_SORT_MODE,
    ),
  );
  const hasPlayers = players.length > 0 || !!(initialStored.savedPlayers?.length);
  // runtime
  const [word, setWord] = useState("");
  const [impostorIds, setImpostorIds] = useState([]);
  const [startingId, setStartingId] = useState(0);
  const [revealIndex, setRevealIndex] = useState(0);
  const [phase, setPhase] = useState("pass");

  const navigateTo = useCallback((nextScreen, { replace = false, reset = false } = {}) => {
    setScreenHistory((prev) => {
      const current = prev[prev.length - 1];
      if (reset) return [nextScreen];
      if (current === nextScreen) return prev;
      if (replace) {
        if (prev.length <= 1) return [nextScreen];
        return [...prev.slice(0, -1), nextScreen];
      }
      return [...prev, nextScreen];
    });
  }, []);

  const goBack = useCallback(() => {
    setScreenHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const returnToScreen = useCallback((targetScreen) => {
    setScreenHistory((prev) => {
      const targetIndex = prev.lastIndexOf(targetScreen);
      if (targetIndex >= 0) {
        return prev.slice(0, targetIndex + 1);
      }

      if (targetScreen === "players" && prev.includes("home")) {
        return ["home", "players"];
      }

      const current = prev[prev.length - 1];
      if (current === targetScreen) return prev;
      return [...prev, targetScreen];
    });
  }, []);

  const toggleBuiltInCategory = useCallback((cat) => {
    setSelectedBuiltInCategories((prev) =>
      prev.includes(cat) ? prev.filter((entry) => entry !== cat) : [...prev, cat],
    );
  }, []);

  const toggleCustomBankSelection = useCallback((bankId) => {
    if (!enabledCustomBankIds.includes(bankId)) return;
    setSelectedCustomBankIds((prev) =>
      prev.includes(bankId) ? prev.filter((entry) => entry !== bankId) : [...prev, bankId],
    );
  }, [enabledCustomBankIds]);

  const sortedCustomWordBanks = useMemo(
    () => sortCustomWordBanks(customWordBanks, customWordBanksSortMode),
    [customWordBanks, customWordBanksSortMode],
  );

  const handleCustomWordBanksSortModeChange = useCallback((nextMode) => {
    const normalizedMode = normalizeCustomWordBankSortMode(nextMode);
    setCustomWordBanksSortMode(normalizedMode);
    save({ [CUSTOM_CATEGORIES_SORT_MODE_KEY]: normalizedMode });
  }, []);

  const applyCustomSelectionDraft = useCallback((nextEnabledBankIdsRaw) => {
    const knownIds = new Set(customWordBanks.map((bank) => bank.id));
    const nextEnabledBankIds = Array.isArray(nextEnabledBankIdsRaw) ? nextEnabledBankIdsRaw : [];
    const sanitizedEnabledBankIds = Array.from(new Set(
      nextEnabledBankIds.filter((id) => knownIds.has(id)),
    ));
    const enabledSet = new Set(sanitizedEnabledBankIds);
    const nextSelectedBankIds = selectedCustomBankIds.filter((id) => enabledSet.has(id));

    setEnabledCustomBankIds(sanitizedEnabledBankIds);
    setSelectedCustomBankIds(nextSelectedBankIds);
    setSelectCustomWordBanksDraftIds(sanitizedEnabledBankIds);
    save({
      enabledCustomBankIds: sanitizedEnabledBankIds,
      lastSelectedCustomBankIds: nextSelectedBankIds,
    });
  }, [customWordBanks, selectedCustomBankIds]);

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
    setEnabledCustomBankIds((prev) => {
      const next = prev.filter((bankId) => bankId !== id);
      save({ enabledCustomBankIds: next });
      return next;
    });
    setSelectedCustomBankIds((prev) => {
      const next = prev.filter((bankId) => bankId !== id);
      save({ lastSelectedCustomBankIds: next });
      return next;
    });
    setSelectCustomWordBanksDraftIds((prev) => prev.filter((bankId) => bankId !== id));
  }, []);

  const handleClearAllCustomBanks = useCallback(() => {
    setCustomWordBanks(() => {
      saveCustomWordBanks([]);
      return [];
    });
    setEnabledCustomBankIds([]);
    setSelectedCustomBankIds([]);
    setSelectCustomWordBanksDraftIds([]);
    save({
      enabledCustomBankIds: [],
      lastSelectedCustomBankIds: [],
    });
  }, []);

  const handleSavePredefinedBank = useCallback((bank) => {
    setCustomWordBanks((prev) => {
      const next = createCustomWordBank(prev, {
        name: bank.name,
        wordsInput: bank.words,
      });
      saveCustomWordBanks(next);
      return next;
    });
  }, []);

  const handleImportCustomCategories = useCallback((categories, overwriteNameKeys) => {
    const overwriteSet = overwriteNameKeys instanceof Set
      ? overwriteNameKeys
      : new Set(Array.isArray(overwriteNameKeys) ? overwriteNameKeys : []);

    setCustomWordBanks((prev) => {
      let next = [...prev];

      for (const category of categories) {
        const name = String(category?.name ?? "").trim();
        const nameKey = normalizeCategoryNameKey(name);
        if (!name || !nameKey) continue;

        const existingBank = next.find((bank) => normalizeCategoryNameKey(bank.name) === nameKey);
        if (existingBank) {
          if (!overwriteSet.has(nameKey)) continue;
          next = updateCustomWordBank(next, existingBank.id, {
            name,
            wordsInput: category.words,
          });
          continue;
        }

        next = createCustomWordBank(next, {
          name,
          wordsInput: category.words,
        });
      }

      saveCustomWordBanks(next);
      return next;
    });
  }, []);

  const startRound = useCallback(() => {
    const enabledCustomBankSet = new Set(enabledCustomBankIds);
    const selectedCustomBanks = customWordBanks.filter((bank) =>
      enabledCustomBankSet.has(bank.id) && selectedCustomBankIds.includes(bank.id),
    );
    const allWords = [
      ...selectedBuiltInCategories.flatMap((cat) => CATEGORIES[cat] || []),
      ...selectedCustomBanks.flatMap((bank) => bank.words),
    ];
    const pool = Array.from(new Set(allWords));
    if (pool.length === 0) return;

    const chosenWord = pick(pool);
    const ids = Array.from({ length: players.length }, (_, i) => i);
    const allImpostorCooldown = loadAllImpostorCooldown();
    const everyoneImpostor = allImpostorCooldown === 0 && Math.random() < 0.05;
    const impostors = everyoneImpostor ? ids : pickN(ids, k);
    const nextAllImpostorCooldown = everyoneImpostor
      ? ALL_IMPOSTOR_COOLDOWN_MAX
      : Math.max(0, allImpostorCooldown - 1);
    saveAllImpostorCooldown(nextAllImpostorCooldown);
    const starter = pick(ids);

    if (selectedCustomBanks.length > 0) {
      const selectedCustomBankIdSet = new Set(selectedCustomBanks.map((bank) => bank.id));
      const playedAt = Date.now();
      setCustomWordBanks((prev) => {
        const next = prev.map((bank) => (
          selectedCustomBankIdSet.has(bank.id)
            ? { ...bank, lastPlayedAt: playedAt }
            : bank
        ));
        saveCustomWordBanks(next);
        return next;
      });
    }

    setSelectedCats([
      ...selectedBuiltInCategories,
      ...selectedCustomBanks.map((bank) => bank.name),
    ]);
    save({
      lastSelectedCategories: selectedBuiltInCategories,
      lastSelectedCustomBankIds: selectedCustomBankIds,
      enabledCustomBankIds,
    });
    setWord(chosenWord);
    setImpostorIds(impostors);
    setStartingId(starter);
    setRevealIndex(0);
    setPhase("pass");
    navigateTo("reveal_loop");
  }, [customWordBanks, enabledCustomBankIds, k, navigateTo, players, selectedBuiltInCategories, selectedCustomBankIds]);

  if (screen === "home") return (
    <>
      <GlobalStyle />
      <HomeScreen
        hasPlayers={hasPlayers}
        onStart={() => {
          const fallbackNames = players.length > 0 ? players : initialStored.savedPlayers || [];
          const fallbackCount = players.length > 0 ? players.length : initialStored.lastPlayerCount || 4;
          setPlayersSetupDraft(createPlayersSetupDraft({
            playerCount: fallbackCount,
            impostorCount: k,
            names: fallbackNames,
          }));
          navigateTo("players");
        }}
        onPlayAgain={() => navigateTo("categories")}
        onOpenCustomWordBanks={() => {
          setCustomWordBanksOrigin("home");
          setCustomWordBanksInitialTab("browse");
          navigateTo("custom_word_banks");
        }}
      />
    </>
  );

  if (screen === "players") return (
    <>
      <GlobalStyle />
      <PlayersScreen
        draft={playersSetupDraft}
        onDraftChange={setPlayersSetupDraft}
        onOpenPresets={() => navigateTo("player_presets")}
        onContinue={({ players: ps, k: ki }) => {
          setPlayers(ps);
          setK(ki);
          setPlayersSetupDraft(createPlayersSetupDraft({
            playerCount: ps.length,
            impostorCount: ki,
            names: ps,
          }));
          navigateTo("categories");
        }}
        onBack={() => {
          const fallbackNames = players.length > 0 ? players : initialStored.savedPlayers || [];
          const fallbackCount = players.length > 0 ? players.length : initialStored.lastPlayerCount || 4;
          setPlayersSetupDraft(createPlayersSetupDraft({
            playerCount: fallbackCount,
            impostorCount: k,
            names: fallbackNames,
          }));
          goBack();
        }}
      />
    </>
  );

  if (screen === "player_presets") return (
    <>
      <GlobalStyle />
      <PlayerPresetsScreen
        draft={playersSetupDraft}
        onDraftChange={setPlayersSetupDraft}
        onBack={goBack}
      />
    </>
  );

  if (screen === "categories") return (
    <>
      <GlobalStyle />
      <CategoriesScreen
        selectedBuiltInCategories={selectedBuiltInCategories}
        enabledCustomBankIds={enabledCustomBankIds}
        selectedCustomBankIds={selectedCustomBankIds}
        customWordBanks={customWordBanks}
        onToggleBuiltInCategory={toggleBuiltInCategory}
        onToggleCustomBankSelection={toggleCustomBankSelection}
        onOpenCustomWordBanks={() => {
          setSelectCustomWordBanksDraftIds(enabledCustomBankIds);
          setSelectCustomWordBanksOrigin("categories");
          navigateTo("select_custom_word_banks");
        }}
        onPlay={startRound}
        onBack={() => returnToScreen("players")}
      />
    </>
  );

  if (screen === "select_custom_word_banks") return (
    <>
      <GlobalStyle />
      <SelectCustomWordBanksScreen
        banks={sortedCustomWordBanks}
        draftEnabledBankIds={selectCustomWordBanksDraftIds}
        baselineEnabledBankIds={enabledCustomBankIds}
        sortMode={customWordBanksSortMode}
        onDraftEnabledBankIdsChange={setSelectCustomWordBanksDraftIds}
        onSortModeChange={handleCustomWordBanksSortModeChange}
        onApply={(nextEnabledBankIds) => {
          applyCustomSelectionDraft(nextEnabledBankIds);
          returnToScreen(selectCustomWordBanksOrigin);
        }}
        onOpenCustomWordBanks={() => {
          setCustomWordBanksOrigin("select_custom_word_banks");
          setCustomWordBanksInitialTab("browse");
          navigateTo("custom_word_banks");
        }}
        onBack={() => {
          applyCustomSelectionDraft(selectCustomWordBanksDraftIds);
          returnToScreen(selectCustomWordBanksOrigin);
        }}
      />
    </>
  );

  if (screen === "custom_word_banks") return (
    <>
      <GlobalStyle />
      <CustomWordBanksScreen
        banks={sortedCustomWordBanks}
        selectedBankIds={customWordBanksOrigin === "categories" ? selectedCustomBankIds : []}
        selectable={customWordBanksOrigin === "categories"}
        predefinedWordBank={PREDEFINED_CUSTOM_WORD_BANK}
        predefinedWordBankThemes={PREDEFINED_CUSTOM_WORD_BANK_THEMES}
        nextDefaultName={getNextCustomWordBankName(customWordBanks)}
        initialTab={customWordBanksInitialTab}
        sortMode={customWordBanksSortMode}
        onSortModeChange={handleCustomWordBanksSortModeChange}
        backButtonLabel={customWordBanksOrigin === "categories" ? "Add categories to selection" : "Back"}
        onBack={goBack}
        onToggleSelection={toggleCustomBankSelection}
        onOpenCreateBank={() => {
          setCustomWordBanksInitialTab("my");
          navigateTo("create_custom_word_bank");
        }}
        onUpdateBank={handleUpdateCustomBank}
        onDeleteBank={handleDeleteCustomBank}
        onClearAllBanks={handleClearAllCustomBanks}
        onSavePredefinedBank={handleSavePredefinedBank}
        onOpenImportExport={() => {
          setCustomWordBanksInitialTab("my");
          navigateTo("import_export_categories");
        }}
      />
    </>
  );

  if (screen === "create_custom_word_bank") return (
    <>
      <GlobalStyle />
      <CreateCustomWordBankScreen
        nextDefaultName={getNextCustomWordBankName(customWordBanks)}
        onCreateBank={handleCreateCustomBank}
        onBack={goBack}
      />
    </>
  );

  if (screen === "import_export_categories") return (
    <>
      <GlobalStyle />
      <ImportExportCategoriesScreen
        banks={sortedCustomWordBanks}
        onImportCategories={handleImportCustomCategories}
        onBack={goBack}
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
          onStartDiscussion={() => navigateTo("postgame")}
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
        onPlayAgain={() => navigateTo("categories")}
        onBackToHome={() => navigateTo("home", { reset: true })}
        everyoneWasImpostor={impostorIds.length === players.length}
      />
    </>
  );

  return null;
}
