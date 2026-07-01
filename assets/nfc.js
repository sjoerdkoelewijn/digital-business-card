import { loadContact, isComplete, buildVCard } from "./contact-store.js";

const statusEl = document.getElementById("nfc-status");
const btn = document.getElementById("btn-write");

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle("nfc-status--error", isError);
}

async function writeTag() {
  const contact = loadContact();
  if (!isComplete(contact)) {
    setStatus("Vul eerst je gegevens in op de kaart voordat je een tag schrijft.", true);
    return;
  }

  if (location.protocol !== "https:" && location.hostname !== "localhost") {
    setStatus("Web NFC vereist een HTTPS-verbinding.", true);
    return;
  }

  const vcard = buildVCard(contact);
  const encoder = new TextEncoder();

  try {
    setStatus("Houd de tag tegen de achterkant van je telefoon…");
    const ndef = new NDEFReader();
    await ndef.write({
      records: [
        { recordType: "mime", mediaType: "text/vcard", data: encoder.encode(vcard) },
      ],
    });
    setStatus("Gelukt! De tag is geprogrammeerd. Dit hoefde je maar één keer te doen.");
  } catch (error) {
    setStatus(`Schrijven mislukt: ${error.message || error}`, true);
  }
}

function init() {
  if (!("NDEFReader" in window)) {
    setStatus(
      "Web NFC wordt niet ondersteund in deze browser. Open deze pagina in Chrome op Android om een tag te schrijven.",
      true,
    );
    btn.disabled = true;
    return;
  }

  btn.addEventListener("click", () => {
    setStatus("Schrijven…");
    writeTag();
  });
}

init();
