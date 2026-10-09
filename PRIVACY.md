# Privacy Policy — KDMID — My People

Effective date: 2026-10-09. Maintainer: [ProjectNotFound404](https://github.com/ProjectNotFound404). Source and support: [ProjectNotFound404/kdmid](https://github.com/ProjectNotFound404/kdmid).

## Purpose and information handled

This unofficial Chrome extension lets you save person profiles locally and reuse them in the participant form on `https://notary.kdmid.ru/`. Profiles may include names, sex, birth details, citizenship, passport or other identity-document details, address, tax and pension identifiers, and notes that you enter or import.

The vault password is processed locally to derive an encryption key; the password itself is not saved. A backup password is processed locally when you import an encrypted file. The extension reads the active tab's URL to check the portal domain and reads relevant person-form fields to fill them and detect conflicting values. It does not access your browsing history, messages, portal passwords, application numbers, consent fields, or document text.

## Storage and protection

Saved profiles are encrypted using AES-256-GCM, with a password-derived PBKDF2-SHA256 key. The encrypted vault stays in the current browser profile's `chrome.storage.local`; Chrome Sync is not used. While unlocked, the key is held temporarily in Chrome's in-memory `chrome.storage.session`, restricted to trusted extension contexts. Decrypted profiles are temporarily available in extension memory and its visible editor or popup.

The vault locks after browser restart, extension reload, manual locking, or 15 minutes of inactivity. Open extension lists and forms are cleared on locking, including unsaved edits. Already filled portal fields and downloaded files are not cleared by vault locking. A forgotten password cannot be recovered. Encryption does not protect an already unlocked browser from malware or someone controlling the computer, and migrating legacy data cannot guarantee erasure of prior disk copies or browser backups.

## Sharing and network access

The extension has no server, analytics, advertising, tracking, or outgoing network requests of its own. The maintainer does not receive your profiles, passwords, or backups, and does not sell or use them for advertising or profiling.

Only when you click **Заполнить** is the chosen person's data placed into the official portal's form. Portal scripts can then read those fields and handle them according to the portal's own rules, including any submission you perform. The extension does not submit or register applications. Chrome, the portal, and sites you open through support links have their own network behavior and privacy policies.

## Backups, retention, and deletion

New exports are encrypted JSON files protected by the vault password in effect when exported. You choose where the browser saves them and whether to share them. Legacy unencrypted backup files remain readable until you remove them yourself; importing them encrypts the resulting saved profiles, not the original files.

Profiles remain until you delete them in **Мои люди** or remove the extension. Deleting a profile updates the local vault but does not delete copies in prior exports, browser backups, or portal forms. Removing the extension clears its storage but does not delete downloaded backups. You can view, edit, delete, export, and import your profiles using the extension. No data retention service or password recovery service is provided.

## Support and changes

Contact the maintainer through [GitHub Issues](https://github.com/ProjectNotFound404/kdmid/issues). Issues are public: describe problems using fictitious examples and do not attach passports, real profiles, passwords, or backups. GitHub handles information you submit under [its privacy statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement).

Changes to data handling will be documented here and in release notes. The extension's use of information is limited to the user-facing profile-storage, backup, and form-filling features described above.
