export const IMPORT_EXPORT_FORMAT_EXAMPLE = "[name:Category name, words:word1,word2,word3]|[name:Another, words:wordA,wordB]";

const FORMAT_HINT = `Format: ${IMPORT_EXPORT_FORMAT_EXAMPLE}`;

export const normalizeCategoryNameKey = (name) => String(name ?? "").trim().toLocaleLowerCase();

export const formatCustomCategoriesForExport = (categories) => (
  (Array.isArray(categories) ? categories : [])
    .map((category) => {
      const name = String(category?.name ?? "").trim();
      const words = (Array.isArray(category?.words) ? category.words : [])
        .map((word) => String(word ?? "").trim())
        .filter(Boolean)
        .join(",");
      return `[name:${name}, words:${words}]`;
    })
    .join("|")
);

export const parseImportCategoriesInput = (input) => {
  const rawInput = String(input ?? "");
  const trimmedInput = rawInput.trim();
  if (!trimmedInput) {
    return { categories: [], error: `No categories found. ${FORMAT_HINT}` };
  }

  const rawBlocks = trimmedInput.split("|");
  const categories = [];

  for (let index = 0; index < rawBlocks.length; index += 1) {
    const blockNumber = index + 1;
    const block = rawBlocks[index].trim();

    if (!block) {
      return {
        categories: [],
        error: `Block ${blockNumber} is empty. ${FORMAT_HINT}`,
      };
    }

    if (!block.startsWith("[") || !block.endsWith("]")) {
      return {
        categories: [],
        error: `Block ${blockNumber} must start with "[" and end with "]". ${FORMAT_HINT}`,
      };
    }

    const body = block.slice(1, -1).trim();
    if (!/^name\s*:/i.test(body)) {
      return {
        categories: [],
        error: `Missing "name:" section. ${FORMAT_HINT}`,
      };
    }

    const afterNamePrefix = body.replace(/^name\s*:/i, "");
    const wordsDividerMatch = afterNamePrefix.match(/,\s*words\s*:/i);
    if (!wordsDividerMatch || wordsDividerMatch.index === undefined) {
      return {
        categories: [],
        error: `Missing "words:" section. ${FORMAT_HINT}`,
      };
    }

    const wordsDividerIndex = wordsDividerMatch.index;
    const name = afterNamePrefix.slice(0, wordsDividerIndex).trim();
    const wordsRaw = afterNamePrefix
      .slice(wordsDividerIndex + wordsDividerMatch[0].length)
      .trim();

    if (!name) {
      return {
        categories: [],
        error: `Category name is empty. ${FORMAT_HINT}`,
      };
    }

    if (name.includes("|") || name.includes("]")) {
      return {
        categories: [],
        error: `Category name cannot include "|" or "]". ${FORMAT_HINT}`,
      };
    }

    if (!wordsRaw) {
      return {
        categories: [],
        error: `No words found. Add at least one word after "words:". ${FORMAT_HINT}`,
      };
    }

    if (wordsRaw.includes("|") || wordsRaw.includes("]")) {
      return {
        categories: [],
        error: `Words cannot include "|" or "]". ${FORMAT_HINT}`,
      };
    }

    const words = wordsRaw
      .split(",")
      .map((word) => word.trim())
      .filter(Boolean);
    if (words.length === 0) {
      return {
        categories: [],
        error: `No words found. Add at least one word after "words:". ${FORMAT_HINT}`,
      };
    }

    categories.push({ name, words });
  }

  return { categories, error: "" };
};
