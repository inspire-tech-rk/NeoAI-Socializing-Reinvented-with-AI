// 🔥 PURE ML (NO OPENAI)

const STOP_WORDS = [
  "the", "is", "and", "a", "an", "of", "to", "in"
];

// 🔹 CLEAN TEXT
const cleanText = (text = "") => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/gi, "")
    .split(" ")
    .filter((word) => word && !STOP_WORDS.includes(word));
};

// 🔹 SIMPLE TF VECTOR
const buildVector = (words) => {
  const map = {};
  words.forEach((w) => {
    map[w] = (map[w] || 0) + 1;
  });
  return map;
};

// 🔹 CONVERT VECTOR → ARRAY (for Mongo)
const vectorToArray = (vector) => {
  return Object.values(vector);
};

// 🔹 MAIN FUNCTION
export const processCaption = async (caption = "") => {
  try {
    const cleaned = cleanText(caption);

    // ✅ CATEGORY = top keywords
    const categories = cleaned.length
      ? [...new Set(cleaned)]
      : ["general"];

    // ✅ EMBEDDING = word frequency vector
    const vector = buildVector(cleaned);
    const embedding = vectorToArray(vector);

    return {
      embedding,
      categories,
    };

  } catch (err) {
    console.error("ML Processing Error:", err.message);

    return {
      embedding: [],
      categories: [caption.toLowerCase() || "general"],
    };
  }
};
