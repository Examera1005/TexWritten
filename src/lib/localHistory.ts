import type { ConversionHistoryItem } from "../types/ocr";

const STORAGE_KEY = "texwritten.history.v1";
const MAX_ITEMS = 12;

export function loadHistory(): ConversionHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistory(items: ConversionHistoryItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
}

export function addHistoryItem(item: ConversionHistoryItem): ConversionHistoryItem[] {
  const next = [item, ...loadHistory().filter((entry) => entry.id !== item.id)].slice(0, MAX_ITEMS);
  saveHistory(next);
  return next;
}

export function removeHistoryItem(id: string): ConversionHistoryItem[] {
  const next = loadHistory().filter((entry) => entry.id !== id);
  saveHistory(next);
  return next;
}
