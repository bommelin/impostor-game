import { useState } from "react";

const PALETTE = {
  bg: "#FFF9F0",
  card: "#FFFFFF",
  primary: "#FF6B6B",
  blue: "#4ECDC4",
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

function ModalPillButton({ children, onClick, color = PALETTE.primary, disabled }) {
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
      }}
    >
      {children}
    </button>
  );
}

export default function CustomWordBanksScreen({
  banks,
  selectedBankIds,
  selectable,
  nextDefaultName,
  onBack,
  onToggleSelection,
  onCreateBank,
  onUpdateBank,
  onDeleteBank,
}) {
  const [editorMode, setEditorMode] = useState(null); // "create" | "edit" | null
  const [editingId, setEditingId] = useState(null);
  const [draftName, setDraftName] = useState("");
  const [draftWords, setDraftWords] = useState("");
  const [pendingDeleteBank, setPendingDeleteBank] = useState(null);

  const openCreate = () => {
    setEditorMode("create");
    setEditingId(null);
    setDraftName("");
    setDraftWords("");
  };

  const openEdit = (bank) => {
    setEditorMode("edit");
    setEditingId(bank.id);
    setDraftName(bank.name);
    setDraftWords(bank.words.join(", "));
  };

  const closeEditor = () => {
    setEditorMode(null);
    setEditingId(null);
    setDraftName("");
    setDraftWords("");
  };

  const handleSave = () => {
    const normalizedDraftName = draftName.trim();
    if (editorMode === "create") {
      onCreateBank({ name: normalizedDraftName || nextDefaultName, wordsInput: draftWords });
      closeEditor();
      return;
    }
    if (editorMode === "edit" && editingId) {
      const existingName = banks.find((bank) => bank.id === editingId)?.name || nextDefaultName;
      onUpdateBank(editingId, { name: normalizedDraftName || existingName, wordsInput: draftWords });
      closeEditor();
    }
  };

  const confirmDelete = () => {
    if (!pendingDeleteBank) return;
    onDeleteBank(pendingDeleteBank.id);
    if (editingId === pendingDeleteBank.id) closeEditor();
    setPendingDeleteBank(null);
  };

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
          Custom Categories
        </h1>
      </div>

      <button
        onClick={openCreate}
        style={{
          width: "100%",
          borderRadius: 14,
          background: PALETTE.blue,
          color: "#FFF",
          padding: "12px 16px",
          fontSize: 17,
          marginBottom: 14,
          boxShadow: "0 4px 0 #37939B",
        }}
      >
        + New list
      </button>

      <div style={{
        background: "#FFF",
        borderRadius: 16,
        border: `2px solid ${PALETTE.border}`,
        padding: 12,
        marginBottom: 14,
      }}>
        {banks.length === 0 ? (
          <p style={{ textAlign: "center", color: "#BBB", fontWeight: 700, padding: "10px 0" }}>
            No custom categories available
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {banks.map((bank) => {
              const isSelected = selectedBankIds.includes(bank.id);
              return (
                <div
                  key={bank.id}
                  onClick={() => {
                    if (selectable) onToggleSelection(bank.id);
                  }}
                  style={{
                    borderRadius: 12,
                    border: `2px solid ${isSelected ? PALETTE.primary : PALETTE.border}`,
                    background: isSelected ? "#FFF0F0" : "#FFF",
                    padding: "10px 12px",
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: selectable ? "pointer" : "default",
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
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {selectable && (
                      <span style={{ fontSize: 12, fontWeight: 800, color: isSelected ? PALETTE.primary : "#AAA" }}>
                        {isSelected ? "Selected" : "Tap to select"}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(bank);
                      }}
                      style={{
                        borderRadius: 10,
                        background: "#FFF",
                        border: `2px solid ${PALETTE.blue}`,
                        color: PALETTE.blue,
                        fontSize: 12,
                        padding: "6px 10px",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingDeleteBank(bank);
                      }}
                      style={{
                        borderRadius: 10,
                        background: "#FFF",
                        border: "2px solid #D66",
                        color: "#D66",
                        fontSize: 12,
                        padding: "6px 10px",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editorMode && (
        <div style={{
          background: PALETTE.card,
          borderRadius: 16,
          border: `2px solid ${PALETTE.border}`,
          padding: 14,
          marginBottom: 14,
        }}>
          <p style={{ fontWeight: 800, fontSize: 14, color: PALETTE.text, textTransform: "uppercase", letterSpacing: 1 }}>
            {editorMode === "create" ? "Create List" : "Edit List"}
          </p>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              className="cwb-input"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder={editorMode === "create" ? nextDefaultName : "List name"}
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
              onChange={(e) => setDraftWords(e.target.value)}
              placeholder="Words separated by commas"
              rows={4}
              style={{
                resize: "vertical",
                padding: "10px 12px",
                borderRadius: 10,
                border: `2px solid ${PALETTE.border}`,
                fontSize: 16,
                fontWeight: 600,
                background: "#FFF",
                color: PALETTE.text,
              }}
            />
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
            💡 Tip: To quickly create your own categories, ask any AI model the following and paste the results:
            "Generate a list of 50 words within the category [], all words must be separated by commas."
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleSave}
                style={{
                  flex: 1,
                  borderRadius: 12,
                  background: PALETTE.primary,
                  color: "#FFF",
                  padding: "10px 14px",
                  fontSize: 16,
                  boxShadow: "0 4px 0 #CC4444",
                }}
              >
                Save
              </button>
              <button
                onClick={closeEditor}
                style={{
                  borderRadius: 12,
                  background: "#FFF",
                  color: PALETTE.muted,
                  border: `2px solid ${PALETTE.border}`,
                  padding: "10px 14px",
                  fontSize: 16,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <button
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

      {pendingDeleteBank && (
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
              Delete?
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
              <ModalPillButton color={PALETTE.muted} onClick={() => setPendingDeleteBank(null)}>
                Cancel
              </ModalPillButton>
              <ModalPillButton color={PALETTE.primary} onClick={confirmDelete}>
                Delete
              </ModalPillButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
