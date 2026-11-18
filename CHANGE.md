# Change log

This file records each implementation iteration, newest first. Features described as added are implemented in the branch; they are not necessarily validated with production equipment. Planned work is listed separately.

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
