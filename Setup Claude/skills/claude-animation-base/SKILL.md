---
name: claude-animation-base
description: Make hand-painted 2D cartoon animations (p5.js + p5.brush) with the Clawd character or a new character, using the ClaudeAnimationBase starter kit by John Heibel (MIT). Use for "desenho pintado à mão", "animação do Clawd", watercolour/brush cartoon videos.
---

# Claude Animation Base (local install)

Kit: `~/claude-tools/ClaudeAnimationBase` (clone of github.com/JohnHeibel/ClaudeAnimationBase, MIT, deps installed).

1. Read `~/claude-tools/ClaudeAnimationBase/ANIMATION_GUIDE.md` first and follow its rules and workflow (storyboard first, shot by shot, contact sheets to check).
2. Work inside that folder (or copy it to a project folder): scenes go in `src/scenes/`, add a `<script>` per scene in `studio.html`, length/tempo in `src/config.js`.
3. Render (on a machine with a GPU you can drop `--soft-gl`):
   - check: `node render.mjs --soft-gl --sheet=1,3,5 --cols=3 --w=480 --out=out/check/a.jpg`
   - video: `node render.mjs --soft-gl --clip --out=out/video.mp4`
4. Software GL is slow: ~50 s per frame on p5.brush watercolour fills. Per the kit's README, without a GPU replace watercolour fills with flat fills/hatching unless the person accepts long renders.

Local patches already applied: Google Fonts link replaced by `fonts-local.css` (Permanent Marker served locally); Chrome launched with background networking off and `waitUntil: 'load'` (the proxy blocks Google hosts).
