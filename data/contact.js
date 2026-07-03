// Standaardgegevens voor het visitekaartje.
// Dit is alleen de fallback: zodra je in de app op "Gegevens bewerken"
// tikt, worden je eigen gegevens lokaal op je telefoon opgeslagen
// (localStorage) en hebben ze voorrang op wat hieronder staat.

export const contact = {
  photo: null, // vierkante foto als data-URL, ingesteld via de editor
  hidePhoto: false, // verbergt de foto + golf en start de kaart bij de naam
  firstName: "",
  lastName: "",
  phonetic: "", // optionele uitspraak, bv. "[ Chourde Kou-lee-weïne ]"
  accentColor: "#033D74",
  fields: [
    { id: "profession", kind: "text", label: "Profession", value: "" },
    { id: "email", kind: "email", label: "Email", value: "" },
    { id: "phone", kind: "phone", label: "Telephone", value: "" },
    { id: "address", kind: "address", label: "Address", value: "" },
    { id: "website", kind: "url", label: "Website", value: "" },
  ],
};
