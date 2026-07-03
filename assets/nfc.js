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
    setStatus("Fill in your details on the card first before writing a tag.", true);
    return;
  }

  if (location.protocol !== "https:" && location.hostname !== "localhost") {
    setStatus("Web NFC requires an HTTPS connection.", true);
    return;
  }

  const vcard = buildVCard(contact);
  const encoder = new TextEncoder();

  try {
    setStatus("Hold the tag against the back of your phone…");
    const ndef = new NDEFReader();
    await ndef.write({
      records: [
        { recordType: "mime", mediaType: "text/vcard", data: encoder.encode(vcard) },
      ],
    });
    setStatus("Done! The tag is programmed. You only had to do this once.");
  } catch (error) {
    setStatus(`Writing failed: ${error.message || error}`, true);
  }
}

function init() {
  if (!("NDEFReader" in window)) {
    setStatus(
      "Web NFC is not supported in this browser. Open this page in Chrome on Android to write a tag.",
      true,
    );
    btn.disabled = true;
    return;
  }

  btn.addEventListener("click", () => {
    setStatus("Writing…");
    writeTag();
  });
}

init();
