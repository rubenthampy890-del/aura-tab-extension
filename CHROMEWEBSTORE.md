# Chrome Web Store Submission Guide — Aura Tab

> Last Updated: 2026-06-20

Use this document to copy-paste metadata and configuration details into the Chrome Developer Dashboard during submission.

---

## 1. Store Listing Details

*   **Extension Name**: Aura Tab - Custom Glass Dashboard
*   **Short Description**: A highly customizable glassmorphic dashboard for your browser featuring wallpapers, widgets, and a Pinterest parser.
*   **Detailed Description**:
    Aura Tab transforms your browser's new tab page into a stunning, premium glassmorphic dashboard. Crafted with rich visual aesthetics, custom blur controls, and a productivity-focused toolset, it provides a peaceful yet powerful starting point for your web browsing.

    Key Features:
    - Premium Liquid Glassmorphism: Custom backdrop saturation, blur, opacity, and theme styling to match your taste.
    - Dynamic Wallpapers: Set high-quality images, live video loops, or stream Pinterest videos as your background.
    - Built-in Pinterest Downloader: Paste any Pinterest link to preview, download, or set the media directly as your new tab wallpaper.
    - Floating Sidebar Dock: Easily access all controls, widgets, and custom links from an elegant, floating squircle panel.
    - Customizable Layouts: Resize widgets (weather, clock, greeting, notes) dynamically using simple sizing controls.
    - Zen Mode & Pomodoro: Focus with custom ambient sound loops and a built-in focus timer.
    - Local & Sync Storage: All preferences, notepad entries, and settings are saved locally or synchronized across your devices.

    How to Use:
    1. Open a new tab to load the Aura Tab dashboard.
    2. Click the floating sidebar buttons on the left to customize themes, weather location, and widget sizes.
    3. Open the Quick Tools drawer to access the Pinterest Downloader. Paste any Pinterest Pin URL to download the asset or apply it as your dynamic wallpaper instantly.
    4. Right-click selected text on any webpage to save it directly to your dashboard notepad via the context menu.

    Privacy & Security:
    Your data is yours. Aura Tab operates locally on your machine. We do not track, collect, or transmit your personal data, web history, or usage activity off-device.

    Support:
    For issues, feedback, or feature requests, visit our GitHub page: https://github.com/rubenthampy890-del/aura-tab-extension/issues

*   **Category**: Productivity (or Developer Tools / Photos)
*   **Single Purpose**: Provides a highly customizable glassmorphic new tab dashboard featuring dynamic wallpapers and widget management.
*   **Primary Language**: English (United States)

---

## 2. Graphics & Assets

| Asset | Dimensions | Status | Filename |
| :--- | :--- | :--- | :--- |
| Store Icon | 128×128 PNG | ✅ Ready | `icons/icon-128.png` |
| Promo Banner (Large) | 920×680 PNG | 🟡 To Generate | Suggested: Take a screenshot of the new tab |
| Screenshot 1 (Dashboard) | 1280×800 or 640×400 | 🟡 To Generate | Suggested: Dashboard view with weather & clock |
| Screenshot 2 (Quick Tools) | 1280×800 or 640×400 | 🟡 To Generate | Suggested: Pinterest Downloader tab with preview |
| Screenshot 3 (Customizer) | 1280×800 or 640×400 | 🟡 To Generate | Suggested: Customizing glass opacity & sidebar |

---

## 3. Permissions Justification

Every permission declared in our `manifest.json` is strictly required to enable user-facing capabilities:

| Permission | Type | Plain-English Justification for Reviewers |
| :--- | :--- | :--- |
| `storage` | permissions | Used to store user settings locally (glassmorphic preferences, custom link lists, weather location, and notepad text) and synchronize them across the user's devices. |
| `notifications` | permissions | Used to send system notification alerts when the user's Pomodoro timer expires or when notepad tasks are due. |
| `alarms` | permissions | Used to schedule background weather updates (every 30 minutes) and reset daily productivity trackers at midnight. |
| `contextMenus` | permissions | Used to register a context menu option ("Add to Aura Tab Notepad") allowing users to right-click selected text on any page and append it directly to their dashboard notepad. |
| `offscreen` | permissions | Required under Manifest V3 guidelines to spawn an offscreen audio player for Zen Mode ambient tracks and timer alarm ringtones. |
| `favicon` | permissions | Required to fetch and display the favicons of custom sites saved to the user's quick links dashboard. |
| `https://*.pinterest.com/*` | host_permissions | Required to fetch Pin pages to locate and download original high-resolution background images and wallpaper video streams. |
| `https://*.pinterest.co.uk/*` | host_permissions | Required to fetch UK Pin pages for downloading wallpapers. |
| `https://*.pinterest.ca/*` | host_permissions | Required to fetch Canadian Pin pages for downloading wallpapers. |
| `https://*.pinterest.de/*` | host_permissions | Required to fetch German Pin pages for downloading wallpapers. |
| `https://*.pinterest.fr/*` | host_permissions | Required to fetch French Pin pages for downloading wallpapers. |
| `https://*.pinterest.es/*` | host_permissions | Required to fetch Spanish Pin pages for downloading wallpapers. |
| `https://*.pinterest.it/*` | host_permissions | Required to fetch Italian Pin pages for downloading wallpapers. |
| `https://*.pinterest.co/*` | host_permissions | Required to fetch Colombian/Global Pin pages for downloading wallpapers. |
| `https://pin.it/*` | host_permissions | Required to follow shortened mobile Pinterest redirect links to locate the original Pin content. |
| `https://*.pinimg.com/*` | host_permissions | Required to fetch and download raw high-definition image/video streams hosted on Pinterest's Content Delivery Network (CDN) to bypass CORS blocks when setting background wallpapers. |

---

## 4. Privacy & Data Use Disclosures

*   **Does the extension collect user data?** No.
*   **Data Use Certification**:
    *   [x] Data is NOT sold to third parties.
    *   [x] Data is NOT used for purposes unrelated to the extension's core functionality.
    *   [x] Data is NOT used for creditworthiness or lending purposes.

---

## 5. Privacy Policy (Copy-Paste Text)

Host the following policy at a public URL (e.g. GitHub Pages or a public Gist) and link it in the Developer Console:

```markdown
# Privacy Policy for Aura Tab - Custom Glass Dashboard

Last updated: 2026-06-20

Aura Tab ("we", "our", or "the extension") values your privacy. This privacy policy explains our practices regarding user data.

## 1. Data Collection & Transmission
Aura Tab does NOT collect, store, or transmit any personally identifiable information, browsing history, financial data, or location tracking.
All your data stays completely on your local device.

## 2. Permissions and Data Use
We utilize local APIs for core user features:
- Storage: To save your configuration and layout preferences locally or via Chrome Sync.
- Alarms & Notifications: To alert you when the focus timer completes.
- Context Menus: To save text snippets you select directly to your local notepad.
- Offscreen & Favicon: To play ambient noise and render quick-link logos.
- Host Permissions (Pinterest domains): To fetch wallpaper images and video loops directly from Pinterest to set as your browser background. This data is handled in your browser session and never sent to any external server.

## 3. Third-Party Services
Aura Tab communicates directly with:
- Weather API (Open-Meteo): To fetch temperature data based on the city name you enter.
- Pinterest CDN: To download wallpapers you select.
No tracking tokens or account identifiers are sent to these services.

## 4. Data Retention and Deletion
Your configuration and notepad data are stored locally in your browser (IndexedDB and chrome.storage). You can delete all your data instantly at any time by clearing your extension settings or uninstalling the extension.

## 5. Contact
If you have any questions about this Privacy Policy, please contact the developer via GitHub:
https://github.com/rubenthampy890-del/aura-tab-extension
```

---

## 6. Version History

| Version | Date | Changes | Status |
| :--- | :--- | :--- | :--- |
| 1.1.0 | 2026-06-20 | Added floating sidebar dock, custom widget size controls (+/-), Pinterest wallpaper parser, Zen Mode offscreen audio loops, and daily dashboard reset routines. | Draft |
