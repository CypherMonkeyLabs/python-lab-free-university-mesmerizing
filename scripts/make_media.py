"""Generate original motion clips, spoken offline audio lessons, and PWA brand icons for Python Lab.

Frames use Pillow / PPM images; ffmpeg encodes WebM, MP4, GIF, and MP3.
Spoken lessons are synthesized with Piper. The engine is MIT. Each voice is chosen from its own
model card and dataset page, not from the repository-wide MIT label.
Shipped voices: en_US-ljspeech-medium, en_US-norman-medium, en_GB-cori-medium.
Each was trained from scratch on a public-domain dataset. Weights are not committed.
espeak-ng is the build fallback if a Piper model is absent. macOS `say` is not used.
All generated media are original to CypherMonkeyLabs. Motion clips are CC BY-NC-SA 4.0.
The speech waveforms follow the voice licence recorded in media/voices.json.
"""

from __future__ import annotations

import json
import math
import shutil
import subprocess
import tempfile
import wave
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
MEDIA = ROOT / "media"
ASSETS = ROOT / "assets"
TMP = ROOT / "scripts" / ".frames"

# 5x7 glyphs for the typing clip. Each row is a bit string.
FONT = {
    "p": ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
    "r": ["11110", "10001", "10000", "10000", "10000", "10000", "10000"],
    "i": ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
    "n": ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
    "t": ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
    "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
    ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
    "'": ["00100", "00100", "00000", "00000", "00000", "00000", "00000"],
    "h": ["10000", "10000", "10000", "11110", "10001", "10001", "10001"],
    " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
}

NAVY = (18, 22, 28)
BRASS = (226, 161, 58)
TEAL = (126, 200, 195)
CREAM = (243, 239, 228)
INK = (28, 36, 48)


def load_pil_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for c in candidates:
        if Path(c).exists():
            try:
                return ImageFont.truetype(c, size)
            except Exception:
                pass
    return ImageFont.load_default()


def draw_zodiac_monkey(draw: ImageDraw.ImageDraw, cx: float, cy: float, r: float) -> None:
    """Draw the signature CypherMonkey zodiac monkey emblem centered at (cx, cy) with radius r."""
    # Outer zodiac halo ring
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(30, 20, 66), outline=(244, 185, 66), width=max(2, int(r * 0.06)))
    ir = r * 0.88
    draw.ellipse([cx - ir, cy - ir, cx + ir, cy + ir], outline=(127, 227, 208), width=max(1, int(r * 0.025)))

    # Zodiac cardinal ticks
    for angle_deg in range(0, 360, 30):
        ang = math.radians(angle_deg)
        x0 = cx + math.cos(ang) * (r * 0.89)
        y0 = cy + math.sin(ang) * (r * 0.89)
        x1 = cx + math.cos(ang) * (r * 0.96)
        y1 = cy + math.sin(ang) * (r * 0.96)
        draw.line([x0, y0, x1, y1], fill=(255, 224, 130), width=max(1, int(r * 0.025)))

    # Monkey ears (left & right)
    ear_r = r * 0.25
    ear_y = cy - r * 0.02
    for side in (-1, 1):
        ex = cx + side * (r * 0.56)
        draw.ellipse([ex - ear_r, ear_y - ear_r, ex + ear_r, ear_y + ear_r],
                     fill=(139, 90, 43), outline=(244, 185, 66), width=max(2, int(r * 0.035)))
        ier = ear_r * 0.62
        draw.ellipse([ex - ier, ear_y - ier, ex + ier, ear_y + ier], fill=(246, 194, 139))

    # Golden zodiac crown / antenna
    crown_pts = [
        (cx - r * 0.28, cy - r * 0.45),
        (cx - r * 0.20, cy - r * 0.68),
        (cx - r * 0.08, cy - r * 0.54),
        (cx, cy - r * 0.76),
        (cx + r * 0.08, cy - r * 0.54),
        (cx + r * 0.20, cy - r * 0.68),
        (cx + r * 0.28, cy - r * 0.45),
    ]
    draw.polygon(crown_pts, fill=(255, 213, 79), outline=(244, 185, 66))
    orb_r = r * 0.065
    draw.ellipse([cx - orb_r, cy - r * 0.81 - orb_r, cx + orb_r, cy - r * 0.81 + orb_r], fill=(127, 227, 208))

    # Outer monkey head
    hr = r * 0.50
    hy = cy - r * 0.03
    draw.ellipse([cx - hr, hy - hr * 0.95, cx + hr, hy + hr * 0.95],
                 fill=(139, 90, 43), outline=(244, 185, 66), width=max(2, int(r * 0.035)))

    # Heart-shaped inner face mask (two brow lobes + muzzle oval)
    lobe_r = r * 0.26
    for side in (-1, 1):
        lx = cx + side * (r * 0.17)
        ly = cy - r * 0.11
        draw.ellipse([lx - lobe_r, ly - lobe_r * 0.85, lx + lobe_r, ly + lobe_r * 0.85], fill=(251, 211, 167))
    mz_w = r * 0.38
    mz_h = r * 0.28
    mz_y = cy + r * 0.14
    draw.ellipse([cx - mz_w, mz_y - mz_h, cx + mz_w, mz_y + mz_h], fill=(251, 211, 167))

    # Eyes with cyan cypher rings & specular sparkle
    eye_r = r * 0.105
    eye_y = cy - r * 0.10
    for side in (-1, 1):
        ex = cx + side * (r * 0.18)
        draw.ellipse([ex - eye_r, eye_y - eye_r, ex + eye_r, eye_y + eye_r],
                     fill=(26, 20, 56), outline=(56, 217, 169), width=max(1, int(r * 0.025)))
        sp_r = eye_r * 0.35
        draw.ellipse([ex - sp_r * 1.2, eye_y - sp_r * 1.2, ex + sp_r * 0.4, eye_y + sp_r * 0.4], fill=(255, 255, 255))

    # Cute nose & warm smile
    nr = r * 0.032
    for side in (-1, 1):
        nx = cx + side * (r * 0.055)
        ny = cy + r * 0.07
        draw.ellipse([nx - nr, ny - nr, nx + nr, ny + nr], fill=(92, 51, 23))
    smile_box = [cx - r * 0.20, cy + r * 0.05, cx + r * 0.20, cy + r * 0.28]
    draw.arc(smile_box, start=15, end=165, fill=(92, 51, 23), width=max(2, int(r * 0.04)))

    # Rosy cheeks
    cr = r * 0.065
    for side in (-1, 1):
        chx = cx + side * (r * 0.27)
        chy = cy + r * 0.11
        draw.ellipse([chx - cr, chy - cr * 0.7, chx + cr, chy + cr * 0.7], fill=(247, 140, 162))


def make_pwa_assets() -> None:
    """Create PWA icons (192, 512, maskable-512, apple-touch-icon) and splash.png with zodiac monkey & cyphermonkeylabs.com."""
    ASSETS.mkdir(parents=True, exist_ok=True)

    for size, filename, maskable in [
        (180, "apple-touch-icon.png", False),
        (192, "icon-192.png", False),
        (512, "icon-512.png", False),
        (512, "icon-maskable-512.png", True),
    ]:
        img = Image.new("RGBA", (size, size), (244, 239, 255, 255))
        draw = ImageDraw.Draw(img)
        # Soft pastel studio card background
        pad = 0 if maskable else int(size * 0.04)
        rad = 0 if maskable else int(size * 0.22)
        draw.rounded_rectangle([pad, pad, size - pad - 1, size - pad - 1], radius=rad,
                               fill=(36, 22, 84, 255), outline=(244, 185, 66, 255), width=max(2, int(size * 0.025)))
        monkey_r = size * (0.31 if maskable else 0.35)
        monkey_cy = size * (0.43 if size >= 192 else 0.44)
        draw_zodiac_monkey(draw, size / 2, monkey_cy, monkey_r)

        # Bottom pill with cyphermonkeylabs.com
        font_sz = max(10, int(size * (0.052 if maskable else 0.056)))
        fnt = load_pil_font(font_sz, bold=True)
        label = "cyphermonkeylabs.com"
        bbox = draw.textbbox((0, 0), label, font=fnt)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        py = size * (0.83 if maskable else 0.86)
        pw = tw + size * 0.08
        ph = th + size * 0.045
        draw.rounded_rectangle([size / 2 - pw / 2, py - ph / 2, size / 2 + pw / 2, py + ph / 2],
                               radius=int(ph / 2), fill=(18, 13, 43, 240), outline=(127, 227, 208, 255), width=max(1, int(size * 0.008)))
        draw.text((size / 2 - tw / 2, py - th / 2 - bbox[1] * 0.5), label, font=fnt, fill=(255, 235, 153, 255))
        img.save(ASSETS / filename, format="PNG", optimize=True)

    # Splash screen (1280x720)
    sw, sh = 1280, 720
    splash = Image.new("RGBA", (sw, sh), (246, 242, 255, 255))
    sdraw = ImageDraw.Draw(splash)
    # Pastel decorative circles
    sdraw.ellipse([-120, -120, 360, 360], fill=(229, 219, 255, 255))
    sdraw.ellipse([940, 380, 1400, 840], fill=(214, 245, 238, 255))
    # Main card
    sdraw.rounded_rectangle([80, 60, sw - 80, sh - 60], radius=36,
                            fill=(255, 255, 255, 255), outline=(205, 192, 245, 255), width=4)
    draw_zodiac_monkey(sdraw, 320, 360, 175)

    f_kicker = load_pil_font(22, bold=True)
    f_title = load_pil_font(54, bold=True)
    f_sub = load_pil_font(26, bold=False)
    f_domain = load_pil_font(28, bold=True)

    sdraw.text((540, 175), "CYPHERMONKEY ZODIAC LAB SERIES", font=f_kicker, fill=(104, 66, 194, 255))
    sdraw.text((540, 220), "Python Lab", font=f_title, fill=(32, 20, 72, 255))
    sdraw.text((540, 292), "Free University-Style Interactive Python Course", font=f_sub, fill=(62, 54, 96, 255))
    sdraw.text((540, 338), "Run real CPython 3.14 in your browser · Offline-ready PWA", font=f_sub, fill=(62, 54, 96, 255))

    # Domain badge
    sdraw.rounded_rectangle([540, 410, 960, 474], radius=32, fill=(36, 22, 84, 255), outline=(244, 185, 66, 255), width=3)
    sdraw.text((572, 426), "cyphermonkeylabs.com", font=f_domain, fill=(255, 224, 130, 255))

    f_foot = load_pil_font(18, bold=False)
    sdraw.text((540, 515), "Educational material · Not an accredited institution · CC BY-NC-SA 4.0 / MIT",
               font=f_foot, fill=(100, 96, 128, 255))
    splash.convert("RGB").save(ASSETS / "splash.png", format="PNG", optimize=True)


def make_explainer_videos() -> None:
    """Generate 3 new visual explainer clips:
    1. media/list-comprehension.mp4 + media/list-comp-poster.jpg
    2. media/dict-lookup.webm + media/dict-poster.jpg
    3. media/async-loop.gif
    """
    MEDIA.mkdir(parents=True, exist_ok=True)
    w, h = 480, 270
    f_title = load_pil_font(18, bold=True)
    f_code = load_pil_font(16, bold=True)
    f_small = load_pil_font(13, bold=False)

    # 1. List comprehension visual explainer (MP4 + poster)
    lc_dir = TMP / "listcomp"
    lc_dir.mkdir(parents=True, exist_ok=True)
    frames = 72
    inputs = [1, 2, 3, 4]
    for i in range(frames):
        img = Image.new("RGB", (w, h), (247, 244, 255))
        d = ImageDraw.Draw(img)
        # Header bar
        d.rounded_rectangle([16, 14, w - 16, 54], radius=10, fill=(42, 26, 94))
        d.text((28, 24), "[x * 2 for x in [1, 2, 3, 4] if x % 2 == 0]", font=f_code, fill=(255, 230, 140))

        step = min(4, i // 15)  # 0..4
        # Input boxes
        d.text((24, 70), "1. Iterate x:", font=f_small, fill=(60, 50, 95))
        for idx, val in enumerate(inputs):
            bx = 130 + idx * 72
            by = 64
            active = (idx == step and step < 4)
            bg = (255, 224, 130) if active else (230, 224, 248)
            d.rounded_rectangle([bx, by, bx + 54, by + 34], radius=8, fill=bg, outline=(90, 70, 160), width=2)
            d.text((bx + 21, by + 8), str(val), font=f_title, fill=(30, 20, 60))

        # Filter stage
        d.text((24, 122), "2. Filter even:", font=f_small, fill=(60, 50, 95))
        for idx, val in enumerate(inputs):
            if idx <= step:
                bx = 130 + idx * 72
                by = 116
                passed = (val % 2 == 0)
                bg = (196, 242, 218) if passed else (252, 216, 222)
                fg = (18, 94, 58) if passed else (148, 38, 56)
                d.rounded_rectangle([bx, by, bx + 54, by + 34], radius=8, fill=bg, outline=fg, width=2)
                d.text((bx + 12, by + 9), "KEEP" if passed else "SKIP", font=f_small, fill=fg)

        # Output list stage
        d.text((24, 180), "3. Output list:", font=f_small, fill=(60, 50, 95))
        d.rounded_rectangle([130, 170, 410, 222], radius=10, fill=(255, 255, 255), outline=(90, 70, 160), width=2)
        out_vals = [str(v * 2) for idx, v in enumerate(inputs) if idx <= step and v % 2 == 0]
        d.text((148, 186), "[ " + ",  ".join(out_vals) + " ]", font=f_title, fill=(32, 112, 74))

        d.text((24, 240), "CypherMonkeyLabs · cyphermonkeylabs.com · CPython 3.14", font=f_small, fill=(110, 100, 145))
        img.save(lc_dir / f"f{i:03d}.png")

    subprocess.run(
        [
            "ffmpeg", "-y", "-framerate", "24", "-i", str(lc_dir / "f%03d.png"),
            "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "28",
            "-movflags", "+faststart", str(MEDIA / "list-comprehension.mp4"),
        ],
        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    subprocess.run(
        [
            "ffmpeg", "-y", "-i", str(MEDIA / "list-comprehension.mp4"),
            "-frames:v", "1", "-ss", "00:00:02", str(MEDIA / "list-comp-poster.jpg"),
        ],
        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )

    # 2. Dict hash lookup explainer (WebM + poster)
    dl_dir = TMP / "dictlookup"
    dl_dir.mkdir(parents=True, exist_ok=True)
    for i in range(frames):
        img = Image.new("RGB", (w, h), (242, 249, 248))
        d = ImageDraw.Draw(img)
        d.rounded_rectangle([16, 14, w - 16, 52], radius=10, fill=(22, 64, 72))
        d.text((28, 23), "scores['alice']  ->  hash('alice') & mask  ->  98", font=f_code, fill=(168, 245, 232))

        phase = i / frames
        # Key box
        d.rounded_rectangle([24, 96, 144, 152], radius=10, fill=(255, 235, 168), outline=(180, 130, 30), width=2)
        d.text((42, 106), "Key:", font=f_small, fill=(90, 65, 15))
        d.text((42, 124), "'alice'", font=f_title, fill=(40, 28, 10))

        # Hash function box
        h_active = phase >= 0.25
        d.rounded_rectangle([176, 96, 296, 152], radius=10,
                            fill=(206, 238, 255) if h_active else (232, 238, 242),
                            outline=(45, 115, 165), width=2)
        d.text((190, 106), "hash & 0b111", font=f_small, fill=(30, 75, 110))
        d.text((190, 124), "slot #2" if h_active else "computing...", font=f_title, fill=(20, 55, 85))

        # Hash table slots on right
        for slot in range(4):
            sy = 68 + slot * 40
            hit = (slot == 2 and phase >= 0.55)
            bg = (182, 242, 210) if hit else (255, 255, 255)
            d.rounded_rectangle([332, sy, 456, sy + 32], radius=6, fill=bg, outline=(40, 110, 90), width=2 if hit else 1)
            txt = f"[{slot}] 'alice': 98" if slot == 2 else f"[{slot}] <empty>"
            d.text((342, sy + 7), txt, font=f_small, fill=(15, 70, 45) if hit else (120, 130, 135))

        d.text((24, 240), "Average O(1) lookup in CPython dict · cyphermonkeylabs.com", font=f_small, fill=(70, 105, 105))
        img.save(dl_dir / f"f{i:03d}.png")

    subprocess.run(
        [
            "ffmpeg", "-y", "-framerate", "24", "-i", str(dl_dir / "f%03d.png"),
            "-an", "-c:v", "libvpx-vp9", "-b:v", "160k", "-pix_fmt", "yuv420p",
            str(MEDIA / "dict-lookup.webm"),
        ],
        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    subprocess.run(
        [
            "ffmpeg", "-y", "-i", str(MEDIA / "dict-lookup.webm"),
            "-frames:v", "1", "-ss", "00:00:02", str(MEDIA / "dict-poster.jpg"),
        ],
        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )

    # 3. Asyncio event loop interleaving GIF
    al_dir = TMP / "asyncloop"
    al_dir.mkdir(parents=True, exist_ok=True)
    gw, gh = 360, 200
    g_frames = 24
    for i in range(g_frames):
        img = Image.new("RGB", (gw, gh), (250, 246, 255))
        d = ImageDraw.Draw(img)
        d.rounded_rectangle([12, 10, gw - 12, 40], radius=8, fill=(52, 34, 108))
        d.text((22, 17), "asyncio: 1 thread, cooperative await", font=f_small, fill=(255, 228, 148))

        # Timeline bars for Task A and Task B
        d.text((16, 62), "Task A", font=f_small, fill=(40, 30, 80))
        d.text((16, 114), "Task B", font=f_small, fill=(40, 30, 80))
        # Task A segments: run [0..5], await IO [6..14], finish [15..19]
        # Task B segments: run [5..11], await IO [12..17], finish [18..22]
        for step in range(min(i + 1, 22)):
            x = 76 + step * 12
            # Task A
            a_state = "run" if (step < 5 or 14 <= step < 19) else ("wait" if 5 <= step < 14 else "done")
            a_col = (112, 214, 168) if a_state == "run" else ((255, 218, 128) if a_state == "wait" else (225, 220, 240))
            d.rectangle([x, 58, x + 10, 84], fill=a_col, outline=(80, 70, 120))
            # Task B
            b_state = "run" if (5 <= step < 11 or 19 <= step < 22) else ("wait" if 11 <= step < 19 else "idle")
            b_col = (126, 188, 248) if b_state == "run" else ((255, 218, 128) if b_state == "wait" else (235, 232, 245))
            d.rectangle([x, 110, x + 10, 136], fill=b_col, outline=(80, 70, 120))

        d.text((16, 162), "Green/Blue = CPU · Gold = awaiting I/O · cyphermonkeylabs.com", font=f_small, fill=(95, 85, 130))
        img.save(al_dir / f"f{i:03d}.png")

    subprocess.run(
        [
            "ffmpeg", "-y", "-framerate", "8", "-i", str(al_dir / "f%03d.png"),
            "-vf", "split[s0][s1];[s0]palettegen=max_colors=32[p];[s1][p]paletteuse",
            "-loop", "0", str(MEDIA / "async-loop.gif"),
        ],
        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )


AUDIO_LESSONS = [
    (
        "audio-syntax.mp3",
        "CypherMonkey Labs Python Lab, Audio Lesson One: Names, Types, and Indentation. "
        "In Python, four spaces group a block of code, and assignment binds a name to an object rather than copying it. "
        "Use type of x to inspect any runtime value, and remember that strings and tuples are immutable while lists and dictionaries can change in place."
    ),
    (
        "audio-structures.mp3",
        "CypherMonkey Labs Python Lab, Audio Lesson Two: Choosing the Right Data Structure. "
        "In CPython, a list stores references in a contiguous array: appending at the end is amortized constant time, while inserting at index zero shifts every element in linear time. "
        "When you need fast membership checks or key lookups, reach for a set or dictionary, which hash the key to jump straight to a bucket in average constant time."
    ),
    (
        "audio-async.mp3",
        "CypherMonkey Labs Python Lab, Audio Lesson Three: Generators, Coroutines, and Async I O. "
        "A generator uses yield to produce one item at a time without building a giant list in memory. "
        "An async def coroutine runs on a single thread event loop: when it reaches await on network or timer I O, it pauses politely so other tasks can run."
    ),
    (
        "audio-interview.mp3",
        "CypherMonkey Labs Python Lab, Audio Lesson Four: Interview Problem Solving Checklist. "
        "Before writing code, repeat the inputs, outputs, and edge cases such as an empty list or duplicate keys. "
        "Start with a clear working solution, trace it by hand on a tiny example, and state both time and space complexity honestly for CPython."
    ),
]


PIPER_DIR = Path("/tmp/piper-voices")
SPEECH_VOICES = [
    {
        "id": "ljspeech",
        "kind": "file",
        "label": "Linda · United States",
        "detail": "Piper en_US-ljspeech-medium, trained from scratch on the public-domain LJ Speech dataset (Linda Johnson, LibriVox)",
        "model": "en_US-ljspeech-medium.onnx",
        "espeak": "en-us",
        "suffix": "",
        "licence": "LJ Speech is public domain in the US. Keith Ito: “There are no restrictions on its use.” Piper engine is MIT. Weights are not shipped.",
    },
    {
        "id": "norman",
        "kind": "file",
        "label": "Norman · United States",
        "detail": "Piper en_US-norman-medium, trained from scratch by Bryce Beattie on public-domain LibriVox recordings",
        "model": "en_US-norman-medium.onnx",
        "espeak": "en-us",
        "suffix": "-norman",
        "licence": "LibriVox recordings are public domain in the US. LibriVox: “anyone can use all our recordings however they wish (even to sell them).” Piper engine is MIT. Weights are not shipped.",
    },
    {
        "id": "cori",
        "kind": "file",
        "label": "Cori · Britain",
        "detail": "Piper en_GB-cori-medium, trained from scratch by Bryce Beattie on public-domain LibriVox recordings",
        "model": "en_GB-cori-medium.onnx",
        "espeak": "en-gb",
        "suffix": "-cori",
        "licence": "LibriVox recordings are public domain in the US. LibriVox: “anyone can use all our recordings however they wish (even to sell them).” Piper engine is MIT. Weights are not shipped.",
    },
]
DEVICE_VOICE = {
    "id": "device",
    "kind": "synth",
    "label": "This device",
    "detail": "The browser speechSynthesis voice. Quality depends on the operating system.",
    "licence": "No audio file is shipped. Speech comes from the visitor's device.",
    "preview": "",
    "files": {},
}
PREVIEW_LINE = "Cypher Monkey, Python Lab, cyphermonkeylabs.com."


def _to_mp3(src: Path, dest: Path) -> None:
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(src), "-ac", "1", "-ar", "22050", "-b:a", "40k", str(dest)],
        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )


def _piper_voice(model: Path):
    from piper import PiperVoice
    return PiperVoice.load(str(model))


def _speak_piper(voice, text: str, wav_path: Path) -> None:
    with wave.open(str(wav_path), "wb") as handle:
        if hasattr(voice, "synthesize_wav"):
            voice.synthesize_wav(text, handle)
        else:
            voice.synthesize(text, handle)


def _speak_espeak(espeak_voice: str, text: str, wav_path: Path) -> None:
    exe = shutil.which("espeak-ng") or shutil.which("espeak")
    if not exe:
        raise RuntimeError("Neither Piper nor espeak-ng is available")
    subprocess.run([exe, "-v", espeak_voice, "-s", "148", "-w", str(wav_path), text], check=True)


def make_audio_lessons() -> None:
    """Synthesize three licence-safe voices. Piper when the models are present, else espeak-ng."""
    MEDIA.mkdir(parents=True, exist_ok=True)
    slots = [(name.removesuffix(".mp3"), text) for name, text in AUDIO_LESSONS]
    manifest_voices = []
    engine = "piper"
    with tempfile.TemporaryDirectory() as tdir:
        tpath = Path(tdir)
        for spec in SPEECH_VOICES:
            model = PIPER_DIR / spec["model"]
            piper = None
            if model.is_file():
                piper = _piper_voice(model)
            else:
                engine = "espeak-ng"
            files = {}
            for slot, text in slots:
                dest_name = f"{slot}{spec['suffix']}.mp3"
                wav = tpath / f"{dest_name}.wav"
                if piper is not None:
                    _speak_piper(piper, text, wav)
                else:
                    _speak_espeak(spec["espeak"], text, wav)
                _to_mp3(wav, MEDIA / dest_name)
                files[slot.removeprefix("audio-")] = f"media/{dest_name}"
            preview_name = f"voice-preview-{spec['id']}.mp3"
            preview_wav = tpath / f"{preview_name}.wav"
            if piper is not None:
                _speak_piper(piper, PREVIEW_LINE, preview_wav)
            else:
                _speak_espeak(spec["espeak"], PREVIEW_LINE, preview_wav)
            _to_mp3(preview_wav, MEDIA / preview_name)
            manifest_voices.append({
                "id": spec["id"],
                "kind": "file",
                "label": spec["label"],
                "detail": spec["detail"] if piper is not None else f"espeak-ng voice {spec['espeak']} (Piper model was not on this machine)",
                "licence": spec["licence"] if piper is not None else "Generated with espeak-ng (GPL-3.0-or-later), which is not vendored. Waveform only.",
                "preview": f"media/{preview_name}",
                "files": files,
            })
    manifest_voices.append(DEVICE_VOICE)
    (MEDIA / "voices.json").write_text(json.dumps({
        "generated": "2026-10-18",
        "engine": engine,
        "engine_url": "https://github.com/rhasspy/piper" if engine == "piper" else "https://github.com/espeak-ng/espeak-ng",
        "engine_licence": "MIT" if engine == "piper" else "GPL-3.0-or-later",
        "model_card": "https://huggingface.co/rhasspy/piper-voices",
        "note": "macOS say was not used. Voice weights are not committed. Dataset licences were read from each voice MODEL_CARD and the dataset page on 2026-10-18. See licenses/piper-voices.txt.",
        "voices": manifest_voices,
    }, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    if TMP.exists():
        shutil.rmtree(TMP)
    MEDIA.mkdir(parents=True, exist_ok=True)
    ASSETS.mkdir(parents=True, exist_ok=True)
    # Keep existing 5 media files deterministic unless missing
    if not (MEDIA / "lab-orbit.webm").exists():
        make_orbit()
    if not (MEDIA / "typing.mp4").exists():
        make_typing()
    if not (MEDIA / "indent.gif").exists():
        make_gif()
    make_pwa_assets()
    make_explainer_videos()
    make_audio_lessons()
    if TMP.exists():
        shutil.rmtree(TMP)
    for folder in (ASSETS, MEDIA):
        for path in sorted(folder.iterdir()):
            if path.is_file():
                print(f"{path.relative_to(ROOT).as_posix():36} {path.stat().st_size / 1024:8.1f} KB")


if __name__ == "__main__":
    main()
