import { loadContact, saveContact, isComplete, buildVCard, newFieldId } from "./contact-store.js";
import { qrIconSvg, trashIconSvg, personIconSvg } from "./icons.js";

const KIND_LABELS = { text: "Tekst", phone: "Telefoon", email: "E-mail", url: "Link", address: "Adres" };
const OUTPUT_PHOTO_SIZE = 640;

let pendingPhoto = null; // dataURL staged in the editor, applied on save

/* ---------- theming ---------- */

// Perceived brightness (YIQ) of a #rrggbb color, 0 (black) - 255 (white).
function getBrightness(hex) {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
  if (!match) return 0;
  const [r, g, b] = match.slice(1).map((h) => parseInt(h, 16));
  return (r * 299 + g * 587 + b * 114) / 1000;
}

// The card background color is user-chosen and can end up light, so the
// fixed "white text on accent" theme flips to dark text when needed instead
// of letting text disappear.
function applyAccentColor(color) {
  if (!color) return;
  const root = document.documentElement.style;
  root.setProperty("--accent", color);

  const isLight = getBrightness(color) > 150;
  if (isLight) {
    root.setProperty("--text-on-accent", "#0f172a");
    root.setProperty("--text-on-accent-muted", "rgb(15 23 42 / 0.55)");
    root.setProperty("--border-on-accent", "rgb(15 23 42 / 0.15)");
    // a light accent color also reads poorly as text on the white QR tile /
    // "add to contacts" button, so fall back to a dark neutral there too
    root.setProperty("--accent-on-surface", "#0f172a");
  } else {
    root.setProperty("--text-on-accent", "#ffffff");
    root.setProperty("--text-on-accent-muted", "rgb(255 255 255 / 0.5)");
    root.setProperty("--border-on-accent", "rgb(255 255 255 / 0.15)");
    root.setProperty("--accent-on-surface", color);
  }
}

/* ---------- card rendering ---------- */

function renderFieldValue(container, field) {
  container.replaceChildren();
  const value = field.value || "";

  if (field.kind === "address") {
    for (const line of value.split("\n")) {
      if (!line) continue;
      const div = document.createElement("div");
      div.textContent = line;
      container.appendChild(div);
    }
    if (!container.childNodes.length) container.textContent = "—";
    return;
  }

  if (!value) {
    container.textContent = "—";
    return;
  }

  if (field.kind === "phone") {
    const a = document.createElement("a");
    a.href = `tel:${value.replace(/\s+/g, "")}`;
    a.textContent = value;
    container.appendChild(a);
  } else if (field.kind === "email") {
    const a = document.createElement("a");
    a.href = `mailto:${value}`;
    a.textContent = value;
    container.appendChild(a);
  } else if (field.kind === "url") {
    const a = document.createElement("a");
    a.href = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = value;
    container.appendChild(a);
  } else {
    container.textContent = value;
  }
}

function renderCard(c) {
  applyAccentColor(c.accentColor);

  document.getElementById("card-name").textContent = `${c.firstName} ${c.lastName}`.trim() || "Naam onbekend";

  const phoneticEl = document.getElementById("card-phonetic");
  if (c.phonetic) {
    phoneticEl.textContent = c.phonetic;
    phoneticEl.hidden = false;
  } else {
    phoneticEl.hidden = true;
  }

  const photoImg = document.getElementById("card-photo");
  const placeholder = document.getElementById("photo-placeholder");
  if (c.photo) {
    photoImg.src = c.photo;
    photoImg.hidden = false;
    placeholder.hidden = true;
  } else {
    photoImg.hidden = true;
    placeholder.hidden = false;
    placeholder.innerHTML = personIconSvg;
  }

  const list = document.getElementById("card-fields");
  list.replaceChildren();
  for (const field of c.fields || []) {
    if (!field.label && !field.value) continue;
    const li = document.createElement("li");
    li.className = "field";

    const label = document.createElement("span");
    label.className = "field-label";
    label.textContent = field.label || KIND_LABELS[field.kind] || "";
    li.appendChild(label);

    const valueEl = document.createElement("div");
    valueEl.className = "field-value";
    renderFieldValue(valueEl, field);
    li.appendChild(valueEl);

    list.appendChild(li);
  }

  const incomplete = !isComplete(c);
  document.getElementById("incomplete-hint").hidden = !incomplete;
  document.getElementById("btn-open-qr").disabled = incomplete;
}

function renderQr(vcardText) {
  const target = document.getElementById("qr-code");
  target.innerHTML = "";
  const qr = qrcode(0, "M");
  qr.addData(vcardText);
  qr.make();
  target.innerHTML = qr.createSvgTag({ scalable: true });
}

/* ---------- photo crop ---------- */

function resetCropUI() {
  document.getElementById("photo-crop-wrap").hidden = true;
  document.getElementById("focus-marker").hidden = true;
  document.getElementById("photo-input").value = "";
}

function initPhotoCrop() {
  const input = document.getElementById("photo-input");
  const cropWrap = document.getElementById("photo-crop-wrap");
  const viewport = document.getElementById("photo-crop-viewport");
  const img = document.getElementById("photo-crop-img");
  const marker = document.getElementById("focus-marker");
  const preview = document.getElementById("photo-preview");
  const removeBtn = document.getElementById("btn-remove-photo");

  let focus = { x: 0.5, y: 0.5 };

  document.getElementById("btn-choose-photo").addEventListener("click", () => input.click());

  input.addEventListener("change", () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      img.src = reader.result;
      cropWrap.hidden = false;
      marker.hidden = true;
      focus = { x: 0.5, y: 0.5 };
    };
    reader.readAsDataURL(file);
  });

  function setFocusFromEvent(event) {
    const rect = viewport.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    focus = { x, y };
    marker.hidden = false;
    marker.style.left = `${x * 100}%`;
    marker.style.top = `${y * 100}%`;
  }

  viewport.addEventListener("click", setFocusFromEvent);

  document.getElementById("btn-cancel-photo").addEventListener("click", () => {
    resetCropUI();
  });

  document.getElementById("btn-use-photo").addEventListener("click", () => {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const side = Math.min(w, h);
    const sx = Math.min(Math.max(focus.x * w - side / 2, 0), w - side);
    const sy = Math.min(Math.max(focus.y * h - side / 2, 0), h - side);

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_PHOTO_SIZE;
    canvas.height = OUTPUT_PHOTO_SIZE;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, sx, sy, side, side, 0, 0, OUTPUT_PHOTO_SIZE, OUTPUT_PHOTO_SIZE);

    pendingPhoto = canvas.toDataURL("image/jpeg", 0.85);
    preview.src = pendingPhoto;
    preview.hidden = false;
    removeBtn.hidden = false;
    resetCropUI();
  });

  removeBtn.addEventListener("click", () => {
    pendingPhoto = null;
    preview.hidden = true;
    preview.src = "";
    removeBtn.hidden = true;
  });
}

/* ---------- field editor ---------- */

function createFieldRow(field) {
  const li = document.createElement("li");
  li.className = "field-editor-row";
  li.dataset.id = field.id || newFieldId();

  const top = document.createElement("div");
  top.className = "field-editor-row__top";

  const select = document.createElement("select");
  select.className = "f-kind";
  for (const [kind, text] of Object.entries(KIND_LABELS)) {
    const option = document.createElement("option");
    option.value = kind;
    option.textContent = text;
    if (kind === field.kind) option.selected = true;
    select.appendChild(option);
  }

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "field-delete-btn";
  deleteBtn.setAttribute("aria-label", "Veld verwijderen");
  deleteBtn.innerHTML = trashIconSvg;
  deleteBtn.addEventListener("click", () => li.remove());

  top.append(select, deleteBtn);

  const labelInput = document.createElement("input");
  labelInput.type = "text";
  labelInput.className = "f-label";
  labelInput.placeholder = "Label (bv. Profession)";
  labelInput.value = field.label || "";

  const valueControl = field.kind === "address" ? document.createElement("textarea") : document.createElement("input");
  if (valueControl.tagName === "TEXTAREA") {
    valueControl.rows = 2;
  } else {
    valueControl.type = "text";
  }
  valueControl.className = "f-value";
  valueControl.placeholder = "Waarde";
  valueControl.value = field.value || "";

  select.addEventListener("change", () => {
    const current = li.querySelector(".f-value");
    const newControl = select.value === "address" ? document.createElement("textarea") : document.createElement("input");
    if (newControl.tagName === "TEXTAREA") newControl.rows = 2;
    else newControl.type = "text";
    newControl.className = "f-value";
    newControl.placeholder = "Waarde";
    newControl.value = current.value;
    current.replaceWith(newControl);
  });

  li.append(top, labelInput, valueControl);
  return li;
}

function populateFieldEditor(fields) {
  const list = document.getElementById("field-editor-list");
  list.replaceChildren();
  for (const field of fields) {
    list.appendChild(createFieldRow(field));
  }
}

function readFieldsFromEditor() {
  const rows = document.querySelectorAll("#field-editor-list .field-editor-row");
  const fields = [];
  for (const row of rows) {
    const kind = row.querySelector(".f-kind").value;
    const label = row.querySelector(".f-label").value.trim();
    const value = row.querySelector(".f-value").value.trim();
    if (!label && !value) continue;
    fields.push({ id: row.dataset.id, kind, label, value });
  }
  return fields;
}

/* ---------- edit form ---------- */

function openEditForm(c) {
  const form = document.getElementById("edit-form");
  form.firstName.value = c.firstName;
  form.lastName.value = c.lastName;
  form.phonetic.value = c.phonetic || "";
  form.accentColor.value = c.accentColor || "#033d74";

  pendingPhoto = c.photo || null;
  const preview = document.getElementById("photo-preview");
  const removeBtn = document.getElementById("btn-remove-photo");
  if (c.photo) {
    preview.src = c.photo;
    preview.hidden = false;
    removeBtn.hidden = false;
  } else {
    preview.hidden = true;
    removeBtn.hidden = true;
  }
  resetCropUI();

  populateFieldEditor(c.fields || []);

  document.getElementById("edit-dialog").showModal();
}

function readForm() {
  const form = document.getElementById("edit-form");
  return {
    photo: pendingPhoto,
    firstName: form.firstName.value.trim(),
    lastName: form.lastName.value.trim(),
    phonetic: form.phonetic.value.trim(),
    accentColor: form.accentColor.value,
    fields: readFieldsFromEditor(),
  };
}

/* ---------- init ---------- */

function refresh() {
  const contact = loadContact();
  renderCard(contact);
  if (isComplete(contact)) {
    renderQr(buildVCard(contact));
  }
  return contact;
}

function init() {
  document.getElementById("btn-open-qr").innerHTML = qrIconSvg;

  let contact = refresh();

  initPhotoCrop();

  document.getElementById("btn-edit").addEventListener("click", () => openEditForm(contact));

  document.getElementById("edit-form").addEventListener("submit", (event) => {
    event.preventDefault();
    contact = readForm();
    saveContact(contact);
    document.getElementById("edit-dialog").close();
    refresh();
  });

  document.getElementById("btn-cancel-edit").addEventListener("click", () => {
    document.getElementById("edit-dialog").close();
  });

  document.getElementById("btn-add-field").addEventListener("click", () => {
    document.getElementById("field-editor-list").appendChild(createFieldRow({ id: newFieldId(), kind: "text", label: "", value: "" }));
  });

  document.getElementById("btn-open-qr").addEventListener("click", () => {
    document.getElementById("qr-dialog").showModal();
  });

  document.getElementById("btn-close-qr").addEventListener("click", () => {
    document.getElementById("qr-dialog").close();
  });

  if (!isComplete(contact)) {
    openEditForm(contact);
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    });
  }
}

init();
