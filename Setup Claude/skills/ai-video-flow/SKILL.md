---
name: ai-video-flow
description: Make a whole AI-generated video from a few sentences (Google Flow / Nano Banana / Veo, BytePlus Seedance). Works out what you want (a trend remake or a UGC ad; an AI influencer, your own avatar or a new character), makes a character sheet, plans 5-8 shots at different camera angles, makes stills, throws out every frame that would not happen in real life, animates only the good ones, cuts the best seconds on the music and hands you the mp4. Use for "/ai-video", "make an AI video", "AI influencer", "UGC ad", "trending video", "remake this reel", "AI video with a girl / boy", "new character", "shot list for AI video", "this AI clip looks fake".
---

# /ai-video: one skill for every AI video

Plain English: you say what you want, Claude makes the whole video. It decides the kind of video and whose face,
plans 5-8 shots at different angles, makes cheap stills, throws out every frame that would not happen in real life,
animates only the good ones, keeps the best 1.5-4 s of each, cuts it on the music and hands you the mp4.

## 0. First run: setup (once)
Ask these in one message, save the answers in `ai-video-config.json` next to this skill, and never ask again:
1. **Work folder** for projects (default `./ai-videos`).
2. **Browser:** Claude drives a browser with Playwright (the Playwright MCP or a script over CDP) on its own profile
   folder. You sign in yourself once in that browser to Google Flow (labs.google/flow) and, for free video
   credits, BytePlus ModelArk (Seedance). Claude never asks for or types a password.
3. **Your face (optional):** 2-3 clear photos of you if you want your own avatar in videos.
4. **Where it posts (optional):** your Instagram / YouTube handles. Claude only posts after your yes.

## 1. Decide first (ask only what was left out, in one message)
**What kind:**
- **Trend remake**: you sent a reel, or said "trending", "like this", "remake this", "viral". Trending with no link:
  find one (Instagram reels with big likes in the last 2 weeks) and say which.
- **UGC ad**: "UGC", "ad", "product", "review", "brand", or a brand name.
- Unclear: "Trend remake (send me the reel, or I find one) or a UGC ad for a brand?"

**Whose face:**
- "me", "my avatar": your avatar, built from your photos. Make an avatar sheet first (front, 3/4, side, full body,
  plain wall, real phone-photo skin) and save it in `characters/me/`. Another outfit: new sheet from the face first.
- "a girl", "a boy", "new character", "AI influencer": a new character. Reuse one from `characters/` if it fits;
  otherwise make a sheet first (same 4 panels) in `characters/<name>/` with a README line: name, age, city, look,
  outfit, which video.
- Not said: "Your avatar, or a new character (girl or boy)?"

Each video gets its own folder: `CONCEPT.md`, `prompts/`, `stills/`, `clips/`, `edit/`, the final mp4.

## 2. Tools
- **BytePlus Seedance first for video (free token quota per model).** First + last frame, 9:16, 720P, 5-10 s.
  Do a dry run (fill the form, do not press generate) the first time. Its "AI generated" strip sits in the bottom
  13%: crop it off.
- **Google Flow for stills (Nano Banana, 4 per prompt) and Veo.** Upload the character sheets to the Flow project as
  ingredients. After making a still Flow stays in Image mode: switch back to video (Frames) before any Veo take.
  Veo Fast costs credits per take: generate x1 and only for picked stills. Out of credits: tell the user.
- **Reference reel:** `yt-dlp -o ref.%(ext)s --write-info-json <url>` into `<folder>/reference/`.
- **ffmpeg** for frame sheets, cuts and removing marks.

## 3. The idea
- **Trend remake.** Download the reel, make a frame sheet (`ffmpeg -vf fps=2,scale=270:-1,tile=6x4`), read the
  caption and likes, transcribe the audio. Write one line in CONCEPT.md: the idea UNDER the surface ("the dream every
  kid saw on screen, now I run at it"). Copy the idea, never the surface. Rebuild it in the user's world with the same
  feeling. One impossible thing, everything else real. Pick the strongest version and go.
- **UGC ad.** One brand. One line: who, the problem, the turn, the result. Beats: hook in the first second (a reaction
  or bold line), problem, product in hand or on screen, result, soft call to action. 12-16 s. Look: real phone selfie,
  her own room, window light, a little messy, no perfect skin. She talks to the lens (UGC only).

## 4. Plan the shots (camera)
Never one long shot. Plan **5-8 shots** at different distances and angles: hook angle, close, POV, drone/wide,
a quiet beat, hero or product close-up. Method: `references/commercial-cut.md`.
For every shot decide five things, or the model falls back to eye level, medium, centred, static:
1. distance (wide / medium / close / macro), 2. height and tilt, 3. facing (profile, 3/4, rear, POV, selfie),
4. lens and focus (24mm wide, 35-50mm natural, 85mm soft background, f/1.8), 5. movement (one move per clip).
Plus **the join** to the next shot (cut on action, hidden cut, first/last-frame bridge): `references/transitions.md`.
A strong join: the **same-spot world flip** (repaint your own still, animate both, cut at the same moment).

Writing prompts:
- Shot phrase first: "Low-angle close-up on a 35mm lens, camera at knee height looking up at him...". One phrase,
  not a tag list. Anchor the camera to something physical. Say what the angle should do and a cue that proves it.
- Positive words only ("static camera, locked-off tripod", never "no movement").
- The still carries the composition; the video prompt carries only what changes (one move, the action, the speed).
- Vertical 9:16: compose for it, subject centred, eyes 35-40% from the top, faces and text between 15% and 75% of the
  height, moves along the lens axis or vertical. No side-by-side two-shots.
- Change the size or angle between consecutive shots, keep screen direction.
Full vocabulary: `references/camera.md` (rules, dialogue coverage, what models get wrong, prompt check),
`references/shot-types.md` (34 shots), `references/camera-moves.md`.

## 5. Stills first, then THE ONE RULE: it must make sense
4 stills per shot, real phone-photo look, prompts saved in `prompts/`. Before anything moves, look at every still
and list what breaks real life. Fix by remaking the still. If it makes sense but looks AI (plastic skin, too clean,
weird hands): crop in, zoom out, hide it behind something in the foreground, or cut that moment short. Never show a
frame you would have to explain. Check every time:
- ONE place from first frame to last. Nothing that would not be there; the magic belongs to the place.
- Scale right, nothing floating, traffic one way, no stacked cars, no pasted face, no gibberish text (turn screens
  away or blur them; video models write fake letters on clothes, so keep the camera on the clean side).
- Nothing appears out of thin air: a landmark is on the horizon from the first frame, and gets bigger as you near it.
- Same land, light, clothes, jewellery, collar, number and sky across cuts: start each next clip FROM the last good
  frame of the previous one (`ffmpeg -ss <t> -i clip.mp4 -frames:v 1`).
- A big reveal: make the reveal still from the previous clip's last frame (Nano Banana, "keep this exact photo,
  change only..."), then animate Start = last frame, End = that still. The end still shows a DIFFERENT view, never
  the start view with something added.
- Camera: no zoom or push-in nobody asked for. A LOCKED camera (phone on a tripod, only the person moves) is often
  best. If the model still pans, slide a crop window against it; forward drift means regenerate.
- Cut any moment where an avatar glances at the lens (except UGC). Check feet over water.

## 6. Animate only the picks
Still as the start frame. Video models morph after 3-4 s: use the clean part. Hands doing fine tasks, moving logos,
faces in wide shots and rack focus break most; plan around them (`references/camera.md`). UGC: put the spoken line in
quotes in the prompt so Veo makes voice and lip sync. Look at every clip at 4 fps (`ffmpeg -vf fps=4,tile`) and redo
what fails the ONE RULE.

## 7. Cut
9:16, 1080x1920. Keep the strongest 1.5-4 s of each clip, cut on motion and on the music's beats, hook fast, no dead
stop at the end. Trend remake: 12-20 s (longer ads up to ~60 s), the reference's song or one like it, the model's own
sound under it, the big moment on the drop. UGC: 12-16 s, her voice on top, quiet room tone, optional soft music
18 dB under, captions only if asked. Remove the Flow star and Veo marks with ffmpeg `delogo` or a crop. Keep the cut
as a script in `edit/build.sh`. Watch the final at 4 fps before showing it.

## 8. Hand over and log
Show the mp4 and a caption. Posting only after the user's yes. Log the run in the work folder's README: what worked,
what broke.
