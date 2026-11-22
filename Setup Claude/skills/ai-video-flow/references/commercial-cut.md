# The commercial cut: many angles, best seconds only

Learned from Kaye's Oakley x Meta spec ad (youtu.be/d-TCtUhaLiU). Do not make one premium shot and hope: AI video
models are weak at long shots, so make many angles, find the strongest seconds of each, and cut them together. That
editing is what makes it look premium. Use it for short AI-generated videos.

## Why one long AI shot fails
AI clips hold for about 2-4 seconds, then faces drift, hands melt, the camera wanders or zooms on its own. One
10-second take shows all of it. A cut hides it: the viewer sees only the clean seconds.

## Plan: the shot list
- **5-8 shots for a 12-20 s vertical video**, 1.5-4 s each on screen. Kaye: 56 s, about 20 shots.
- **Every shot a different distance or angle from the one before.** A good order for one place:
  strange hook angle → close detail → POV → wide/drone for scale → slow quiet beat → extreme close-up product hero.
- **Two angles per place at least:** one wide to say where we are, one close for the face or the product.
- **Hook = an angle nobody has seen** (upside-down face, camera on the road with the wheel inches away, inside an
  object). The strangest angle goes first, the closest goes last.
- **Speed needs a reference:** people, flags, birds, rocks in the foreground or background rushing past. Empty sky
  reads slow.
- **Energy curve:** fast, fast, fast, then one slow-motion or still beat, then the hero.
- **One loud colour per scene** against a muted land (a pink bike in grey hills, a royal-blue bike in brown
  mountains).
- **The product must do something on screen** (glasses record, answer, guide). A voice line every few shots
  ("Hey Meta..."), written as short dialogue, never an ad voice.
- **Joins inside the footage:** cut on a body or object crossing the frame, a shared element between two places
  (the wingsuit flying over the cyclist), a pan across a lens, the empty frame after the person leaves. See
  `transitions.md`.

## Make: sheets, then stills, then clips
1. **Character sheet for every person and outfit** (3 panels: full front, full side, close-up face, plain grey
   backdrop, "no logos, no text"). Secondary people need sheets too; faces with no sheet come out broken.
2. **A still per shot first** (cheap or free, 4 takes), then animate only the picks. Pick by: face matches the sheet,
   nothing breaks physics, the shot size is right.
3. **Prompt in blocks:** references and what each fixes; SCENE with camera position first; LOCATION MAP (frame left /
   centre / right); timed beats (0:00-0:03 ...); BODY AND PHYSICS ("exactly one person", "constant limb lengths",
   "gravity heavy and real-time"); LIGHT (name the single saturated colour); COLOUR; lens character (oval bokeh,
   faint fringe, streak flare only when...); REALISM ("reads as a still frame from a real commercial shot on
   location"); AUDIO; LOCKS (one camera, one direction, the exact line spoken, the thing that must not happen).
4. **Camera words that held:** "100mm telephoto" for tight faces; "camera does not move" / "the camera stays where it
   is" to stop random zooms; naming a cinematographer for a style (Lubezki = raw handheld close-up); "camera lying on
   the asphalt" style physical anchors for odd angles. When a position will not come out, draw a rough sketch and
   prompt from it.
5. **Cheap drafts first** (480p draft modes); spend on quality only for the take you keep.

## Cut: find the best seconds
1. For each clip make a frame sheet at 4 fps with timestamps and look at every frame.
2. Mark the window where the frame is cleanest **and** something moves (the wheel passes, the hand taps, the flag
   snaps). That is usually 1.5-3 s. Throw away the rest, even if it is fine.
3. Order by the shot list, then check the joins: does motion or direction carry across the cut? If two neighbours
   are the same size, drop one or swap the order.
4. Put the beat (music hit or whoosh) on the cut, the voice line on the shot where the product acts, a short
   slow-motion (frame blend) on the quiet beat.
5. End on the product close-up and the lockup; hold it 1-1.5 s.
6. Watch the final at 4 fps before showing it, and check every frame for what breaks real-world sense.

## Learned on a many-angle ad (2026-10-24)
- **Usable seconds per 8 s Veo take: 1.0-3.0.** Veo drifted the camera in most takes (rode away then back, widened a
  close-up to a medium, pushed in on a "static" shot). The clean window was often not the start: one shot's best part
  was 5.0-6.6 s, when the rider rushed the lens and left frame.
- **Weather/place flip on the same road:** repaint your own still with Nano Banana ("keep this exact photo... change
  only the weather and the land"), animate both stills with the same motion. At the same timestamp both clips sit on
  the same spot of road, so cutting dry 0.0-1.0 s into wet 1.0-2.9 s flips the world in one frame. Cheaper and
  cleaner than any transition.
- **A weather change keeps the place:** same road, same kind of land, new weather. Do not jump to a different kind of
  place.
- **Things Veo adds late:** a second rider appeared at 3.5 s in a wide; water blobs landed on the camera lens over
  the face at 2.25 s. Cut before them.
- **Exits are gold:** the frame the subject rides out of (dust, empty road) is the best cut point into the next shot.
- **Too wide to be a close-up?** Crop in (720x1280 source, a 576x1024 crop still looks fine at 1080x1920).
- **Music map first:** find the track's break and drop (librosa beat + RMS per second), put the quiet shot in the
  break and the product flare on the drop, then snap every cut to the nearest beat.
- **Voice of the product:** any text-to-speech voice (a local Kokoro voice works), one short line per section, a plain
  white caption under it.

## Learned on a 56 s ad (2026-10-25)
- **Video on BytePlus Seedance first** (free token quota per model). ~103k tokens per 5 s 720p clip. 1.0 Pro for
  action and faces, 1.0 Pro Fast for wides, top-downs and drones (looked just as good there). Its "AI generated" strip
  sits in the bottom 13%: crop it off.
- **Seedance moves people backward** when the subject faces the lens in a "run toward camera" still. A last frame
  helps only partly; the end of the clip (the part that reaches the last frame) is usually the usable part.
- **Repaint flips only hold the framing if you change materials, not the scene.** Asking for a new outfit + pose +
  props made Flow recompose; "edit this exact photo, change only the materials (snow → sand, skis → board)" kept it.
- **When the two flip clips move in opposite directions, play clip A backwards** into the shared first frame, then
  cut to clip B at frame 0 (river kayak reversed down into the snow couloir). Top-down water reversed is invisible.
- **Build the music map first** (librosa beats + RMS per second), splice the track on bar lines, and fit the shot
  table to it: quiet build = hush shot, drop = reveal, break = slow motion, second drop = the biggest flip.
- **Logo lockup:** check the frame it lands on; white type on a white helmet vanished. Put it over the darkest area.
- **Empty frame after the subject exits** (camels walking on after the rider slides out) reads as premium, keep it.
- **Marks:** Flow's star and the "Veo" text sit in the bottom-right corner: remove them with ffmpeg `delogo` or a crop.
