# KDMID — Person Autofill for Notarial Applications

[Русский](README.md) | **English**

**KDMID — My People** is a free, open-source Chrome extension that autofills participants' personal details on [notary.kdmid.ru](https://notary.kdmid.ru/), the Russian Ministry of Foreign Affairs consular notary portal. It helps reuse names, passport details, and addresses of principals and representatives when preparing powers of attorney for Russian consulates abroad.

Enter each person's details once, save a local profile, and select it when the participant form is open. Person profiles stay encrypted in your local Chrome profile. The developer does not receive profiles, passwords, or encryption keys, and data is neither stored on developer servers nor sent to the developer, cloud APIs, or analytics services. The extension decrypts profiles locally after unlocking; data enters the official portal form only when you click **Заполнить**. No application account, server, Docker, ChatGPT, Claude, or external API is required. Form filling uses ordinary JavaScript rather than AI.

## Use Cases

- Autofill a principal's or representative's passport details in a notarial application on `notary.kdmid.ru`.
- Save multiple people and reuse their details when preparing further consular powers of attorney.
- Fill a natural person's form from a saved profile instead of retyping their name, identity document, and address.
- Transfer saved profiles between computers using local encrypted JSON export and import.

This is an independent, unofficial helper. It fills person fields; document text, consulate selection, appointment booking, and application registration remain separate user actions on the relevant official services.

## Frequently Asked Questions

### How can I reuse passport details on notary.kdmid.ru?

Save a person in **KDMID — My People**. For another notarial application, choose the participant type on the portal, open the natural person's form, and click **Заполнить** with the saved profile selected. Names, identity-document details, and addresses can be reused without retyping.

### Can I save several principals and representatives?

Yes. Create a separate profile for each person. A profile can be reused across applications and participant roles; choose the principal, representative, or other role on the portal before filling.

### Does this help prepare a power of attorney at a Russian consulate?

Yes, it fills participants' personal details on `notary.kdmid.ru`. Prepare the power-of-attorney text separately. The extension does not book consular appointments or register applications and is not an official Ministry of Foreign Affairs service.

### Where do passport details go? Does the extension use AI?

The developer does not receive profiles. They stay encrypted on your computer; no AI, cloud APIs, or analytics are used. Clicking **Заполнить** puts data into the official portal form, where its scripts can read it. See the [privacy policy](PRIVACY.md).

### Can I transfer people to another computer?

Yes. Export an encrypted JSON backup, transfer the file, and import it using the password in effect when exported. Legacy unencrypted backups can also be imported. Export before removing the extension, since removal clears its storage.

### Is the extension free and open source?

Yes. Source code is available at [ProjectNotFound404/kdmid](https://github.com/ProjectNotFound404/kdmid) under the MIT License. It requires desktop Chrome, with no server, Docker, or application account.

## Workflow

1. Open the extension and choose **Мои люди — добавить или изменить**.
2. Set a vault password of at least 12 characters on first use. Existing profiles migrate automatically. Then enter a person's details and choose **Сохранить человека**. Repeat for other people.
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

The prototype is not published in the Chrome Web Store. Developer instructions: [publishing in Chrome Web Store](docs/chrome-web-store.md). Update it by replacing its files and choosing **Reload** on `chrome://extensions`. Use the same extension folder to retain its identity and profiles. Do not remove the installed extension to update it: removing it deletes its local storage. After reloading, reopen or refresh the **Мои люди** tab to see updated controls.

## Export and Import People

Unlock **Мои люди** and choose **Экспорт людей** to download an encrypted JSON backup of all saved profiles. Save current edits first; export reads saved data only. Keep the password: the backup cannot be recovered without it. Older downloaded files remain unencrypted; updating the extension does not change them. Keep backups outside this source repository.

Enter the password used when the backup was exported in **Пароль импортируемого файла**, then choose **Импорт людей** and select the file. Its password may differ from the current vault password. Import validates the complete file before writing, keeps existing people, and skips identical profiles. If an imported identifier matches an existing person with different details, the imported record receives a new identifier; the existing record is preserved. Import leaves unsaved editor changes intact.

New backups use `kdmid-encrypted-vault`, version 1. Legacy unencrypted `kdmid-person-profiles` version 1 files can still be imported without a file password. Limits: 10 MB for encrypted files, 5 MB for legacy files, and 1000 profiles in the vault; Chrome storage quotas also apply. Import and export remain local.

## Data and Permissions

Profiles are encrypted in `chrome.storage.local` using AES-256-GCM with a fresh random IV per write. A key is derived from the password using PBKDF2-SHA256 (600,000 iterations and a random salt). The password is never saved. Chrome Sync is not used.

While unlocked, the key is temporarily held in Chrome's in-memory `chrome.storage.session`, restricted to trusted extension contexts. Browser restart, extension reload, or 15 minutes of inactivity locks the vault; a button also locks it manually. Open lists and forms are cleared, including unsaved edits. A service worker serializes writes so concurrent extension tabs do not lose profiles.

**A forgotten password cannot be recovered.** Use a unique long passphrase and a password manager. Encryption protects saved profiles and new exports; it cannot protect an unlocked browser from malware or someone already controlling it. Migration cannot guarantee erasure of previous copies from disk or Chrome backups. Removing the extension removes its saved profiles. Use **Экспорт людей** before removing the extension or moving to another computer.

The extension has no backend, analytics, external libraries, or outgoing network requests. Clicking **Заполнить** places the chosen profile's data into the official portal page; page scripts can read those fields at that point. Chrome and the portal have their own network behavior.

`activeTab` permits on-demand page access after the user opens the extension; `scripting` fills the form, `storage` manages the vault, and `alarms` handles automatic locking. The filling function checks for the exact HTTPS portal origin and one visible `allactors` form before doing anything.

Existing differing data requires confirmation before replacement. Confirmed replacement also clears accessible text/date/country fields that are empty in the selected profile to avoid mixing people's details. Unsupported or unavailable fields are reported rather than silently treated as filled. The extension never reads or writes portal passwords, application identifiers, consent, or document text.

## Development

Source files live in `extension/`; DOM and storage tests live in `tests/`. JavaScript uses ES modules, two-space indentation, and no build framework.

```sh
npm ci
npm run check
npm test
npm run package
```

The last command writes two ZIPs under `dist/`: `kdmid-person-autofill.zip` for unpacked installation and `kdmid-chrome-web-store.zip` for store upload. Python 3 is only needed to package a release.

Tests use Node's test runner and jsdom. They cover role preservation, hidden/disabled controls, dates, document dependencies, replacement, profile persistence, encryption, legacy migration, locking, concurrent writes, and encrypted backup handling. The observed live portal structure is documented in [docs/portal-fields.md](docs/portal-fields.md).

Portal navigation, document-dependent fields, and the address-country list have been inspected live. Extension installation and an end-to-end fill on the live portal still need manual verification. Partial birth dates are not supported by the profile editor. Changes to the portal may require an extension update.

## License and Liability

The project is distributed under the [MIT License](LICENSE). You may use, modify, and redistribute it while retaining the copyright notice and license text.

The software is provided "as is", without guarantees of operation, accurate form filling, or fitness for a particular purpose. The license includes a warranty disclaimer and limitation of authors' and copyright holders' liability. These provisions operate only to the extent permitted by applicable law and do not guarantee immunity from all liability.

Review filled details before adding a person or registering an application, and keep profile backups. The extension provides no legal advice and does not guarantee acceptance of documents by a consulate. The project is not affiliated with the Russian Ministry of Foreign Affairs, consulates, or Google, and is not their official product.
