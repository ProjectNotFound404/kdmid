# Publishing KDMID — My People in Chrome Web Store

Instructions checked against Google's documentation on 2026-10-09. Publishing is a manual developer-account action; no store submission has been made.

## Prepared files

Run `npm run package` from the repository root. It produces two different ZIPs:

| File | Use |
| --- | --- |
| `dist/kdmid-chrome-web-store.zip` | Upload to the store; `manifest.json` is at the ZIP root. |
| `dist/kdmid-person-autofill.zip` | Extract for local installation; files are inside a named folder. |

Store uploads must have the manifest at the root, as required by [Google's packaging instructions](https://developer.chrome.com/docs/webstore/prepare). Do not upload GitHub's **Download ZIP** archive.

Included: Manifest V3, local JavaScript, PNG icons at 16/32/48/128 pixels, and MIT license. The 128-pixel store icon is `extension/icon-128.png`; the 440×280 promotional tile is `docs/store-assets/small-promo.png`. An optional 1400×560 marquee banner is `docs/store-assets/marquee-promo.png`. Assets can be regenerated with `python3 scripts/generate_store_assets.py` using Pillow and Arial or DejaVu Sans; these are only asset-development dependencies.

The privacy policy is [PRIVACY.md](../PRIVACY.md). After pushing it, its public URL is `https://github.com/ProjectNotFound404/kdmid/blob/main/PRIVACY.md`.

## Before submitting

1. Run `npm run check`, `npm test`, and `npm run package`.
2. Load `extension/` in a fresh desktop Chrome profile and check password setup, adding/editing a fictitious person, export/import, manual locking, and unlocking. Never use real profiles for store screenshots or review credentials.
3. Open a new portal draft and test filling a natural-person form with fictitious data. Check that the chosen participant role and unrelated portal fields stay intact. Do not register the test application. Automated DOM tests and browser UI previews do not replace this installed-extension check.
4. Capture at least one real interface screenshot at **1280×800** (640×400 is also supported), with no real names, passports, or backups visible. Screenshots have not been generated in this repository. The store allows up to five; a profile-editor view and a popup view are useful. See [image requirements](https://developer.chrome.com/docs/webstore/images).
5. Export existing profiles before moving from an unpacked installation to a store installation: their extension IDs and storage may differ. Import the encrypted backup into the store copy.

## Register the publisher

Open the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole). Register your Google account, accept the developer agreement, and pay the one-time registration fee. Google currently lists a **US$5 fee** for a new publisher in its [publisher-account announcement](https://developer.chrome.com/blog/cws-role-expansion-developer-dashboard); confirm the amount shown during registration.

Enable [2-Step Verification](https://developer.chrome.com/docs/webstore/program-policies/two-step-verification). Set the public publisher name to **ProjectNotFound404** and verify a contact email that you monitor. The publisher name and contact information are displayed in the store; see [account setup](https://developer.chrome.com/docs/webstore/set-up-account). Registration, payment, and account verification are performed by you.

## Create the listing

Choose **Add new item / New item**, upload `dist/kdmid-chrome-web-store.zip`, and complete the listing. Google describes the [submission workflow here](https://developer.chrome.com/docs/webstore/publish).

Suggested fields:

| Field | Value |
| --- | --- |
| Name | КД МИД — мои люди |
| Language | Russian |
| Category | Productivity, if offered by the dashboard |
| Homepage | `https://github.com/ProjectNotFound404/kdmid` |
| Support | `https://github.com/ProjectNotFound404/kdmid/issues` |
| Privacy policy | `https://github.com/ProjectNotFound404/kdmid/blob/main/PRIVACY.md` |
| Icon | `extension/icon-128.png` |
| Small promo tile | `docs/store-assets/small-promo.png` |
| Marquee promo tile (optional) | `docs/store-assets/marquee-promo.png` |

Paste this Russian description:

> КД МИД — мои люди — бесплатное неофициальное расширение Chrome для автозаполнения персональных данных участников нотариальных заявлений на notary.kdmid.ru, портале Консульского департамента МИД России.
>
> Сохраните данные доверителя, поверенного или другого участника один раз: ФИО, сведения о паспорте или другом документе, гражданство и адрес. Затем выбирайте человека из списка и заполняйте его открытую форму при подготовке доверенности в российском консульстве.
>
> Возможности: несколько профилей людей; поиск страны адреса по списку портала; локальное хранение, защищённое отдельным паролем; зашифрованный экспорт и импорт; подтверждение замены отличающихся данных в форме.
>
> Ваши персональные данные хранятся в зашифрованном виде (AES-256-GCM) в вашем профиле Chrome на вашем компьютере. Разработчик не получает ваши профили, пароль или ключ шифрования и не имеет доступа к ним. Расширение не хранит данные на серверах разработчика и не отправляет их разработчику, в облачные API или сервисы аналитики.
>
> Для автозаполнения расширение расшифровывает данные локально после разблокировки хранилища. Только после вашего нажатия «Заполнить» выбранные данные попадают в форму официального портала notary.kdmid.ru и становятся доступны его скриптам. Новые файлы экспорта также зашифрованы; где их хранить и кому передавать, решаете вы.
>
> Расширение работает без ИИ, собственного сервера и аккаунта приложения.
>
> Тип участника выбирается на портале. Текст доверенности, выбор консульства, запись на приём и регистрация заявления выполняются пользователем. Расширение не является официальным продуктом МИД России или Google. Проверяйте заполненные поля перед дальнейшими действиями.
>
> Исходный код: https://github.com/ProjectNotFound404/kdmid. Лицензия MIT. Для работы нужен настольный Chrome. Забытый пароль хранилища восстановить нельзя.

English secondary description, usable in a later localized listing:

> KDMID — My People is a free, unofficial Chrome extension for reusing names, passport details, and addresses in notarial application participant forms on notary.kdmid.ru, the Russian Ministry of Foreign Affairs consular notary portal. Save several local person profiles and select one when preparing a consular power of attorney. Saved data and new backups are encrypted with a separate vault password. No AI, backend, cloud APIs, or application account are required. Person profiles stay encrypted with AES-256-GCM in your Chrome profile on your own computer. The developer does not receive or have access to profiles, passwords, or encryption keys. The extension neither stores data on developer servers nor sends it to the developer, cloud APIs, or analytics services. After unlocking, decryption happens locally for form filling. Data enters the official portal form and becomes accessible to its scripts only when you click Fill. You choose where to keep or share encrypted exports. Choose the participant role on the portal yourself, review the filled fields, and handle document text, appointment booking, and registration separately. Open source under MIT: https://github.com/ProjectNotFound404/kdmid. Requires desktop Chrome. A forgotten vault password cannot be recovered.

The current extension UI and manifest are Russian. A separately selectable English store locale requires corresponding manifest localization; an English README alone does not enable it. See [listing localization](https://developer.chrome.com/docs/webstore/cws-dashboard-listing).

## Privacy practices: copy-ready answers

Single purpose:

> Store locally encrypted person profiles and reuse their personal details in the currently open notarial application participant form on https://notary.kdmid.ru after an explicit user action.

Permissions justification:

| Permission | Explanation |
| --- | --- |
| `activeTab` | Temporarily access the active tab after the user opens the extension; check the exact portal origin and use the visible participant form. No continuous access or browsing-history permission is requested. |
| `scripting` | Inject the packaged filling function into the active portal tab after the user clicks Fill. It fills only person fields and never submits or registers an application. |
| `storage` | Keep the encrypted vault locally and its temporary unlock key in trusted, in-memory session storage. Chrome Sync is not used. |
| `alarms` | Remove the temporary session key and lock the vault after 15 minutes of inactivity, including when the extension service worker is suspended. |

Remote code: **No, I am not using remote code**. All executable code is bundled; encryption uses Web Crypto.

Declare local data handling honestly. The extension processes personal profiles even though it does not send them to the developer. Based on the dashboard's definitions, relevant categories include:

- **Personally identifiable information:** names, birth details, passport and other government identifiers, address, citizenship, and user-entered notes.
- **Authentication information:** the vault password and encrypted-backup password, processed locally without storing the passwords.
- **Location:** the country and address entered by the user; no GPS or geolocation permission.
- **Website content:** relevant visible person-form fields read for filling and conflict detection.
- **Web history:** the current active tab's URL, read only for the portal-origin check; no browser-history database or browsing log is collected.

Match the current dashboard definitions and the privacy policy; do not declare that the extension handles no user data. Certify the limited-use statements only after reviewing them. Google's [privacy-field guide](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy) and [local-data disclosure FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq) explain these requirements.

## Instructions for reviewers

> No extension account or external API credentials are needed. On first use, create your own vault password of at least 12 characters; it is independent of the portal draft password. Open the options page and add a fictitious person, such as Тестов Тест, male, Russian foreign passport, series 00, number 0000000, address country АВСТРИЯ. Save the person. Test encrypted export/import and manual locking/unlocking. On https://notary.kdmid.ru/, start a new draft, select a consulate and electronic application for удостоверение доверенности, and choose a draft password. The processing code is optional. Continue to the participant page, select the person type, and open the natural-person form. Open the extension popup, select the fictitious profile, and click Заполнить. Review the fields; do not register a test application. Portal validation or CAPTCHA must be handled manually. The extension does not automate these steps. Do not use or request real identity details.

## Review and publication

Choose **Public** distribution if you want the listing discoverable in the store. Check all required dashboard fields, then select **Submit for review**. You may choose deferred publication so approval does not immediately make the extension public. Publish after approval, then add the real store URL to both READMEs and the repository homepage. Review timing and approval are controlled by Google.

For updates, keep the same store item, increment the manifest version, rebuild the store ZIP, and upload it to that item. Do not create a replacement listing for each release.
