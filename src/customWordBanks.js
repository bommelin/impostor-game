const CUSTOM_WORD_BANKS_KEY = "impostor_custom_word_banks_v1";

const safeParse = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const generateBankId = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `custom_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

export const parseWordsInput = (input) => {
  const raw = Array.isArray(input) ? input.join(",") : String(input ?? "");
  const seen = new Set();
  const words = [];

  for (const piece of raw.split(",")) {
    const trimmed = piece.trim();
    if (!trimmed) continue;
    const normalized = trimmed.toLocaleLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    words.push(trimmed);
  }

  return words;
};

const normalizeBank = (bank) => {
  if (!bank || typeof bank !== "object") return null;
  const id = typeof bank.id === "string" ? bank.id : String(bank.id ?? "");
  if (!id) return null;
  const name = typeof bank.name === "string" && bank.name.trim() ? bank.name.trim() : "Custom";
  const createdAt = Number.isFinite(bank.createdAt) ? bank.createdAt : Date.now();
  const updatedAt = Number.isFinite(bank.updatedAt) ? bank.updatedAt : createdAt;

  return {
    id,
    name,
    words: parseWordsInput(Array.isArray(bank.words) ? bank.words : []),
    createdAt,
    updatedAt,
  };
};

export const loadCustomWordBanks = () => {
  const parsed = safeParse(localStorage.getItem(CUSTOM_WORD_BANKS_KEY));
  if (!Array.isArray(parsed)) return [];
  return parsed.map(normalizeBank).filter(Boolean);
};

export const saveCustomWordBanks = (banks) => {
  try {
    localStorage.setItem(CUSTOM_WORD_BANKS_KEY, JSON.stringify(banks));
  } catch {
    // Ignore storage failures.
  }
};

export const getNextCustomWordBankName = (banks) => {
  const used = new Set(
    banks.map((bank) => String(bank?.name ?? "").trim().toLocaleLowerCase()),
  );
  let index = 1;
  while (used.has(`custom ${index}`)) index += 1;
  return `Custom ${index}`;
};

export const createCustomWordBank = (banks, { name, wordsInput }) => {
  const now = Date.now();
  const trimmedName = String(name ?? "").trim();

  return [
    ...banks,
    {
      id: generateBankId(),
      name: trimmedName || getNextCustomWordBankName(banks),
      words: parseWordsInput(wordsInput),
      createdAt: now,
      updatedAt: now,
    },
  ];
};

export const updateCustomWordBank = (banks, id, { name, wordsInput }) => {
  const now = Date.now();
  return banks.map((bank) => {
    if (bank.id !== id) return bank;
    const trimmedName = String(name ?? "").trim();
    return {
      ...bank,
      name: trimmedName || bank.name,
      words: parseWordsInput(wordsInput),
      updatedAt: now,
    };
  });
};

export const deleteCustomWordBank = (banks, id) => banks.filter((bank) => bank.id !== id);
