// src/utils/normalizeText.js
export const normalizeText = (text) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]|_/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
