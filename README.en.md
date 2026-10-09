# KDMID Person Autofill

[Русский](README.md) | **English**

A local Chrome extension for saved person profiles on [notary.kdmid.ru](https://notary.kdmid.ru/).

## Workflow

1. Open the extension and choose **Мои люди — добавить или изменить**.
2. Enter a person's details and choose **Сохранить человека**. Repeat for other people.
3. On the portal, choose the participant type and open that person's data form.
4. Click the extension icon, select a saved person, and choose **Заполнить**.
5. Review the fields and choose **Добавить** on the portal yourself.

The participant role comes from the portal. The extension only fills the current natural person's form. It does not create applications, choose roles, advance pages, or register applications.

**Страна адреса** offers a searchable dropdown with the 205 address-country options captured from the portal on 2026-10-09. Names, values, punctuation, and order match the portal. Choose a complete country name; partial search text cannot be saved. Existing country capitalization is normalized when recognized. Unrecognized legacy country text is retained and can be corrected in the editor without losing the person's other details.

## Install the Prototype

No Docker, server, package installation, or build step is needed to use the extension.

1. Download this repository using **Code → Download ZIP** and extract it, or clone it. The extension files are in `extension/`.
2. Open `chrome://extensions` in desktop Chrome.
3. Enable **Developer mode** (**Режим разработчика**).
4. Choose **Load unpacked** (**Загрузить распакованное расширение**) and select the folder containing `manifest.json`.
5. Pin **КД МИД — мои люди** using Chrome's extensions menu.

The prototype is not published in the Chrome Web Store. Update it by replacing its files and choosing **Reload** on `chrome://extensions`. Use the same extension folder to retain its identity and profiles. Do not remove the installed extension to update it: removing it deletes its local storage. After reloading, reopen or refresh the **Мои люди** tab to see updated controls.

## Export and Import People

Open **Мои люди** and choose **Экспорт людей** to download a JSON backup containing all saved profiles. Save current edits first; export reads saved data only. The file contains unencrypted personal information and should be kept in a private location, outside this source repository.

Choose **Импорт людей** and select a backup to restore profiles in another installation. Import validates the complete file before writing, keeps existing people, and skips identical profiles. If an imported identifier matches an existing person with different details, the imported record receives a new identifier; the existing record is preserved. Import leaves unsaved editor changes intact.

Backups use the `kdmid-person-profiles` format, schema version 1. The import limit is 5 MB and 1000 people per file. Import and export are local and require no new extension permissions.

## Data and Permissions

Profiles are stored in `chrome.storage.local` on this computer, with access restricted to extension contexts. Chrome Sync is not used. Data is stored without application-level encryption; anyone with access to the browser profile may be able to read it. Removing the extension removes its saved profiles. Use **Экспорт людей** before removing the extension or moving to another computer.

The extension has no backend, analytics, external libraries, or outgoing network requests. Clicking **Заполнить** places the chosen profile's data into the official portal page; page scripts can read those fields at that point. Chrome and the portal have their own network behavior.

`activeTab` permits on-demand page access after the user opens the extension; `scripting` fills the form, and `storage` saves profiles. The filling function checks for the exact HTTPS portal origin and one visible `allactors` form before doing anything.

Existing differing data requires confirmation before replacement. Confirmed replacement also clears accessible text/date/country fields that are empty in the selected profile to avoid mixing people's details. Unsupported or unavailable fields are reported rather than silently treated as filled. The extension never reads or writes portal passwords, application identifiers, consent, or document text.

## Development

Source files live in `extension/`; DOM and storage tests live in `tests/`. JavaScript uses ES modules, two-space indentation, and no build framework.

```sh
npm ci
npm run check
npm test
npm run package
```

The last command writes an installable ZIP under `dist/`. Python 3 is only needed to package a release.

Tests use Node's test runner and jsdom. They cover role preservation, hidden/disabled controls, dates, document dependencies, replacement, and profile persistence. The observed live portal structure is documented in [docs/portal-fields.md](docs/portal-fields.md).

Portal navigation, document-dependent fields, and the address-country list have been inspected live. Extension installation and an end-to-end fill on the live portal still need manual verification. Partial birth dates are not supported by the profile editor. Changes to the portal may require an extension update.
