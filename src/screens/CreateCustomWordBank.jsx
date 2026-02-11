import { useCallback, useEffect, useState } from "react";

const PALETTE = {
  bg: "#FFF9F0",
  card: "#FFFFFF",
  primary: "#FF6B6B",
  blue: "#4ECDC4",
  accent: "#6BCB77",
  text: "#2D2D2D",
  muted: "#888",
  border: "#F0E8DC",
};

function darken(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (n >> 16) - 40);
  const g = Math.max(0, ((n >> 8) & 0xff) - 40);
  const b = Math.max(0, (n & 0xff) - 40);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export default function CreateCustomWordBankScreen({ nextDefaultName, onCreateBank, onBack }) {
  const [draftName, setDraftName] = useState("");
  const [draftWords, setDraftWords] = useState("");
  const [saveFeedback, setSaveFeedback] = useState({ type: "", message: "" });

  useEffect(() => {
    if (!saveFeedback.message) return undefined;
    const timeoutId = window.setTimeout(() => {
      setSaveFeedback({ type: "", message: "" });
    }, 1800);
    return () => window.clearTimeout(timeoutId);
  }, [saveFeedback]);

  const handleSave = useCallback(() => {
    const normalizedDraftName = draftName.trim();
    onCreateBank({ name: normalizedDraftName || nextDefaultName, wordsInput: draftWords });
    setDraftName("");
    setDraftWords("");
    setSaveFeedback({ type: "success", message: "Saved!" });
  }, [draftName, draftWords, nextDefaultName, onCreateBank]);

  return (
    <div style={{
      height: "100dvh",
      width: "100%",
      maxWidth: 480,
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      padding: "24px 20px",
      overflowY: "auto",
      background: PALETTE.bg,
      color: PALETTE.text,
    }}>
      <style>{`
        .cwb-input::placeholder,
        .cwb-textarea::placeholder {
          color: #9a9a9a;
          opacity: 1;
        }
      `}</style>

      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <h1 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 34, color: PALETTE.primary }}>
          Create category
        </h1>
      </div>

      <div style={{
        background: PALETTE.card,
        borderRadius: 16,
        border: `2px solid ${PALETTE.border}`,
        padding: 14,
        marginBottom: 14,
      }}>
        <p style={{ fontWeight: 800, fontSize: 14, color: PALETTE.text, textTransform: "uppercase", letterSpacing: 1 }}>
          Create List
        </p>
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            style={{
              background: "#F3F3F3",
              color: "#6F6F6F",
              fontSize: 12,
              lineHeight: 1.4,
              fontWeight: 600,
              borderRadius: 10,
              padding: "8px 10px",
            }}
          >
            💡 Tip: Ask an AI-model to generate words within a category, make sure to mention to separate all words by commas.
          </div>
          <input
            className="cwb-input"
            value={draftName}
            onChange={(e) => {
              setDraftName(e.target.value);
              setSaveFeedback({ type: "", message: "" });
            }}
            placeholder={nextDefaultName}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: `2px solid ${PALETTE.border}`,
              fontSize: 16,
              fontWeight: 700,
              background: "#FFF",
              color: PALETTE.text,
            }}
          />
          <textarea
            className="cwb-textarea"
            value={draftWords}
            onChange={(e) => {
              setDraftWords(e.target.value);
              setSaveFeedback({ type: "", message: "" });
            }}
            placeholder="Enter words separated by commas"
            rows={11}
            style={{
              resize: "vertical",
              minHeight: 270,
              padding: "10px 12px",
              borderRadius: 10,
              border: `2px solid ${PALETTE.border}`,
              fontSize: 16,
              fontWeight: 600,
              fontFamily: "'Nunito', sans-serif",
              background: "#FFF",
              color: PALETTE.text,
            }}
          />
          {saveFeedback.message && (
            <p style={{
              color: saveFeedback.type === "error" ? "#C0392B" : PALETTE.accent,
              fontWeight: 700,
              fontSize: 13,
              lineHeight: 1.35,
            }}>
              {saveFeedback.message}
            </p>
          )}
          <button
            type="button"
            className="btn-pressable"
            onClick={handleSave}
            style={{
              width: "100%",
              borderRadius: 12,
              background: "#6BCB77",
              color: "#FFF",
              padding: "10px 14px",
              fontSize: 16,
              boxShadow: `0 4px 0 ${darken("#6BCB77")}`,
            }}
          >
            Save
          </button>
        </div>
      </div>

      <button
        type="button"
        className="btn-pressable"
        onClick={onBack}
        style={{
          marginTop: "auto",
          width: "100%",
          borderRadius: 14,
          border: `2px solid ${PALETTE.border}`,
          color: PALETTE.muted,
          background: "#FFF",
          padding: "11px 16px",
          fontSize: 16,
        }}
      >
        Back
      </button>
    </div>
  );
}
