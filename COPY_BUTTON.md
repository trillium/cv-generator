# COPY BUTTON ACTION PLAN

## Purpose

Create a Copy button that allows users to copy the content of a specific part of the resume as JSON. This enables easy sharing or interaction with LLMs (AI models).

## Scope

- The button should be available for:
  - A single bullet/item (e.g., `workExperience.0`)
  - An entire category/array (e.g., `workExperience`)
  - A specific line or bubble within an array item (e.g., `workExperience.0.lines.2`)

## Implementation Steps

1. **Design & Placement**

   - Add a Copy button to the Edit Modal popup (not in the hover ActionButtons section).
   - Place the Copy button to the left of the existing Save and Cancel buttons, so the order is: `Copy` `Save` `Cancel`.
   - The button should be visually consistent with other modal actions and visible whenever the modal is open for eligible fields (arrays or items).

2. **Data Extraction**

   - Use the `yamlPath` and `parsedData` (typed as `CVData`) to extract the relevant data for the field.
   - Ensure the extraction works for arrays, array items, and specific lines/bubbles within array items.

3. **Copy Functionality**

   - Convert the extracted data to a JSON string (using `JSON.stringify`).
   - Copy the JSON string to the clipboard using the Clipboard API.
   - Provide user feedback (e.g., tooltip or temporary message: "Copied!").

4. **Integration**

   - Pass an `onCopy` handler from EditableField to the Edit Modal.
   - Implement the handler in EditableField to perform extraction and copying.
   - Ensure the button is only shown when the field is eligible for copying (array, item, or line/bubble).

5. **Testing**
   - Verify the button appears for all eligible fields in the modal.
   - Test that the correct JSON is copied for each case.
   - Confirm user feedback is shown after copying.

## Copy Logic & Diagram

- All data is extracted from the parsed resume data, which is typed as `CVData` (see `src/types/cvdata.zod.ts`).
- The copy logic ensures the copied JSON matches the structure defined in `CVData` and `WorkExperience`.

```
CVData
│
├── workExperience (array)
│     │
│     ├── [0] (WorkExperience object)
│     │     ├── position
│     │     ├── company
│     │     ├── location
│     │     ├── icon
│     │     ├── years
│     │     ├── bubbles (string[])
│     │     └── lines (string[])
│     └── ...
└── ...
```

**Copy rules:**

- If `yamlPath` points to an array (e.g., `workExperience`): copy the array (type: `CVData['workExperience']`).
- If `yamlPath` points to an array item or any of its direct properties (e.g., `workExperience.0`, `workExperience.0.position`, `workExperience.0.company`): copy the full object (type: `WorkExperience`).
- If `yamlPath` points to a line or bubble (e.g., `workExperience.0.lines.2` or `workExperience.0.bubbles.1`):
  - Copy an object containing all general info for the item (position, company, location, icon, years, etc.)
  - And only the specific line or bubble, e.g.:
    ```json
    {
      "position": "...",
      "company": "...",
      "location": "...",
      "icon": "...",
      "years": "...",
      "line": "Just the specific line at index N"
    }
    ```

## Open Questions for Review

- Should the Copy button be available for all fields, or only for arrays and their items/lines?
- Should the copied JSON be pretty-printed or compact?
- Any specific feedback style preferred (e.g., tooltip, toast, inline message)?
- What should happen if the data is missing or copying fails?

---

**Review this plan and diagram and provide feedback or corrections before implementation.**
