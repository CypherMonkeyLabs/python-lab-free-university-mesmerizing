"""Generate small original motion clips for Python Lab.

Frames are plain PPM images. ffmpeg encodes a GIF, a WebM, and an MP4.
"""

from __future__ import annotations

import math
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MEDIA = ROOT / "media"
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


def write_ppm(path: Path, width: int, height: int, buf: bytearray) -> None:
    header = f"P6\n{width} {height}\n255\n".encode()
    path.write_bytes(header + buf)


def fill(buf: bytearray, width: int, height: int, color: tuple[int, int, int]) -> None:
    pixel = bytes(color)
    view = memoryview(buf)
    for i in range(width * height):
        view[i * 3 : i * 3 + 3] = pixel


def blend(buf: bytearray, width: int, x: int, y: int, color: tuple[int, int, int], alpha: float) -> None:
    if x < 0 or y < 0 or x >= width:
        return
    height = len(buf) // (width * 3)
    if y >= height:
        return
    i = (y * width + x) * 3
    for c in range(3):
        base = buf[i + c]
        buf[i + c] = int(base * (1 - alpha) + color[c] * alpha)


def disc(buf: bytearray, width: int, height: int, cx: float, cy: float, radius: float, color: tuple[int, int, int]) -> None:
    r = int(radius) + 1
    for y in range(int(cy) - r, int(cy) + r + 1):
        for x in range(int(cx) - r, int(cx) + r + 1):
            if 0 <= x < width and 0 <= y < height:
                d = math.hypot(x - cx, y - cy)
                if d <= radius:
                    blend(buf, width, x, y, color, 1)
                elif d <= radius + 1.2:
                    blend(buf, width, x, y, color, max(0, 1 - (d - radius)))


def rect(buf: bytearray, width: int, height: int, x0: int, y0: int, w: int, h: int, color: tuple[int, int, int]) -> None:
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            if 0 <= x < width and 0 <= y < height:
                blend(buf, width, x, y, color, 1)


def text(buf: bytearray, width: int, height: int, phrase: str, x: int, y: int, scale: int, color: tuple[int, int, int]) -> None:
    cursor = x
    for ch in phrase:
        glyph = FONT.get(ch, FONT[" "])
        for row, bits in enumerate(glyph):
            for col, bit in enumerate(bits):
                if bit == "1":
                    rect(buf, width, height, cursor + col * scale, y + row * scale, scale, scale, color)
        cursor += 6 * scale


def make_orbit() -> None:
    folder = TMP / "orbit"
    folder.mkdir(parents=True, exist_ok=True)
    w, h = 480, 270
    frames = 72
    for i in range(frames):
        buf = bytearray(w * h * 3)
        fill(buf, w, h, NAVY)
        t = i / frames
        disc(buf, w, h, 240, 150, 28, INK)
        disc(buf, w, h, 240, 150, 18, BRASS)
        angle = t * math.tau
        disc(buf, w, h, 240 + math.cos(angle) * 92, 150 + math.sin(angle) * 58, 10, TEAL)
        angle2 = t * math.tau * 2
        disc(buf, w, h, 240 + math.cos(angle2) * 48, 150 + math.sin(angle2) * 28, 5, CREAM)
        write_ppm(folder / f"f{i:03d}.ppm", w, h, buf)
    subprocess.run(
        [
            "ffmpeg", "-y", "-framerate", "24", "-i", str(folder / "f%03d.ppm"),
            "-an", "-c:v", "libvpx-vp9", "-b:v", "140k", "-pix_fmt", "yuv420p",
            str(MEDIA / "lab-orbit.webm"),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    subprocess.run(
        [
            "ffmpeg", "-y", "-i", str(MEDIA / "lab-orbit.webm"),
            "-frames:v", "1", str(MEDIA / "orbit-poster.jpg"),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def make_typing() -> None:
    folder = TMP / "typing"
    folder.mkdir(parents=True, exist_ok=True)
    w, h = 480, 270
    phrase = "print('hi')"
    frames = 72
    for i in range(frames):
        buf = bytearray(w * h * 3)
        fill(buf, w, h, NAVY)
        rect(buf, w, h, 36, 78, 408, 114, INK)
        shown = phrase[: min(len(phrase), i // 4)]
        text(buf, w, h, shown, 56, 112, 4, CREAM)
        if (i // 6) % 2 == 0:
            caret_x = 56 + len(shown) * 24
            rect(buf, w, h, caret_x, 108, 12, 36, BRASS)
        write_ppm(folder / f"f{i:03d}.ppm", w, h, buf)
    subprocess.run(
        [
            "ffmpeg", "-y", "-framerate", "24", "-i", str(folder / "f%03d.ppm"),
            "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "30",
            "-movflags", "+faststart", str(MEDIA / "typing.mp4"),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    subprocess.run(
        [
            "ffmpeg", "-y", "-i", str(MEDIA / "typing.mp4"),
            "-frames:v", "1", str(MEDIA / "typing-poster.jpg"),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def make_gif() -> None:
    folder = TMP / "gif"
    folder.mkdir(parents=True, exist_ok=True)
    w, h = 320, 180
    frames = 24
    for i in range(frames):
        buf = bytearray(w * h * 3)
        fill(buf, w, h, (246, 241, 231))
        step = min(3, i // 6 + 1)
        colors = [BRASS, TEAL, (143, 47, 34)]
        for level in range(step):
            rect(buf, w, h, 28 + level * 36, 36 + level * 36, 180, 28, colors[level])
        write_ppm(folder / f"f{i:03d}.ppm", w, h, buf)
    gif = MEDIA / "indent.gif"
    subprocess.run(
        [
            "ffmpeg", "-y", "-framerate", "8", "-i", str(folder / "f%03d.ppm"),
            "-vf", "split[s0][s1];[s0]palettegen=max_colors=24[p];[s1][p]paletteuse",
            "-loop", "0", str(gif),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def main() -> None:
    if TMP.exists():
        shutil.rmtree(TMP)
    MEDIA.mkdir(parents=True, exist_ok=True)
    make_orbit()
    make_typing()
    make_gif()
    shutil.rmtree(TMP)
    for path in sorted(MEDIA.iterdir()):
        print(f"{path.name:24} {path.stat().st_size / 1024:8.1f} KB")


if __name__ == "__main__":
    main()
