# Change log

This file records each implementation iteration, newest first. Features described as added are implemented in the branch; they are not necessarily validated with production equipment. Planned work is listed separately.

## Iteration 39 — Repository publication cleanup — 2026-11-17

- Consolidated README around current source markers, scene banks, local settings and known limitations.
- Removed local camera/overlay runtime JSON from version control without deleting local copies. Default templates remain tracked; ignored secrets, .env, backups and scratch scripts remain local.
- Declared cors as a direct dependency, matching its existing server import.
- Validation: all 14 automated tests and server/bridge/reaction syntax checks passed before packaging. Updated the lockfile offline; no dependency code was upgraded.

## Iteration 38 — Regular scene always owns layout — 2026-11-17

- Regular (unsuffixed) OBS scene is now the layout source on every preparation. Alternate preview copies never become layout authorities.
- Each preparation reapplies regular camera positions and graphic transforms to the inactive bank. Tweaks in the preview copy are temporary and will be replaced on preparation; edit the regular scene for persistent changes.
- Validation: layout, bank isolation and marker regression tests passed. Live bank is not written during preparation, even when regular edits are pending.

## Iteration 37 — Preview starts from current scene layout — 2026-11-17

- At the start of a new bank cycle, preparation copies current scene camera geometry/cropping plus graphics transforms, visibility and ordering into the inactive copy.
- Subsequent preparation in the same cycle keeps staged manual tweaks instead of repeatedly resetting positions. After Take Live, the next inactive copy inherits the newly live layout. Shared graphic content remains shared, not a deep copy of input settings.
- Validation: slot parsing, decoration-copy tests and bank/marker regression tests passed. Live manual layout workflow still requires verification. Deleted decorations and duplicate source occurrences are not fully mirrored yet.

## Iteration 36 — Browser player for camera playlists — 2026-11-17

- Diagnosed current Camera Manager Website inputs containing raw HLS playlists/session chunklists. Added a local HLS.js player page and automatic playlist wrapping when preparing Browser Sources.
- Trims URLs and normalizes chunklist filenames to playlist.m3u8. VDO.Ninja and normal webpage URLs pass through unchanged. Existing live sources update only on a subsequent Take Live.
- Fixed preview error cleanup so invalid assignments do not leave the request marked busy.
- Validation: direct OBS/backend comparison showed matching collection scene lists; URL conversion checks and syntax checks passed. Actual HLS rendering still needs verification; remote feeds require CORS and internet access to the HLS.js CDN. Local player currently assumes the OBS PC serves port 3000.

## Iteration 35 — Scene collection switch recovery — 2026-11-17

- Added documented CurrentSceneCollectionChanging/Changed handlers: pause new requests and polling during changes, invalidate snapshots, clear the old grid and refresh after loading.
- Debounced event-triggered refreshes and added a lightweight GetSceneList fallback every 15 seconds. Full state is refreshed only when that fallback detects a changed scene list/Program.
- Bridge had been stopped after the prior crash; restarted with guards. Requests already in flight cannot be canceled. Numbered source assignments are still global configuration, not collection-specific.
- Validation: syntax checks and five existing marker/isolation regressions passed. Real collection switching requires verification; no automatic collection switch was performed.

## Iteration 34 — Missing OBS Program scene guard — 2026-11-17

- Diagnosed OBS returning null currentProgramSceneName/currentProgramSceneUuid while Preview was 3 Camera. The browser attempted split() on null, interrupting initialization.
- Dashboard now tolerates a missing Program scene without crashing.
- Validation: client syntax check and direct OBS scene-list inspection. Program recovery attempted separately.

## Iteration 33 — Recover stale OBS status — 2026-11-17

- Bridge now rechecks OBS with GetVersion every five seconds and republishes actual connectivity, reconnecting after a failed check.
- Live Control treats receipt of a fresh OBS snapshot as a connected signal as well as explicit connection events.
- Validation: direct OBS GetVersion succeeded, backend reported connected, and exactly one local bridge was running before changes. Client/bridge syntax checks passed. The reported stale indicator was not reproduced directly in the browser.

## Iteration 32 — Preserve manual generated-source movement — 2026-11-17

- Found that existing generated cameras were still receiving marker transforms on every preparation. Removed those writes: transforms/order are now initialized only when a scene item is first created.
- Manual movement of an existing generated camera survives subsequent Preview/Take Live preparation. Changing an original marker no longer forces existing copies to move; each bank retains its own layout until edited.
- Validation: regression test asserts zero transform writes for existing sources, and bank-isolation test passed. Live OBS verification performed separately when available.

## Iteration 31 — Original OBS markers own the layout — 2026-11-17

- Preparation reads marker transforms directly from the original OBS scene on every request, rather than using potentially stale dashboard snapshots. The inactive bank follows current marker positions; the live bank and markers are not moved.
- Existing generated sources without markers keep their manual positions; default full/split positioning applies only when initially creating those sources. Existing item ordering is preserved.
- Validation: bank-isolation and fresh-marker regression tests plus marker discovery tests passed. Live manual movement verification remains pending. Edit original marker sources for layouts shared by both banks; moving generated bank sources is not a template edit.

## Iteration 30 — Three-camera OBS layout — 2026-11-17

- Created local OBS scene 3 Camera: Web 1 is large and centered vertically on the left; Web 2 and Web 3 stack on the right. Layout scales to the OBS base canvas and preserves feed aspect ratios.
- Left the bottom 17.5% clear and added the existing full-canvas OnScreenGraphics above the camera markers. Marker URLs stay blank until Website sources are assigned and previewed.
- Validation: OBS readback confirmed three marker transforms plus graphics on 1920x1080; Program stayed unchanged. Backed up scene collections first. Actual graphics content can extend beyond the reserved bottom region.

## Iteration 29 — OBS source-name scene markers — 2026-11-17

- Arbitrary OBS scenes can declare slots with exact Browser Source names RI3D Managed Web 1 through RI3D Managed Web 6. Marker numbers map to numbered Source assignments.
- Preparation uses isolated private sources and copies each marker's transform. Markers are hidden in the prepared scene to avoid covering the actual feed. Only top-level scene items are discovered.
- Existing three legacy scene mappings remain as fallback for scenes without markers. Web markers reject missing or non-web assignments.
- Validation: three marker discovery tests and bank-isolation test passed; server/module syntax checks passed. Live marker-scene rendering has not been exercised.

## Iteration 28 — Take Live switches the prepared bank — 2026-11-17

- Removed an old same-scene shortcut that bypassed bank preparation when the logical scene was already live. Take Live now switches to its prepared alternate copy.
- Normalized alternate-bank Program names for the web live badge.
- Validation: isolation test and syntax checks passed; exercised Take Live through Socket.IO and verified OBS changed from TwoCamera to TwoCamera [RI3D Preview] with success acknowledgement.

## Iteration 27 — Denser controller spacing — 2026-11-17

- Put Preview/Next and its selected scene on one line; Program/Live uses the same compact heading.
- Reduced controller text, panel margins, padding and source-button sizes while retaining the existing responsive layout.
- Validation: checked heading markup retains existing IDs; presentation-only change.

## Iteration 26 — Instant staged input buttons — 2026-11-17

- Replaced Sources dropdowns and Save Assignments with an always-visible numbered slot strip and camera choice buttons.
- Tapping a camera automatically saves that slot and refreshes the selected scene's prepared preview. Live inputs remain isolated until Take Live.
- Buttons show the current assignment; changes serialize while awaiting save confirmation. Take Live is disabled during saving.
- Validation: client syntax checks. Live OBS button-to-preview operation remains unverified; only the scene mappings described in iteration 25 are supported.

## Iteration 25 — Staged/live camera isolation — 2026-11-17

- Saving numbered source assignments no longer updates shared OBS Browser Sources immediately.
- Managed Present/Passive/TwoCamera preparation uses an inactive scene bank with private browser/media inputs. If the base scene is live, an alternate [RI3D Preview] scene is created; Take Live switches to the prepared bank.
- Alternate banks are hidden from the web scene grid and Program highlights the base scene name. Overlays are shared; only managed camera settings are isolated. Legacy Camera Manager controls still bypass this workflow.
- Validation: mocked live-bank isolation test and syntax checks passed. End-to-end OBS switching is not yet verified. Automatic alternate layout copying happens on creation only; future manual layout edits are not mirrored.

## Iteration 24 — Prepare assigned sources for preview — 2026-11-17

- Selecting Present/Passive prepares only Source 1; TwoCamera prepares Sources 1 and 2, enabling required items and hiding unused managed items before the screenshot.
- In OBS Studio Mode the prepared scene is placed in Preview to activate its feeds, without taking it live. Already-live scenes are not rebuilt.
- Avoids reapplying unchanged URL/settings during screenshot retries. Shared browser sources still follow their global assignment.
- Validation: server/module syntax checks. Without Studio Mode inactive sources may still render blank; successful black screenshots are not detected automatically. Scene layout configuration beyond the three existing mappings remains pending.

## Iteration 23 — Shared numbered Browser Sources — 2026-11-17

- Added RI3D_SOURCE_1 through RI3D_SOURCE_6 as reusable Browser Sources in an inactive RI3D Sources scene. Webpage slots use these shared inputs in managed scenes; saving numbered assignments sends webpage URLs to OBS.
- Existing media/file/unknown assignments are preserved rather than loaded as raw webpages; their new browser placeholders remain blank until webpage entries are selected. Source changes are shared and can affect live output.
- Validation: syntax checks and OBS readback confirmed six browser_source inputs. Existing camera scenes were not switched. Full webpage reassignment workflow remains untested. Scene slot layouts remain the limited mappings from iteration 22.

## Iteration 22 — Numbered sources prepare OBS scenes — 2026-11-17

- Present and Passive now prepare Source 1; TwoCamera prepares Sources 1 and 2 before Take Live. Other scene types retain their existing switch behavior.
- Creates isolated, scene-specific Browser/Media inputs and fits full/split slots while keeping overlays above them. Old RI3D slots are disabled in the prepared scene, not deleted.
- Invalid source definitions block preparation. Already-live scenes are not rebuilt. Local OBS collections were backed up before applying inactive-scene changes.
- Validation: syntax checks and OBS readback of created sources; confirmed Program stayed unchanged. End-to-end Take Live and simultaneous operator edits remain untested. Legacy Camera Manager scene submission still uses old slots; use Live Control Take Live for this new mapping.

## Iteration 21 — Sources select existing cameras — 2026-11-17

- Replaced source definition editing with six dropdowns selecting existing Camera Manager input IDs. Camera names, types and URLs remain solely in Camera Manager.
- Saved numbered assignments separately in camera.sourceSlots, with server validation for removed or unknown inputs. Saving these assignments does not change OBS or bind scenes yet.
- Validation: client/server syntax checks. This replaces iteration 20's source editing interface.

## Iteration 20 — Numbered source definitions — 2026-11-17

- Added a collapsible Sources panel on Live Control with numbered buttons and a name/type/address editor using Camera Manager's existing configured input list.
- Saves preserve existing IDs and positions; new media defaults use scale 1 while websites use 1920x1080. Input types and URLs are validated; outdated edits are rejected against the previous row.
- Sources are numbered by list order; define empty entries in order. Deleting/reordering in Camera Manager can change numbers. Saving does not assign sources to scenes or modify OBS.
- Validation: server and client syntax checks and local route loading; live browser saving not exercised to avoid changing configured feeds.

## Iteration 19 — Local OBS scene repair — 2026-11-17

- Backed up local OBS scene collection files and scene-item state under ignored .local-secrets/obs-backups before editing.
- Reset RI3D slot 1 web/media transforms in inactive Passive, Present and BeRightBack to fit the base canvas with aspect ratio preserved. Disabled the separate VDO.NINJA layer in Passive that could cover the managed slot.
- Verified transforms and visibility by reading OBS state after changes. Program remained TwoCamera; its layout and shared input URLs were left untouched. StartingSoon, Scene 2 and the manual nine-camera scene were preserved.
- These are local OBS configuration changes, not an automated scene migration. Camera media connectivity remains a separate issue.

## Iteration 18 — Reliable web/media source assignments — 2026-11-17

- Camera requests validate all selected inputs and actual source mappings before commands are sent. OBS item ID zero is accepted.
- Source settings/transforms and visibility are applied before switching Program; unused RI3D web/media slots are disabled. Batches halt on failures and no longer report a failed assignment as active.
- Camera Manager shows mapping errors inline. Mini-preview mode no longer changes OBS; only OBS preview mode does.
- Validation: three mapping tests and syntax checks passed. Shared source settings can still affect other scenes; independent staging sources remain future work.

## Iteration 17 — Live scene ring — 2026-11-17

- Added a red outline to the current Program scene card, driven by OBS snapshots. Staged selections retain their yellow fill independently.
- Validation: client syntax check and inspected the Program-name comparison.

## Iteration 16 — Retry selected screenshot until loaded — 2026-11-17

- Selected-scene screenshots retry failed requests or image decoding every 1.5 seconds until an image loads, then stop.
- Changing scene, clearing selection, disconnecting, hiding the page or changing tabs cancels retries and invalidates late responses. Returning resumes an unfinished image request.
- Validation: client syntax check. A successfully rendered black OBS frame counts as an image; content analysis is not performed.

## Iteration 15 — Compact switching workspace — 2026-11-17

- Reduced top navigation, heading and scene-card sizes to leave more room for screenshots.
- Preview/Next is on the left and Program/Live on the right, with Take Live beside the selected preview. Scene cards use a narrow rail on wide screens and a compact grid on tablets.
- Small phones stack the monitors. Screenshot request behavior is unchanged.
- Validation: checked required element IDs remain unique and markup loads; visual tablet rehearsal remains pending.

## Iteration 14 — Screenshot visibility verification — 2026-11-17

- Added a new asset version to prevent older cached scene scripts/styles being reused.
- Moved the selected-scene snapshot above Program so it appears near the scene selection.
- Validation: live socket screenshot returned a JPEG; browser clicking Present displayed the selected-scene image and timestamp. Cache was a possible cause, not conclusively established.

## Iteration 13 — On-click scene screenshot — 2026-11-17

- Clicking a named scene fetches one screenshot of that scene without switching Program. Clicking again refreshes it; scene cards never poll for thumbnails.
- Response generation checks prevent an older selection from replacing a newer screenshot. Clear/disconnect remove the image.
- Existing Program preview retains its separate 1 FPS behavior.
- Validation: server/client syntax checks and local route loading; actual inactive-source rendering depends on OBS.

## Iteration 12 — Named scene grid foundation — 2026-11-17

- Scene list now appears as a grid of actual OBS scene cards, with Take Live terminology.
- Scenes represent named production situations, rather than fixed layout templates. Per-scene expanded layout/input editing is still pending; current camera controls remain in Camera Manager.
- Validation: inspected markup and CSS; no OBS changes made.

## Iteration 11 — Camera request scene fallback — 2026-11-17

- Camera submission now falls back to the current scene when no new scene is staged; unknown scenes are rejected instead of emitting a null scene.
- Camera picks are read from the active panel when applying to the current scene.
- Investigated playlist failures: configured camera051/camera052 variants returned HTTP 404, while camera016 returned an HLS manifest. Camera identities were not silently rewritten.
- Validation: embedded script syntax check. Live source recovery checked separately through OBS.

## Iteration 10 — Program screenshot preview — 2026-11-17

- Live Control requests a 640px JPEG of the current OBS program scene approximately once per second through the existing bridge.
- Requests pause while the tab or Live Control is hidden; one request at a time, timeouts and stale-image removal prevent a frozen image appearing current.
- Preview is image-only, with no audio. Polling rate is approximate and depends on OBS response time; multiple dashboards each request screenshots.
- Validation: JavaScript syntax checks and local page/asset loading. Actual OBS screenshot output remains unverified.

## Iteration 9 — Unified Stream Controller — 2026-11-17

- Grouped camera, overlay and mixer tools under Stream Controller on Home, with tabs and a responsive live scene panel.
- Scene selection stages locally; a separate Run button submits the selected scene with inline acknowledgement and timeout feedback. External snapshots update the program label without overwriting staged selection.
- Legacy tools are embedded unchanged; their existing controls still act immediately and are not covered by the new Run button. Inactive tool frames are unloaded.
- Validation: JavaScript syntax checks. Live OBS/iPad validation remains pending. iPad access requires an appropriately secured reachable backend; default server remains loopback.

## Iteration 8 — Configurable event year — 2026-11-17

- Added EVENT_YEAR in local .env with .env.example as the tracked template; restart the server after changing it.
- Home page heading and browser title now use the configured year. Without a setting, the current calendar year is used. Existing countdown dates and asset filenames are unchanged.
- Fixed ignore patterns to exclude data/, .local-secrets/, and .env separately.
- Validation: syntax check, default year read, and an environment override to 2027. No live OBS changes.

## Iteration 7 — Settings home navigation — 2026-11-17

- Replaced the small Home link in Connection Settings with a Back to Home button using the existing secondary button style.
- Validation: checked the button destination is /ri3d26/home. No application behavior changed.

## Iteration 6 — Home settings shortcut — 2026-11-17

- Moved Connection Settings from the home heading to a fixed bottom-right shortcut using the existing yellow button style.
- Validation: inspected the home markup for one settings link. No application behavior changed.

## Iteration 5 — Private local connection settings — 2026-11-17

- Added /management and a home link for OBS URL/password and local/CCR controller URL. Save reconnects the running bridge; Disconnect disables OBS retries.
- Settings persist in ignored .local-secrets/connection.json, separate from shared configuration. Password is never returned by the settings API.
- Local socket address, allowed Host, Origin, fetch metadata, and a custom write header restrict access; CCR-origin requests and remote clients are rejected. Frame embedding is denied.
- Validation: four access-boundary tests and JavaScript syntax checks passed. Live OBS authentication and reconnect remain unverified. The file is plaintext, accessible to this Windows account; this is not an encrypted vault. Fixed port 3000 only.

## Iteration 4 — Original controller styling — 2026-11-17

- Restyled the audio mixer with the original shared stylesheet, Cooper Hewitt font, background, panel, navigation, and yellow/black controls.
- Added responsive audio channel rows, accessible control labels, connection status, and an empty-input message.
- Added an Audio Mixer tile to the existing home page.
- Validation: checked embedded JavaScript syntax and local HTTP routes. Live OBS validation remains pending.

## Iteration 3 — Local installation — 2026-11-17

- Started the local controller and OBS bridge with existing dependencies. OBS Studio is installed; live OBS connection testing remains pending.
- Fixed startup to await configuration once and bind to loopback by default, with HOST and PORT overrides.
- Validation: JavaScript syntax check and mixer HTTP smoke test.

## Iteration 2 — Change tracking — 2026-11-17

### Added
- **Feature history (`CHANGE.md`):** explains what each iteration changes, how operators use it, validation performed, and remaining limitations.
- **Contributor instructions (`AGENTS.md`):** require future coding iterations to update this log and keep setup instructions consistent with the implementation.
- **README link:** gives contributors and operators a direct path to this history.

### Validation
- Reviewed the initial entry against the current bridge, server, mixer, and existing documentation. Documentation-only changes; application tests were not rerun.

## Iteration 1 — Initial OBS synchronization and mixer — 2026-11-17

Implementation commit: `348740d` on `feat/phase1-obs-sync`.

### Added and changed
| Feature | What it does | How to use / current limits |
| --- | --- | --- |
| OBS reconnect attempts | Retries the OBS connection every three seconds after a connection failure or closure. Publishes connection status. | Run the bridge on the OBS production PC. Live disconnect/reconnect testing remains outstanding. |
| Authoritative state snapshots | Reads scenes, input settings, volume/mute, scene items including visibility/transforms, media state, and streaming/recording/other output status. Refreshes after supported OBS events and command batches. | Supplies shared dashboard state. The legacy camera forms do not display every field; nested scene groups are not recursively reconciled. |
| Cache behavior | Removes optimistic input-settings filtering that could treat an unsuccessful change as already applied. Keeps legacy cache and scene mapping messages for existing pages. | Commands are sent to OBS and state is read back. Full feedback-loop and concurrent-control behavior still needs testing. |
| Audio mixer | Provides per-input gain sliders in dB and mute/unmute controls for inputs reporting audio support. | Open `/ri3d26/mixer`. Controls send requests through the server and local OBS bridge. |
| Live audio meters | Converts OBS `InputVolumeMeters` peak multipliers into dB for active inputs. | OBS must provide meter events. Meter subscription remains active while the bridge runs; viewer-count gating and stale-meter expiry are pending. |
| Configuration fallback | Uses built-in group defaults when both saved and default configuration files are absent; creates the data directory when saving. | Allows a fresh clone to start without the original untracked configuration directory. |
| Bridge configuration | Replaces the hard-coded remote controller with a loopback default and environment settings for controller and OBS connection details. Adds `npm run bridge`. | Set `CONTROLLER_URL`, `OBS_URL`, and `OBS_PASSWORD` in the bridge process environment. Keep OBS credentials out of browser code. |
| Setup and architecture documentation | Describes local startup, the direct WebRTC architecture, planned phases, and deployment limits. | See [README.md](README.md) and [ARCHITECTURE.md](ARCHITECTURE.md). |

### Validation performed
- JavaScript syntax checks for `server.js` and `obs-connection.js`.
- Local server startup smoke test.
- Dependencies installed from the lockfile.
- No automated behavioral tests were added. The `npm test` command alone is not evidence of behavioral coverage.
- No live OBS, Stream Deck, VDO.Ninja room, phones, or campus-network testing was performed.

### Known limitations and planned work
- VDO.Ninja dynamic room discovery, eight active slots, waiting queue, 10–15-second reconnect grace period, and remembered camera identities are not implemented.
- Separate 1080p30 OBS and 360p15 preview profiles, automatic preview tiles, and dashboard preview subscription lifecycle are not implemented.
- Automatic camera/source assignment release and recovery are not implemented.
- Full bidirectional editing in existing camera forms and complete reconnect reconciliation, including nested groups, remain unfinished.
- Input settings events require OBS WebSocket 5.4+; older versions need an additional refresh strategy.
- Full snapshots query all scenes and inputs and need load testing. Media cursor progression is not continuously polled.
- The inherited control interface has no authentication. Public hosting is not ready; OBS WebSocket should remain private.
- Live hardware acceptance tests and automated behavioral tests remain required before production use.

## Updating this file

For each future implementation iteration, add a dated entry above the previous entries. Include features and their operator-facing purpose, changed behavior, setup changes, checks actually performed, and outstanding limitations. Use the next iteration number. Keep unfinished work separate from delivered features, preserve earlier entries, and never claim tests or live validation that did not occur. A documentation-only iteration can state that application tests were not needed.




















