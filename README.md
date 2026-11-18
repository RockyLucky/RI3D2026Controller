# RI3D stream controller

A local Express/Socket.IO dashboard with a separate OBS WebSocket bridge. Camera video travels directly to OBS or its Browser Sources; the backend is not a media relay.

## Local startup

Use Node 24. Run `npm ci`, copy `.env.example` to `.env`, then run `npm start` and `npm run bridge` in separate terminals. Open http://127.0.0.1:3000/ri3d26/home.

`EVENT_YEAR` in `.env` controls the home title and heading; restart the server after changing it. Countdown dates are separate. The server binds to loopback by default; HOST and PORT can override it, but the inherited control interface has no authentication. It is not ready for public hosting or direct iPad access over an untrusted network.

## Local connection settings

Open http://127.0.0.1:3000/management to enter the OBS loopback URL/password and local or CCR controller URL. Settings are stored as plaintext under ignored `.local-secrets/connection.json`; this is not an encrypted vault. The API never returns the saved password. Requests require local socket/Host and same-origin checks; CCR-origin requests are rejected. Blank password keeps the saved value. The running bridge reloads changes. The page currently requires port 3000.

Environment alternatives: OBS_URL, OBS_PASSWORD and CONTROLLER_URL for the bridge. Switching to CCR moves the bridge to that backend; it does not synchronize local and remote backends. Keep OBS WebSocket private.

## Sources and scenes

Define input names, URLs and types in Camera Manager. In Stream Controller, tap Source 1–6 and then an existing input name. Assignments save automatically, without changing live input settings.

Create any named OBS scene and add top-level Browser Sources named exactly `RI3D Managed Web 1` through `RI3D Managed Web 6`. Each marker selects the matching numbered Source assignment, which must be a Website input. Position and crop markers in OBS. Nested groups are not discovered. Present/Passive/TwoCamera retain legacy fallback mappings when no markers exist.

Select a scene to prepare its screenshot. Take Live deliberately switches Program. Preparation creates private input copies in an inactive scene bank; alternate scenes use a `[RI3D Preview]` suffix and are hidden from the web grid. The regular unsuffixed scene is always the layout authority. Each preparation copies regular camera and graphics geometry into the inactive bank; preview-only tweaks are temporary. Shared graphics content is not isolated. Deleted decorations and duplicate source occurrences are not fully mirrored.

The older Camera Manager scene/OBS preview controls bypass this staged workflow and still act immediately. Use Live Control for isolated preparation.

## Images, media and audio

Selected-scene screenshots retry until an image loads, then stop. Click the scene to refresh. A black OBS frame counts as an image. Program screenshots refresh at approximately 1 FPS while Live Control is visible. Studio Mode allows the inactive scene to render in OBS Preview.

Website inputs containing `.m3u8` links are wrapped in a local HLS.js player. Session chunklist filenames are converted to playlist.m3u8. This assumes the controller runs on the OBS PC at 127.0.0.1:3000, requires remote feed CORS support and loads HLS.js from jsDelivr. Normal webpages and VDO.Ninja pass through unchanged. Browser media autoplay may fall back to muted playback.

Audio Mixer provides per-OBS-input gain/mute and active-input peak meters. Per-camera persistent audio settings, silent-preview audio routing and duplicate-audio prevention remain unfinished. Meter subscription currently stays active while the bridge runs.

## Synchronization and collection changes

The bridge obtains authoritative snapshots and refreshes after events/commands, with event debouncing. It pauses new requests while OBS reports a collection switch, clears obsolete scene state and refreshes after loading. A scene-list fallback checks every 15 seconds; a connection check runs every five seconds. Already-issued requests cannot be canceled. Source assignments remain global across collections. Input settings events require a sufficiently recent OBS WebSocket version; nested groups are not fully reconciled.

## Validation and remaining work

Run `npm test`. Current automated checks cover camera mapping validation, local settings access, marker discovery and layout/bank isolation. Some live OBS operations were checked, but the full production workflow and collection-switch stress behavior are not validated. An OBS crash occurred during diagnosis of a null Program state; the crash report identified GetCurrentProgramScene. The application now handles null Program names and pauses requests during collection changes.

Not implemented: automatic VDO.Ninja membership discovery, eight-camera waiting queue/reconnect grace, separate quality profiles, complete source/audio lifecycle, secure remote operator access, complete layout mirroring and comprehensive live hardware tests. Local OBS edits made during development are not an importable scene collection in this repository; build layouts using the markers above.

See [CHANGE.md](CHANGE.md) for iteration history and [ARCHITECTURE.md](ARCHITECTURE.md) for the initial phased plan. Contributors must update the changelog each iteration; see [AGENTS.md](AGENTS.md). Local runtime data, secrets, backups and scratch scripts are excluded from version control.
