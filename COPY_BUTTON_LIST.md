# Copy Button Implementation Tasks

- [ ] Add a Copy button to the Edit Modal popup, positioned to the left of Save and Cancel (order: Copy, Save, Cancel) and styled consistently with modal actions.
- [ ] Implement data extraction logic using yamlPath and parsedData (CVData) to support copying arrays, array items, and specific lines/bubbles within array items.
- [ ] Implement copy functionality: JSON.stringify the extracted data, copy to clipboard, and provide user feedback (e.g., tooltip or temporary message).
- [ ] Integrate the onCopy handler from EditableField to Edit Modal, ensuring correct logic for array, item, and line/bubble cases.
- [ ] Test the Copy button for all eligible fields (arrays, items, lines/bubbles) and confirm correct JSON is copied and feedback is shown.
