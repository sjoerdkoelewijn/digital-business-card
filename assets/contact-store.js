import { contact as defaultContact } from "../data/contact.js";

const STORAGE_KEY = "visitekaartje-contact";

export function loadContact() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultContact);
    const stored = JSON.parse(raw);
    return {
      ...structuredClone(defaultContact),
      ...stored,
      fields: Array.isArray(stored.fields) ? stored.fields : structuredClone(defaultContact.fields),
    };
  } catch {
    return structuredClone(defaultContact);
  }
}

export function saveContact(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function newFieldId() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `f-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function isComplete(c) {
  const hasContactField = (c.fields || []).some(
    (f) => (f.kind === "phone" || f.kind === "email") && f.value && f.value.trim(),
  );
  return Boolean(c.firstName && c.lastName && hasContactField);
}

function escapeVCard(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "\\n");
}

function toAbsoluteUrl(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function buildVCard(c) {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapeVCard(c.lastName)};${escapeVCard(c.firstName)};;;`,
    `FN:${escapeVCard(c.firstName)} ${escapeVCard(c.lastName)}`,
  ];

  for (const field of c.fields || []) {
    const value = (field.value ?? "").trim();
    if (!value) continue;

    switch (field.kind) {
      case "phone":
        lines.push(`TEL;TYPE=CELL:${escapeVCard(value)}`);
        break;
      case "email":
        lines.push(`EMAIL:${escapeVCard(value)}`);
        break;
      case "url":
        lines.push(`URL:${escapeVCard(toAbsoluteUrl(value))}`);
        break;
      case "address": {
        const [street = "", ...rest] = value.split("\n");
        lines.push(`ADR;TYPE=HOME:;;${escapeVCard(street)};${escapeVCard(rest.join(", "))};;;`);
        break;
      }
      default:
        break;
    }
  }

  lines.push("END:VCARD");
  return lines.join("\r\n");
}
