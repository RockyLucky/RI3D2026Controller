# Local first-phase controller

Install with `npm ci`. Run `npm start`, then `npm run bridge` on the OBS PC. Open http://127.0.0.1:3000/ri3d26/home or /ri3d26/mixer. Node 24 was used for validation. Configure OBS_URL (default loopback), OBS_PASSWORD, CONTROLLER_URL, HOST and PORT through the process environment. Never put OBS credentials in browser code. Keep this controller on loopback or a trusted private network: the inherited command/configuration interface has no authentication and is not ready for public cPanel hosting.

See ARCHITECTURE.md for phases. This implementation refreshes authoritative snapshots after events and command batches, retries OBS connections every three seconds, and publishes audio meter events to the mixer. It removes optimistic cache suppression. Existing RI3D scene mapping messages remain supported. InputSettingsChanged requires a sufficiently recent OBS WebSocket implementation (5.4+); older versions need additional polling. Nested groups are not recursively reconciled yet. Snapshot refresh currently queries all inputs and scenes and needs load testing before eight-camera production use.

Mixer controls volume in dB and mute. Active input meters use OBS peak multipliers converted to dB. Meter subscription currently remains active while the bridge runs, even with no dashboard: subscriber-count gating and stale-meter expiry are pending.

Not implemented: dynamic VDO room discovery, queue/grace management, remembered camera identity, viewer quality profiles, preview subscription lifecycle, automatic assignment release/recovery, authentication, and full external-change editing in the legacy camera forms. These are planned work, not claimed working features. The OBS snapshot exposes transforms/settings/media/output state, but the legacy forms do not yet render all of it.

Validation: syntax checks and local startup smoke test only. No live OBS, Stream Deck, VDO room, phones or campus network was available. Run acceptance tests for external scene/source/audio changes, failed commands, restart/reconnect and simultaneous controls before production.

See [CHANGE.md](CHANGE.md) for feature descriptions, iteration history, validation, and remaining work. Contributors must update it with each iteration; see [AGENTS.md](AGENTS.md).
