#!/usr/bin/env python3
"""Generate thematic dark tech banners for each IN4MIND course card."""
from __future__ import annotations

from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "src" / "img" / "banners"

# accent glow, secondary, motif key
THEMES = {
    "canvas": ("#00c4cc", "#7b2ff7", "palette"),
    "figma": ("#a259ff", "#f24e1e", "figma"),
    "python": ("#3776ab", "#ffd43b", "python"),
    "javascript": ("#f7df1e", "#323330", "js"),
    "html": ("#e34f26", "#f06529", "code"),
    "css": ("#264de4", "#2965f1", "code"),
    "github": ("#58a6ff", "#c9d1d9", "octocat"),
    "excel": ("#217346", "#33c481", "chart"),
    "powerpoint": ("#c43e1c", "#ff8f6b", "slides"),
    "sql": ("#00758f", "#f29111", "db"),
    "cybersecurity": ("#3b82f6", "#22d3ee", "shield"),
    "flowchart": ("#38bdf8", "#818cf8", "flow"),
    "os": ("#94a3b8", "#60a5fa", "window"),
    "powerapps": ("#742774", "#b4a0ff", "apps"),
    "sharepoint": ("#038387", "#70cad0", "cloud"),
    "outlook": ("#0072c6", "#28a8ea", "mail"),
    "onedrive": ("#094ab2", "#4cc2ff", "cloud"),
    "scrum": ("#8b5cf6", "#c4b5fd", "agile"),
    "scratch": ("#ff8c1a", "#4d97ff", "blocks"),
    "video-editing": ("#ef4444", "#fca5a5", "film"),
    "django": ("#092e20", "#44b78b", "django"),
    "powerbi": ("#f2c811", "#f9e547", "chart"),
    "prompt-engineering": ("#22d3ee", "#818cf8", "brain"),
    "engineering": ("#64748b", "#38bdf8", "gear"),
    "game-editing": ("#22c55e", "#a3e635", "game"),
}


def circuit(accent: str) -> str:
    return f"""
  <g stroke="{accent}" stroke-width="1.1" opacity="0.35" fill="none">
    <path d="M20 40h140v36h90"/><path d="M280 28v90h70"/><path d="M420 50h160v60"/>
    <path d="M60 150h110v80h120"/><path d="M340 170v100h90"/><path d="M500 140h100v110"/>
    <path d="M30 270h170v55"/><path d="M260 290h200"/><path d="M500 260v70h110"/>
    <path d="M560 30v95h70"/><path d="M190 230h120v70"/>
  </g>
  <g fill="{accent}" opacity="0.55">
    <circle cx="20" cy="40" r="3"/><circle cx="160" cy="76" r="3"/><circle cx="280" cy="118" r="3"/>
    <circle cx="350" cy="28" r="3"/><circle cx="580" cy="50" r="3"/><circle cx="600" cy="110" r="3"/>
    <circle cx="170" cy="230" r="3"/><circle cx="340" cy="270" r="3"/><circle cx="500" cy="250" r="3"/>
    <circle cx="30" cy="325" r="3"/><circle cx="460" cy="290" r="3"/><circle cx="610" cy="330" r="3"/>
  </g>
"""


def motif(kind: str, a: str, b: str) -> str:
    # Large artwork on the right half
    if kind == "python":
        return f"""
  <g transform="translate(390,55) scale(1.05)" opacity="0.92">
    <path fill="{a}" d="M78 18c-28 0-32 12-32 28v20h36v6H30c-20 0-38 12-38 40 0 22 10 36 34 40 16 2 28 2 44 2h10V118c0-20 10-30 30-30h34V70c0-28-14-52-66-52zm-16 24a10 10 0 110 20 10 10 0 010-20z"/>
    <path fill="{b}" d="M112 82v-6h36c20 0 38-12 38-40 0-22-10-36-34-40C136-6 124-6 108-6H98v36c0 20-10 30-30 30H44v18c0 28 14 52 66 52 28 0 32-12 32-28V98h-30z"/>
    <circle fill="{a}" cx="128" cy="40" r="8"/>
  </g>"""
    if kind == "js":
        return f"""
  <g transform="translate(430,70)" opacity="0.95">
    <rect x="0" y="0" width="150" height="150" rx="18" fill="{a}"/>
    <text x="28" y="108" font-family="Arial Black,Arial,sans-serif" font-size="88" font-weight="900" fill="{b}">JS</text>
  </g>"""
    if kind == "octocat":
        return f"""
  <g transform="translate(430,55)" opacity="0.9" fill="{b}">
    <circle cx="80" cy="90" r="78" fill="none" stroke="{a}" stroke-width="6" opacity="0.7"/>
    <path d="M80 30c-30 0-54 24-54 54 0 24 16 44 37 51v-18c-15 3-18-7-18-7-2-6-6-8-6-8-5-3 0-3 0-3 5 1 8 6 8 6 5 8 12 6 15 4 1-3 5-6 8-7-12-1-24-6-24-26 0-6 2-11 6-15-1-1-3-7 0-14 0 0 5-2 16 6a54 54 0 0128 0c11-8 16-6 16-6 3 7 1 13 0 14 4 4 6 9 6 15 0 20-12 25-24 26 4 3 8 9 8 18v22c21-7 37-27 37-51 0-30-24-54-54-54z"/>
  </g>"""
    if kind == "shield":
        return f"""
  <g transform="translate(430,45)" opacity="0.92">
    <path fill="{a}" opacity="0.25" d="M80 10l70 28v54c0 42-30 78-70 92-40-14-70-50-70-92V38z"/>
    <path fill="none" stroke="{a}" stroke-width="8" d="M80 20l58 24v46c0 34-24 64-58 76-34-12-58-42-58-76V44z"/>
    <rect x="58" y="88" width="44" height="36" rx="6" fill="{b}" opacity="0.85"/>
    <path stroke="{b}" stroke-width="6" fill="none" d="M70 88v-12a10 10 0 0120 0v12"/>
  </g>"""
    if kind == "chart":
        return f"""
  <g transform="translate(400,80)" opacity="0.9">
    <rect x="10" y="110" width="28" height="70" rx="4" fill="{a}"/>
    <rect x="50" y="70" width="28" height="110" rx="4" fill="{b}"/>
    <rect x="90" y="40" width="28" height="140" rx="4" fill="{a}"/>
    <rect x="130" y="90" width="28" height="90" rx="4" fill="{b}"/>
    <path d="M8 40 L55 85 L95 35 L170 75" stroke="{b}" stroke-width="5" fill="none" opacity="0.85"/>
    <circle cx="55" cy="85" r="5" fill="#fff"/><circle cx="95" cy="35" r="5" fill="#fff"/>
  </g>"""
    if kind == "figma":
        return f"""
  <g transform="translate(450,55)" opacity="0.92">
    <circle cx="40" cy="40" r="28" fill="#f24e1e"/>
    <circle cx="40" cy="96" r="28" fill="#ff7262"/>
    <circle cx="40" cy="152" r="28" fill="#a259ff"/>
    <circle cx="96" cy="40" r="28" fill="#ff7262"/>
    <circle cx="96" cy="96" r="28" fill="#1abcfe"/>
    <rect x="120" y="30" width="70" height="44" rx="10" fill="rgba(255,255,255,0.12)" stroke="{a}" stroke-width="2"/>
    <rect x="132" y="90" width="58" height="36" rx="8" fill="rgba(255,255,255,0.1)" stroke="{b}" stroke-width="2"/>
  </g>"""
    if kind == "palette":
        return f"""
  <g transform="translate(420,60)" opacity="0.9">
    <circle cx="90" cy="100" r="88" fill="{a}" opacity="0.2"/>
    <circle cx="55" cy="70" r="22" fill="#00c4cc"/>
    <circle cx="110" cy="55" r="18" fill="#7b2ff7"/>
    <circle cx="135" cy="105" r="20" fill="#ff6b6b"/>
    <circle cx="95" cy="145" r="16" fill="#f7df1e"/>
    <circle cx="50" cy="125" r="14" fill="#22c55e"/>
  </g>"""
    if kind == "db":
        return f"""
  <g transform="translate(430,55)" opacity="0.92" fill="none" stroke="{a}" stroke-width="7">
    <ellipse cx="90" cy="50" rx="70" ry="26"/>
    <path d="M20 50v120c0 14 31 26 70 26s70-12 70-26V50"/>
    <path d="M20 95c0 14 31 26 70 26s70-12 70-26"/>
    <path d="M20 135c0 14 31 26 70 26s70-12 70-26"/>
  </g>"""
    if kind == "brain":
        return f"""
  <g transform="translate(420,50)" opacity="0.9" fill="none" stroke="{a}" stroke-width="5">
    <path d="M90 40c-30 0-50 22-50 48 0 18 8 30 22 38-4 8-6 14-6 22 0 24 20 42 44 42s44-18 44-42c0-8-2-14-6-22 14-8 22-20 22-38 0-26-20-48-50-48z"/>
    <path d="M70 100h40M65 130h50M80 70c10 8 20 8 30 0" stroke="{b}"/>
    <circle cx="70" cy="90" r="4" fill="{b}" stroke="none"/><circle cx="115" cy="105" r="4" fill="{b}" stroke="none"/>
    <circle cx="90" cy="150" r="4" fill="{a}" stroke="none"/>
  </g>"""
    if kind == "game":
        return f"""
  <g transform="translate(400,90)" opacity="0.92">
    <path fill="{a}" d="M40 40h160c18 0 30 14 28 30l-8 55c-2 14-14 25-28 25h-30l-14-22h-36l-14 22H68c-14 0-26-11-28-25l-8-55c-2-16 10-30 28-30z"/>
    <circle cx="80" cy="85" r="10" fill="#0b1220"/><rect x="70" y="75" width="20" height="8" rx="2" fill="#0b1220"/>
    <circle cx="165" cy="78" r="7" fill="{b}"/><circle cx="182" cy="92" r="7" fill="{b}"/>
    <rect x="30" y="20" width="14" height="14" fill="{b}" opacity="0.7"/>
    <rect x="55" y="8" width="14" height="14" fill="{a}" opacity="0.5"/>
    <rect x="200" y="25" width="14" height="14" fill="{b}" opacity="0.6"/>
  </g>"""
    if kind == "blocks":
        return f"""
  <g transform="translate(420,70)" opacity="0.92">
    <rect x="20" y="20" width="140" height="36" rx="8" fill="#4d97ff"/>
    <rect x="40" y="70" width="120" height="36" rx="8" fill="#ff8c1a"/>
    <rect x="10" y="120" width="150" height="36" rx="8" fill="#22c55e"/>
    <rect x="55" y="170" width="100" height="36" rx="8" fill="#e11d48"/>
  </g>"""
    if kind == "mail":
        return f"""
  <g transform="translate(420,70)" opacity="0.9">
    <rect x="20" y="50" width="170" height="120" rx="14" fill="none" stroke="{a}" stroke-width="7"/>
    <path d="M28 58l77 58 77-58" stroke="{b}" stroke-width="7" fill="none"/>
  </g>"""
    if kind == "cloud":
        return f"""
  <g transform="translate(410,80)" opacity="0.9" fill="{a}">
    <ellipse cx="90" cy="120" rx="95" ry="48"/>
    <circle cx="50" cy="95" r="40"/><circle cx="110" cy="80" r="52"/><circle cx="155" cy="105" r="36"/>
  </g>"""
    if kind == "film":
        return f"""
  <g transform="translate(430,60)" opacity="0.9">
    <rect x="20" y="30" width="150" height="200" rx="12" fill="none" stroke="{a}" stroke-width="8"/>
    <rect x="20" y="30" width="28" height="200" fill="{a}" opacity="0.35"/>
    <rect x="142" y="30" width="28" height="200" fill="{a}" opacity="0.35"/>
    <rect x="26" y="50" width="16" height="16" fill="{b}"/><rect x="26" y="90" width="16" height="16" fill="{b}"/>
    <rect x="26" y="130" width="16" height="16" fill="{b}"/><rect x="26" y="170" width="16" height="16" fill="{b}"/>
  </g>"""
    if kind == "flow":
        return f"""
  <g transform="translate(430,50)" opacity="0.9" fill="none" stroke="{a}" stroke-width="6">
    <rect x="40" y="20" width="100" height="44" rx="8"/>
    <path d="M90 64v36"/>
    <path d="M90 100l50 40-50 40-50-40z"/>
    <path d="M90 180v30"/><rect x="40" y="210" width="100" height="44" rx="8"/>
    <path d="M140 140h40v40" stroke="{b}"/>
  </g>"""
    if kind == "window":
        return f"""
  <g transform="translate(400,60)" opacity="0.9">
    <rect x="20" y="30" width="200" height="140" rx="12" fill="none" stroke="{a}" stroke-width="6"/>
    <rect x="20" y="30" width="200" height="28" fill="{a}" opacity="0.35"/>
    <circle cx="40" cy="44" r="5" fill="{b}"/><circle cx="58" cy="44" r="5" fill="{a}"/>
    <rect x="40" y="80" width="70" height="60" rx="6" fill="{a}" opacity="0.25"/>
    <rect x="120" y="80" width="80" height="24" rx="4" fill="{b}" opacity="0.35"/>
  </g>"""
    if kind == "apps":
        return f"""
  <g transform="translate(430,70)" opacity="0.9">
    <rect x="20" y="20" width="60" height="60" rx="12" fill="{a}"/>
    <rect x="100" y="20" width="60" height="60" rx="12" fill="{b}" opacity="0.7"/>
    <rect x="20" y="100" width="60" height="60" rx="12" fill="{b}" opacity="0.55"/>
    <rect x="100" y="100" width="60" height="60" rx="12" fill="{a}" opacity="0.8"/>
  </g>"""
    if kind == "agile":
        return f"""
  <g transform="translate(430,70)" opacity="0.9" fill="none" stroke="{a}" stroke-width="8">
    <path d="M40 120a60 60 0 11100-40" stroke-linecap="round"/>
    <path d="M130 60l20-28 22 26" stroke="{b}"/>
    <path d="M160 100a60 60 0 11-100 40" stroke="{b}" stroke-linecap="round"/>
  </g>"""
    if kind == "django":
        return f"""
  <g transform="translate(450,55)" opacity="0.92">
    <text x="10" y="150" font-family="Georgia,serif" font-size="120" font-weight="700" fill="{b}">dj</text>
  </g>"""
    if kind == "gear":
        return f"""
  <g transform="translate(430,60)" opacity="0.9" fill="{a}">
    <path d="M90 30l12 18 20-2 8 18-14 14 6 20-20 4-12 18-20-4-14-14-20 2-8-18 14-14-6-20 20-4z" opacity="0.35"/>
    <circle cx="90" cy="110" r="34" fill="none" stroke="{b}" stroke-width="10"/>
    <circle cx="90" cy="110" r="14" fill="{b}"/>
  </g>"""
    # default code brackets
    return f"""
  <g transform="translate(430,70)" opacity="0.9" fill="none" stroke="{a}" stroke-width="10" stroke-linecap="round">
    <path d="M70 40 L30 110 L70 180"/>
    <path d="M120 40 L160 110 L120 180" stroke="{b}"/>
  </g>"""


def svg_for(course_id: str, accent: str, secondary: str, kind: str) -> str:
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" fill="none" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#050b14"/>
      <stop offset="55%" stop-color="#0a1628"/>
      <stop offset="100%" stop-color="#071a2e"/>
    </linearGradient>
    <radialGradient id="glow" cx="78%" cy="45%" r="45%">
      <stop offset="0%" stop-color="{accent}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="{accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="640" height="360" fill="url(#bg)"/>
  <rect width="640" height="360" fill="url(#glow)"/>
  {circuit(accent)}
  {motif(kind, accent, secondary)}
</svg>
"""


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for cid, (accent, secondary, kind) in THEMES.items():
        path = OUT / f"{cid}-bg.svg"
        path.write_text(svg_for(cid, accent, secondary, kind), encoding="utf-8", newline="\n")
        print("wrote", path.name)
    print("done", len(THEMES))


if __name__ == "__main__":
    main()
