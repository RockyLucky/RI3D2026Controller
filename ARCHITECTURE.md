# Architecture and implementation phases

The Express/Socket.IO server owns dashboard configuration and forwards commands to a separate Node bridge on the production PC. OBS WebSocket stays on loopback. Video travels directly through VDO.Ninja WebRTC; this application is not a media relay.

Phase 1: replace optimistic settings caching with authoritative OBS snapshots, reconnect recovery, event-driven refresh and audio controls. Preserve legacy scene mapping and cache messages.
Phase 2: add an authenticated operator/bridge boundary before remote hosting; verify VDO.Ninja director guest-list payloads against a live room, then implement eight slots, a FIFO waiting queue and 12-second absence grace period. Remember explicit publisher stream IDs, not labels or transient session IDs.
Phase 3: add separate OBS and dashboard viewer profiles, preview lifecycle tied to page visibility, and explicit camera/source assignment recovery.

VDO.Ninja documents director iframe action getGuestList with callback IDs. It requires director permissions and can fail silently. Do not assume this is an unauthenticated server-side room enumeration API. Resolution and frame-rate URL hints do not guarantee independent encodes or achieved quality. Live campus ICE/TURN and phone tests remain required.

References: https://docs.vdo.ninja/guides/iframe-api-documentation/iframe-api-for-directors and https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md
