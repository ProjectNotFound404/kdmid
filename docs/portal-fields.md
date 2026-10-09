# Person Form on notary.kdmid.ru

Inspected in Chrome on 2026-10-09 using a new, unregistered draft. This reference records the selectors used by the person autofill extension in `extension/`.

## Reaching the Form

1. Open `https://notary.kdmid.ru/` and choose **НОВОЕ ЗАЯВЛЕНИЕ**.
2. Close the recent-applications overlay if it obscures the form.
3. Open the city dropdown and choose a city option; typing a city alone does not select it.
4. Choose **Удостоверение доверенности**.
5. Enter and confirm a draft password. Leave **Код обработки** blank unless needed.
6. Review the personal-data consent and choose **Продолжить**.
7. The portal assigns a draft number. Choose **Продолжить** again.
8. The first person's form opens on **3. Персональные данные**. The initial role is **доверитель**.

## Observed Field Identifiers

| Identifier | Field | Control |
| --- | --- | --- |
| `sex.M`, `sex.F` | Sex | Radio buttons; hidden value in `sex` |
| `fam` | Surname | Text input |
| `im` | First name | Text input |
| `ot` | Patronymic | Text input |
| `ot.notvalue` | No patronymic | Checkbox |
| `birth` | Date of birth | Hidden input with editable date segments |
| `birthplace` | Place of birth | Text input |
| `passcode` | Identity document type | Custom dropdown with hidden input |
| `citizenship` | Citizenship | Custom dropdown with hidden input |
| `namelat` | Name in Latin letters | Conditional text input |
| `passseries` | Document series | Text input |
| `passseries.notvalue` | No series | Conditional checkbox |
| `passnumber` | Document number | Text input |
| `passissuedate` | Issue date | Hidden input with editable date segments |
| `passissuer` | Issuing authority | Textarea |
| `country` | Address country | Custom dropdown with hidden input |
| `address` | Address | Textarea |
| `inn` | INN, if available | Masked text input |
| `snils` | SNILS, if available | Masked text input |
| `note` | Note | Textarea |

The `role` field is read-only in the initial form. Application identifiers, passwords, processing codes, consent controls, and document text must be outside the person-profile allowlist.

## Dependencies and Custom Controls

- Selecting sex enables the surname, first name, and patronymic controls.
- Selecting a document type configures the document fields and citizenship. A Russian international passport sets citizenship to **РОССИЙСКАЯ ФЕДЕРАЦИЯ**.
- A foreign passport reveals `namelat` and allows the no-series checkbox.
- Dropdown options live inside `.allzgsvalue .textex-container .option` and carry `data-value`. Scope the dropdown to the relevant field's wrapper, because country names repeat in multiple lists.
- Observed document codes: `dt_22` for a Russian international passport, `dt_21` for a Russian domestic passport, and `dt_10` for a foreign passport.
- Dates use three `.dateinput-input` contenteditable spans inside a `.dateinput-container`, adjacent to the hidden field. Updating only the hidden value can leave the visible control inconsistent.
- The portal uses jQuery-based widgets. Filling must trigger the appropriate widget events and then check the displayed and backing values.
- The country search widget handles keyboard events; its typed search text is separate from the selected country.
- `data-disabled` and `data-view` retain their initial values after dependency changes. Check live `disabled` properties, wrapper attributes, and computed visibility instead of treating those metadata attributes as current state.
- Date updates are deferred by the widget for approximately 100 milliseconds after the last segment loses focus. Wait for the backing value before reporting success.

## Extension Scope

Save one person's fields as a named local profile, then fill the currently open person form from that profile. Show the fields before saving and filling. Keep adding the person, page navigation, consent, and registration under user control. Preserve the current role when applying a profile to another participant.

## Address Country Snapshot

The address dropdown was read directly from `#country` on 2026-10-09. Its 205 `.textex-items .option` entries are saved in `extension/countries.js`, preserving order, case, punctuation, and spelling. Every entry's `data-value` equals its displayed `.vertical-center` text. This list is specific to address countries, rather than citizenship or consular cities.

The captured JSON array's FNV-1a checksum over UTF-16 code units is `5b16941e`; the local array was checked against that capture. The extension uses an accessible combobox for filtering and keyboard selection. Only complete known names can be saved through the editor. Existing unknown text remains readable/exportable for correction.

## Verification Boundaries

Verified navigation to the first person form, sex-dependent name fields, Russian international / foreign passport field changes, and stale metadata attributes. No person was added and the draft was not registered. DOM tests cover profile filling, masks, delayed date updates, and role preservation. Extension installation and a complete fill on the live portal, including later participant forms, still require manual verification.
