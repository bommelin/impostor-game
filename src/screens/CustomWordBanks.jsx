import { useEffect, useMemo, useState } from "react";
import {
  CUSTOM_WORD_BANK_SORT_MODE_ORDER_OF_SAVING,
  CUSTOM_WORD_BANK_SORT_MODE_RECENTLY_PLAYED,
  parseWordsInput,
} from "../customWordBanks";

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

const getBankSignature = (bank) => {
  const normalizedName = String(bank?.name ?? "").trim().toLocaleLowerCase();
  const normalizedWords = parseWordsInput(bank?.words ?? [])
    .map((word) => String(word).trim().toLocaleLowerCase());
  return `${normalizedName}::${normalizedWords.join("\u0001")}`;
};

function ModalPillButton({ children, onClick, color = PALETTE.primary, disabled }) {
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
  predefinedWordBank,
  predefinedWordBankThemes,
  nextDefaultName,
  initialTab = "browse",
  backButtonLabel = "Back",
  onBack,
  onToggleSelection,
  onOpenCreateBank,
  onUpdateBank,
  onDeleteBank,
  onClearAllBanks,
  onSavePredefinedBank,
  onOpenImportExport,
  sortMode = CUSTOM_WORD_BANK_SORT_MODE_ORDER_OF_SAVING,
  onSortModeChange,
}) {
  const [editorMode, setEditorMode] = useState(null); // "edit" | null
  const [editingId, setEditingId] = useState(null);
  const [draftName, setDraftName] = useState("");
  const [draftWords, setDraftWords] = useState("");
  const [pendingDeleteBank, setPendingDeleteBank] = useState(null);
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab === "my" ? "my" : "browse");
  const [mySearchQuery, setMySearchQuery] = useState("");
  const [browseSearchQuery, setBrowseSearchQuery] = useState("");
  const [expandedThemeIds, setExpandedThemeIds] = useState([]);

  const normalizedMySearchQuery = mySearchQuery.trim().toLocaleLowerCase();
  const normalizedBrowseSearchQuery = browseSearchQuery.trim().toLocaleLowerCase();
  const isBrowseSearching = normalizedBrowseSearchQuery.length > 0;
  const predefinedBanks = useMemo(
    () => Object.entries(predefinedWordBank || {}).map(([name, words]) => ({
      name,
      words: Array.isArray(words) ? words : [],
    })).filter((bank) => bank.name && bank.words.length > 0),
    [predefinedWordBank],
  );
  const predefinedThemes = useMemo(() => {
    if (!Array.isArray(predefinedWordBankThemes) || predefinedWordBankThemes.length === 0) {
      return [{ id: "all", label: "All categories", items: predefinedBanks }];
    }

    return predefinedWordBankThemes
      .map((theme) => ({
        id: String(theme?.id ?? "").trim(),
        label: String(theme?.label ?? "").trim(),
        items: Array.isArray(theme?.items)
          ? theme.items.map((item) => ({
            name: String(item?.name ?? "").trim(),
            words: Array.isArray(item?.words) ? item.words : [],
          })).filter((item) => item.name && item.words.length > 0)
          : [],
      }))
      .filter((theme) => theme.id);
  }, [predefinedBanks, predefinedWordBankThemes]);
  const browseThemeSections = useMemo(() => (
    predefinedThemes
      .map((theme) => {
        const matchingItems = theme.items.filter((item) =>
          item.name.toLocaleLowerCase().includes(normalizedBrowseSearchQuery),
        );
        const visibleItems = isBrowseSearching ? matchingItems : theme.items;
        return {
          ...theme,
          isExpanded: isBrowseSearching ? matchingItems.length > 0 : expandedThemeIds.includes(theme.id),
          previewNames: theme.items.slice(0, 3).map((item) => item.name),
          visibleItems,
        };
      })
      .filter((theme) => theme.visibleItems.length > 0)
  ), [expandedThemeIds, isBrowseSearching, normalizedBrowseSearchQuery, predefinedThemes]);
  const filteredMyBanks = banks.filter((bank) =>
    String(bank.name ?? "").toLocaleLowerCase().includes(normalizedMySearchQuery),
  );
  const hasSavedCategories = banks.length > 0;

  useEffect(() => {
    setActiveTab(initialTab === "my" ? "my" : "browse");
  }, [initialTab]);

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
    if (editorMode === "edit" && editingId) {
      const normalizedDraftName = draftName.trim();
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

  const confirmClearAll = () => {
    onClearAllBanks?.();
    closeEditor();
    setPendingDeleteBank(null);
    setIsClearAllConfirmOpen(false);
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    if (tab === "browse") closeEditor();
  };

  const toggleThemeExpansion = (themeId) => {
    if (isBrowseSearching) return;

    setExpandedThemeIds((prevExpandedThemeIds) => {
      if (prevExpandedThemeIds.includes(themeId)) {
        return prevExpandedThemeIds.filter((id) => id !== themeId);
      }
      return [...prevExpandedThemeIds, themeId];
    });
  };

  const savedBankSignatures = useMemo(
    () => new Set(banks.map((bank) => getBankSignature(bank))),
    [banks],
  );

  const isPredefinedBankSaved = (bank) => savedBankSignatures.has(getBankSignature(bank));

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
          More Categories
        </h1>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          marginBottom: 14,
        }}
      >
        <button
          type="button"
          className="btn-pressable"
          onClick={() => switchTab("browse")}
          style={{
            borderRadius: 12,
            padding: "10px 12px",
            fontSize: 14,
            fontWeight: 800,
            border: `2px solid ${activeTab === "browse" ? PALETTE.primary : PALETTE.border}`,
            background: activeTab === "browse" ? "#FFF0F0" : "#FFF",
            color: activeTab === "browse" ? PALETTE.primary : PALETTE.muted,
          }}
        >
          Browse
        </button>
        <button
          type="button"
          className="btn-pressable"
          onClick={() => switchTab("my")}
          style={{
            borderRadius: 12,
            padding: "10px 12px",
            fontSize: 14,
            fontWeight: 800,
            border: `2px solid ${activeTab === "my" ? PALETTE.primary : PALETTE.border}`,
            background: activeTab === "my" ? "#FFF0F0" : "#FFF",
            color: activeTab === "my" ? PALETTE.primary : PALETTE.muted,
          }}
        >
          Saved
        </button>
      </div>

      {activeTab === "my" && (
        <>
          <button
            type="button"
            className="btn-pressable"
            onClick={onOpenCreateBank}
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
            Create new category
          </button>
          <button
            type="button"
            className="btn-pressable"
            onClick={onOpenImportExport}
            style={{
              width: "100%",
              borderRadius: 14,
              background: PALETTE.muted,
              color: "#FFF",
              boxShadow: "0 4px 0 #4A4A4A",
              padding: "11px 16px",
              fontSize: 16,
              marginBottom: 14,
            }}
          >
            Import / Export
          </button>

          <input
            className="cwb-input"
            value={mySearchQuery}
            onChange={(e) => setMySearchQuery(e.target.value)}
            placeholder="Search categories"
            style={{
              width: "100%",
              padding: "7px 14px",
              borderRadius: 999,
              border: `2px solid ${PALETTE.border}`,
              fontSize: 16,
              lineHeight: 1.2,
              fontWeight: 700,
              background: "#FFF",
              color: PALETTE.text,
              marginBottom: 10,
            }}
          />

          {editorMode && (
            <div style={{
              background: PALETTE.card,
              borderRadius: 16,
              border: `2px solid ${PALETTE.border}`,
              padding: 14,
              marginBottom: 14,
            }}>
              <p style={{ fontWeight: 800, fontSize: 14, color: PALETTE.text, textTransform: "uppercase", letterSpacing: 1 }}>
                Edit List
              </p>
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                <input
                  className="cwb-input"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="List name"
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
                  placeholder="Enter words separated by commas"
                  rows={4}
                  style={{
                    resize: "vertical",
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
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="btn-pressable"
                    onClick={handleSave}
                    style={{
                      flex: 1,
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
                  <button
                    type="button"
                    className="btn-pressable"
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

          <div style={{
            background: "#FFF",
            borderRadius: 16,
            border: `2px solid ${PALETTE.border}`,
            padding: 12,
            marginBottom: 14,
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
                  onChange={(e) => onSortModeChange?.(e.target.value)}
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
                  }}
                >
                  <option value={CUSTOM_WORD_BANK_SORT_MODE_RECENTLY_PLAYED}>
                    Recently played
                  </option>
                  <option value={CUSTOM_WORD_BANK_SORT_MODE_ORDER_OF_SAVING}>
                    Order of saving
                  </option>
                </select>
                <button
                  type="button"
                  className="btn-pressable"
                  disabled={!hasSavedCategories}
                  onClick={() => setIsClearAllConfirmOpen(true)}
                  style={{
                    borderRadius: 999,
                    padding: "6px 12px",
                    fontSize: 12,
                    fontFamily: "'Fredoka One', cursive",
                    background: hasSavedCategories ? PALETTE.primary : "#E7E7E7",
                    color: hasSavedCategories ? "#FFF" : "#AAA",
                    boxShadow: hasSavedCategories ? `0 3px 0 ${darken(PALETTE.primary)}` : "none",
                    cursor: hasSavedCategories ? "pointer" : "not-allowed",
                    whiteSpace: "nowrap",
                  }}
                >
                  Delete all
                </button>
              </div>
            </div>
            {filteredMyBanks.length === 0 ? (
              <p style={{ textAlign: "center", color: "#BBB", fontWeight: 700, padding: "10px 0" }}>
                {normalizedMySearchQuery ? "No results" : "No custom categories available"}
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filteredMyBanks.map((bank) => {
                  const isSelected = selectedBankIds.includes(bank.id);
                  return (
                    <div
                      key={bank.id}
                      className={selectable ? "btn-pressable" : undefined}
                      role={selectable ? "button" : undefined}
                      tabIndex={selectable ? 0 : undefined}
                      aria-pressed={selectable ? isSelected : undefined}
                      onClick={() => {
                        if (selectable) onToggleSelection(bank.id);
                      }}
                      onKeyDown={(e) => {
                        if (!selectable) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onToggleSelection(bank.id);
                        }
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
                          type="button"
                          className="btn-pressable"
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
                          type="button"
                          className="btn-pressable"
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
        </>
      )}

      {activeTab === "browse" && (
        <>
          <input
            className="cwb-input"
            value={browseSearchQuery}
            onChange={(e) => setBrowseSearchQuery(e.target.value)}
            placeholder="Search categories"
            style={{
              width: "100%",
              padding: "7px 14px",
              borderRadius: 999,
              border: `2px solid ${PALETTE.border}`,
              fontSize: 16,
              lineHeight: 1.2,
              fontWeight: 700,
              background: "#FFF",
              color: PALETTE.text,
              marginBottom: 10,
            }}
          />
          <div style={{
            background: "#FFF",
            borderRadius: 16,
            border: `2px solid ${PALETTE.border}`,
            padding: 12,
            marginBottom: 14,
          }}>
            {browseThemeSections.length === 0 ? (
              <p style={{ textAlign: "center", color: "#BBB", fontWeight: 700, padding: "10px 0" }}>
                {normalizedBrowseSearchQuery ? "No results" : "No predefined categories available"}
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {browseThemeSections.map((theme) => (
                  <div
                    key={theme.id}
                    style={{
                      borderRadius: 12,
                      border: `2px solid ${PALETTE.border}`,
                      background: "#FFF",
                      overflow: "hidden",
                    }}
                  >
                    <button
                      type="button"
                      className="btn-pressable"
                      disabled={isBrowseSearching}
                      onClick={() => toggleThemeExpansion(theme.id)}
                      style={{
                        width: "100%",
                        background: "#FFF",
                        color: PALETTE.text,
                        padding: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                        borderBottom: theme.isExpanded ? `1px solid ${PALETTE.border}` : "none",
                        cursor: isBrowseSearching ? "default" : "pointer",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 16,
                          fontWeight: 800,
                          textAlign: "left",
                          minWidth: 0,
                        }}
                      >
                        {theme.label}
                      </span>
                      <span style={{ fontSize: 14, color: PALETTE.muted, fontWeight: 800 }}>
                        {theme.isExpanded ? "Hide" : "Show"}
                      </span>
                    </button>

                    {theme.isExpanded ? (
                      <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                        {theme.visibleItems.map((bank) => {
                          const isSaved = isPredefinedBankSaved(bank);

                          return (
                            <div
                              key={bank.name}
                              style={{
                                borderRadius: 12,
                                border: `2px solid ${PALETTE.border}`,
                                background: "#FFF",
                                padding: "10px 12px",
                                display: "flex",
                                gap: 10,
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                            >
                              <div style={{ minWidth: 0 }}>
                                <p style={{ fontWeight: 800, fontSize: 16, color: PALETTE.text }}>
                                  {bank.name}
                                </p>
                                <p style={{ fontSize: 12, color: PALETTE.muted, fontWeight: 700 }}>
                                  {bank.words.slice(0, 3).join(", ")}
                                </p>
                              </div>
                              <button
                                type="button"
                                className="btn-pressable"
                                disabled={isSaved}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isSaved) onSavePredefinedBank?.(bank);
                                }}
                                style={{
                                  borderRadius: 10,
                                  background: isSaved ? "#D4D8DF" : PALETTE.blue,
                                  color: "#FFF",
                                  fontSize: 12,
                                  padding: "6px 12px",
                                  boxShadow: isSaved ? "none" : "0 3px 0 #37939B",
                                  opacity: isSaved ? 0.8 : 1,
                                }}
                              >
                                {isSaved ? "Saved" : "Save"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p
                        style={{
                          padding: "0 12px 12px",
                          fontSize: 12,
                          color: PALETTE.muted,
                          fontWeight: 700,
                        }}
                      >
                        {theme.previewNames.join(", ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

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
        {backButtonLabel}
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

      {isClearAllConfirmOpen && (
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
              marginBottom: 10,
              lineHeight: 1.2,
            }}>
              Delete all categories?
            </p>
            <p style={{
              textAlign: "center",
              color: PALETTE.muted,
              fontWeight: 700,
              fontSize: 14,
              lineHeight: 1.35,
              marginBottom: 14,
            }}>
              This will permanently delete all your custom categories.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
              <ModalPillButton color={PALETTE.muted} onClick={() => setIsClearAllConfirmOpen(false)}>
                Cancel
              </ModalPillButton>
              <ModalPillButton color={PALETTE.primary} onClick={confirmClearAll}>
                Delete
              </ModalPillButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
