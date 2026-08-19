#!/usr/bin/env python3
"""Generate production bundles and rewrite HTML to use them with defer."""
from __future__ import annotations

import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "js" / "dist"
VERSION = "20260819ruta2"

BOOT_FILES = [
    "src/js/controllers/ThemeController.js",
    "src/js/a11y-boot.js",
    "src/js/locales/es.js",
    "src/js/locales/en.js",
    "src/js/locales/zh.js",
    "src/js/locales/curriculum-en.js",
    "src/js/locales/curriculum-zh.js",
    "src/js/services/I18n.js",
]

SHELL_FILES = [
    "src/js/components/In4mindBulb.js",
    "src/js/i18n-boot.js",
    "src/js/data/courseFactory.js",
    "src/js/data/extendedCourses.js",
    "src/js/locales/extended-course-locales.js",
    "src/js/data/extendedCourseLocales.js",
    "src/js/services/SessionStore.js",
    "src/js/services/ErrorReporter.js",
    "src/js/services/SyncOutboxService.js",
    "src/js/services/ConnectivityService.js",
    "src/js/services/CloudBlobSync.js",
    "src/js/services/AuthSessionSync.js",
    "src/js/services/LazyScriptLoader.js",
    "src/js/services/ShareService.js",
    "src/js/services/DataService.js",
    "src/js/services/UserProfileService.js",
    "src/js/services/QuizProgressService.js",
    "src/js/services/GamificationService.js",
    "src/js/services/GlobalSearchService.js",
    "src/js/services/NotificationService.js",
    "src/js/services/PushNotificationService.js",
    "src/js/services/AccessibilityService.js",
    "src/js/services/AuthService.js",
    "src/js/services/DataExportService.js",
    "src/js/controllers/AppFeatures.js",
    "src/js/services/GlobalChatService.js",
    "src/js/controllers/GlobalChatController.js",
    "src/js/services/AppShell.js",
    "src/js/controllers/SidebarController.js",
    "src/js/controllers/OtherMenuController.js",
    "src/js/controllers/SettingsController.js",
]

LANDING_FILES = [
    "src/js/components/In4mindBulb.js",
    "src/js/data/courseFactory.js",
    "src/js/data/extendedCourses.js",
    "src/js/locales/extended-course-locales.js",
    "src/js/data/extendedCourseLocales.js",
    "src/js/services/QuizProgressService.js",
    "src/js/services/QuizRandomizer.js",
    "src/js/services/SessionStore.js",
    "src/js/services/ShareService.js",
    "src/js/services/DataService.js",
    "src/js/controllers/OtherMenuController.js",
    "src/js/i18n-boot.js",
]

SHELL_REPLACE = {p.replace("\\", "/") for p in SHELL_FILES}
LANDING_REPLACE = {p.replace("\\", "/") for p in LANDING_FILES}

APP_PAGES = [
    "dashboard.html",
    "tutorial.html",
    "quizzes.html",
    "ai.html",
    "profile.html",
    "notes.html",
    "projects.html",
    "guided-projects.html",
    "help.html",
    "login.html",
]

LIGHT_PAGES = [
    "verify.html",
    "cookies.html",
    "privacidad.html",
    "terminos.html",
    "portfolio-public.html",
]


def concat(files: list[str], extra: str = "") -> str:
    parts = []
    for rel in files:
        full = ROOT / rel
        if not full.exists():
            raise FileNotFoundError(rel)
        parts.append(f"\n;/* --- {rel} --- */\n{full.read_text(encoding='utf-8')}\n")
    banner = f"/*! IN4MIND bundle {VERSION} — {datetime.now(timezone.utc).isoformat()} */\n"
    return banner + "".join(parts) + extra


def write_bundles() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    boot_extra = """
;try {
  if (typeof ThemeController !== 'undefined' && ThemeController.initEarly) ThemeController.initEarly();
  if (typeof I18n !== 'undefined' && I18n.initEarly) I18n.initEarly();
} catch (e) { /* boot */ }
"""
    mapping = {
        "boot.bundle.js": concat(BOOT_FILES, boot_extra),
        "app-shell.bundle.js": concat(SHELL_FILES),
        "landing.bundle.js": concat(LANDING_FILES),
    }
    for name, body in mapping.items():
        path = OUT / name
        path.write_text(body, encoding="utf-8")
        print(f"Wrote {path.relative_to(ROOT)} ({path.stat().st_size // 1024} KB)")


SCRIPT_RE = re.compile(
    r'<script(\s[^>]*)?\ssrc="([^"]+)"([^>]*)></script>',
    re.IGNORECASE,
)
INLINE_EARLY_RE = re.compile(
    r"\s*<script>\s*ThemeController\.initEarly\(\);\s*I18n\.initEarly\(\);\s*</script>",
    re.IGNORECASE,
)


def src_path(url: str) -> str:
    return url.split("?", 1)[0].lstrip("./")


def add_defer(attrs_before: str, attrs_after: str) -> str:
    combined = f"{attrs_before or ''}{attrs_after or ''}"
    if re.search(r"\bdefer\b", combined) or re.search(r"\basync\b", combined):
        return combined
    return " defer" + combined


def rewrite_boot_block(html: str) -> str:
    """Replace head boot script chain with boot.bundle.js (sync for FOUC)."""
    pattern = re.compile(
        r'(<script[^>]*src="[^"]*ThemeController\.js[^"]*"[^>]*></script>\s*)'
        r'(?:<script[^>]*src="[^"]*a11y-boot\.js[^"]*"[^>]*></script>\s*)?'
        r'(?:<script[^>]*src="[^"]*locales/es\.js[^"]*"[^>]*></script>\s*)?'
        r'(?:<script[^>]*src="[^"]*locales/en\.js[^"]*"[^>]*></script>\s*)?'
        r'(?:<script[^>]*src="[^"]*locales/zh\.js[^"]*"[^>]*></script>\s*)?'
        r'(?:<script[^>]*src="[^"]*curriculum-en\.js[^"]*"[^>]*></script>\s*)?'
        r'(?:<script[^>]*src="[^"]*curriculum-zh\.js[^"]*"[^>]*></script>\s*)?'
        r'(?:<script[^>]*src="[^"]*legal-bodies-en\.js[^"]*"[^>]*></script>\s*)?'
        r'(?:<script[^>]*src="[^"]*legal-bodies-zh\.js[^"]*"[^>]*></script>\s*)?'
        r'(?:<script[^>]*src="[^"]*I18n\.js[^"]*"[^>]*></script>\s*)'
        r'(?:<script>\s*ThemeController\.initEarly\(\);\s*I18n\.initEarly\(\);\s*</script>\s*)?',
        re.IGNORECASE,
    )

    def repl(m: re.Match) -> str:
        block = m.group(0)
        keep = []
        for legal in ("legal-bodies-en.js", "legal-bodies-zh.js"):
            lm = re.search(
                rf'<script[^>]*src="([^"]*{re.escape(legal)}[^"]*)"[^>]*></script>',
                block,
                re.I,
            )
            if lm:
                keep.append(f'<script defer src="{lm.group(1)}"></script>')
        parts = [f'<script src="src/js/dist/boot.bundle.js?v={VERSION}"></script>']
        parts.extend(keep)
        return "\n  ".join(parts) + "\n"

    new_html, n = pattern.subn(repl, html, count=1)
    if n:
        return new_html
    if "boot.bundle.js" in html:
        html = re.sub(
            r'(src="[^"]*boot\.bundle\.js)\?v=[^"]*"',
            rf'\1?v={VERSION}"',
            html,
            count=1,
        )
        return INLINE_EARLY_RE.sub("\n", html)
    return html


def rewrite_scripts(html: str, replace_set: set[str], bundle_name: str) -> str:
    matches = list(SCRIPT_RE.finditer(html))
    if not matches:
        return html

    # Keep existing bundle query versions in sync with VERSION.
    html = re.sub(
        rf'(src="[^"]*{re.escape(bundle_name)})\?v=[^"]*"',
        rf'\1?v={VERSION}"',
        html,
    )
    matches = list(SCRIPT_RE.finditer(html))
    if not matches:
        return html

    idxs = [i for i, m in enumerate(matches) if src_path(m.group(2)) in replace_set]
    out = []
    last = 0
    inserted = False
    for i, m in enumerate(matches):
        out.append(html[last:m.start()])
        path = src_path(m.group(2))
        url = m.group(2)
        before, after = m.group(1) or "", m.group(3) or ""

        if i in idxs:
            if not inserted:
                out.append(
                    f'<script defer src="src/js/dist/{bundle_name}?v={VERSION}"></script>'
                )
                inserted = True
            last = m.end()
            continue

        if "boot.bundle.js" in path:
            out.append(m.group(0))
        elif path.endswith(".bundle.js"):
            attrs = before + after
            if "defer" not in attrs and "async" not in attrs:
                out.append(f'<script defer src="{url}"></script>')
            else:
                out.append(m.group(0))
        else:
            attrs = add_defer(before, after)
            out.append(f'<script{attrs} src="{url}"></script>')
        last = m.end()

    out.append(html[last:])
    return "".join(out)


def collapse_blank_script_gaps(html: str) -> str:
    html = re.sub(r"(</script>)\n(?:[ \t]*\n){2,}", r"\1\n", html)
    return html


def process_page(name: str, mode: str) -> None:
    path = ROOT / name
    if not path.exists():
        print(f"skip missing {name}")
        return
    html = path.read_text(encoding="utf-8")
    html = rewrite_boot_block(html)
    if mode == "shell":
        html = rewrite_scripts(html, SHELL_REPLACE, "app-shell.bundle.js")
    elif mode == "landing":
        html = rewrite_scripts(html, LANDING_REPLACE, "landing.bundle.js")
    else:
        html = rewrite_scripts(html, set(), "")
    html = INLINE_EARLY_RE.sub("\n", html)
    html = collapse_blank_script_gaps(html)
    path.write_text(html, encoding="utf-8", newline="\n")
    print(f"Updated {name} ({mode})")


def main() -> None:
    write_bundles()
    for name in APP_PAGES:
        process_page(name, "shell")
    process_page("index.html", "landing")
    for name in LIGHT_PAGES:
        process_page(name, "light")
    print("Done.")


if __name__ == "__main__":
    main()
