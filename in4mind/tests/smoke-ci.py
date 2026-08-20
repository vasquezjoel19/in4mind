# Python smoke checks (mirrors smoke-ci.js) for environments without Node.
from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import urljoin, urlparse

ROOT = Path(__file__).resolve().parents[1]
failed = 0


def assert_(name: str, cond: bool, detail: str = "") -> None:
    global failed
    if cond:
        print(f"OK  {name}")
    else:
        failed += 1
        suffix = f" - {detail}" if detail else ""
        print(f"FAIL {name}{suffix}", file=sys.stderr)


def read(rel: str) -> str:
    return (ROOT / rel).read_text(encoding="utf-8")


required = [
    "src/js/services/SpacedRepetitionService.js",
    "src/js/services/LearningPathService.js",
    "src/js/services/WeeklyShareService.js",
    "src/js/services/OfflineCourseService.js",
    "src/js/services/ProjectReviewService.js",
    "src/js/services/NotificationService.js",
    "src/js/services/PushNotificationService.js",
    "src/js/services/GroqService.js",
    "src/js/services/AIUserContext.js",
    "src/js/services/EmployabilityService.js",
    "src/js/services/EmployabilityStarters.js",
    "src/js/services/ShareService.js",
    "src/js/data/CareerPathsData.js",
    "dashboard.html",
    "onboarding.html",
    "tutorial.html",
    "quizzes.html",
    "guided-projects.html",
    "ai.html",
    "sw.js",
    "tests/smoke.html",
    "src/js/services/OnboardingService.js",
    "src/js/controllers/OnboardingController.js",
    "src/js/controllers/AuthController.js",
    "src/js/controllers/TutorialController.js",
    "src/js/controllers/QuizzesController.js",
    "src/js/services/UserScopedStorage.js",
    "src/js/services/UiDialog.js",
    "src/js/services/NotesService.js",
    "src/js/services/CloudBlobSync.js",
    "src/js/services/ProjectsService.js",
    "src/js/services/AppShell.js",
    "src/js/controllers/NotesController.js",
]

for rel in required:
    assert_(f"exists:{rel}", (ROOT / rel).exists())

srs = read("src/js/services/SpacedRepetitionService.js")
assert_("SRS exports getDueTopics", "getDueTopics" in srs)

paths = read("src/js/services/LearningPathService.js")
assert_("LearningPathService getAllProgress", "getAllProgress" in paths)

dash = read("dashboard.html")
assert_("dashboard loads SpacedRepetitionService", "SpacedRepetitionService.js" in dash)
assert_("dashboard loads LearningPathService", "LearningPathService.js" in dash)
assert_("dashboard loads WeeklyShareService", "WeeklyShareService.js" in dash)
assert_("dashboard uses boot.bundle", "boot.bundle.js" in dash)
assert_("dashboard uses app-shell.bundle", "app-shell.bundle.js" in dash)
assert_(
    "dashboard defers app-shell",
    bool(re.search(r"defer[^>]+app-shell\.bundle\.js|app-shell\.bundle\.js[^>]+defer", dash)),
)
assert_("dashboard loads EmployabilityStarters", "EmployabilityStarters.js" in dash)

idx = read("index.html")
assert_("index uses landing.bundle", "landing.bundle.js" in idx)

tut = read("tutorial.html")
assert_("tutorial loads OfflineCourseService", "OfflineCourseService.js" in tut)
assert_("tutorial loads EmployabilityController", "EmployabilityController.js" in tut)

gp = read("guided-projects.html")
assert_("guided loads ProjectReviewService", "ProjectReviewService.js" in gp)
assert_("guided loads GroqService", "GroqService.js" in gp)

groq = read("src/js/services/GroqService.js")
assert_("GroqService module present", bool(re.search(r"function\s+\w+|async\s+function", groq)))
ai_ctx = read("src/js/services/AIUserContext.js")
assert_("AIUserContext module present", "AIUserContext" in ai_ctx)

push = read("src/js/services/PushNotificationService.js")
assert_("Push syncUsefulReminders", "syncUsefulReminders" in push)

assert_("bundle-shell script", (ROOT / "scripts/bundle-shell.js").exists())

for name in ("boot.bundle.js", "app-shell.bundle.js", "landing.bundle.js"):
    assert_(f"dist:{name}", (ROOT / "src/js/dist" / name).exists())

login_html = read("login.html")
assert_("login loads OnboardingService", "OnboardingService.js" in login_html)

auth_ctrl = read("src/js/controllers/AuthController.js")
assert_("auth redirects mention onboarding", "onboarding.html" in auth_ctrl)
assert_(
    "auth stashes pending redirect",
    bool(re.search(r"stashPendingRedirect|IN4MIND_NEXT_REDIRECT|onboardingUrlWithPending", auth_ctrl)),
)
assert_("auth preserves tutorial deep-link query", "tutorial.html?course=" in auth_ctrl)
assert_("auth preserves quiz deep-link query", "quizzes.html?quiz=" in auth_ctrl)

ob_svc = read("src/js/services/OnboardingService.js")
assert_("onboarding completes with goal", "completeWithGoal" in ob_svc)
assert_("onboarding sets completed flag", "onboarding_completed" in ob_svc)

ob_ctrl = read("src/js/controllers/OnboardingController.js")
assert_(
    "onboarding finishes via pending redirect helper",
    bool(re.search(r"_finishRedirect|consumePendingRedirect", ob_ctrl)),
)

share = read("src/js/services/ShareService.js")
assert_("AuthGuard sanitizeNext", "function sanitizeNext" in share)
assert_("AuthGuard stashPendingRedirect", "function stashPendingRedirect" in share)
assert_("AuthGuard PENDING_KEY", "IN4MIND_NEXT_REDIRECT" in share)
assert_("AuthGuard rejects javascript URLs", bool(re.search(r"javascript", share, re.I)))

quiz_ctrl = read("src/js/controllers/QuizzesController.js")
assert_("quizzes reads ?quiz=", "urlParams.get('quiz')" in quiz_ctrl)
assert_("quizzes clears pending redirect after open", "clearPendingRedirect" in quiz_ctrl)
assert_("quizzes replaceState after deep-link", "history.replaceState" in quiz_ctrl)

tut_ctrl = read("src/js/controllers/TutorialController.js")
assert_("tutorial reads ?course=", "params.get('course')" in tut_ctrl)
assert_("tutorial reads ?lesson=", "params.get('lesson')" in tut_ctrl)
assert_("tutorial clears pending redirect after open", "clearPendingRedirect" in tut_ctrl)

emp = read("src/js/services/EmployabilityService.js")
assert_("employable reqChecks persistence", "reqChecks" in emp)
assert_("employable getProjectPreview", "getProjectPreview" in emp)
assert_("employable setReqCheck", "setReqCheck" in emp)
assert_("employable applyUrlToReqChecks", "applyUrlToReqChecks" in emp)

emp_ctrl = read("src/js/controllers/EmployabilityController.js")
assert_("employable preview button", "employable-preview-btn" in emp_ctrl)
assert_("employable interactive req checklist", "data-req-id" in emp_ctrl)

career = read("src/js/data/CareerPathsData.js")
assert_("career path python-junior", "python-junior" in career)
assert_("career path cyber-inicial", "cyber-inicial" in career)

starters = read("src/js/services/EmployabilityStarters.js")
assert_("starters buildZip", "function buildZip" in starters)
assert_("starters has web kit", "web-junior" in starters)

# Runtime AuthGuard sanitize (Python port of sanitizeNext / stash / consume)
ORIGIN = "https://in4mind.app"
PENDING_KEY = "IN4MIND_NEXT_REDIRECT"
store: dict[str, str] = {}


def _is_safe(target: str) -> bool:
    try:
        url = urlparse(urljoin(ORIGIN + "/", target))
        if f"{url.scheme}://{url.netloc}" != ORIGIN:
            return False
        if url.username or url.password:
            return False
        href = str(target).strip()
        if re.match(r"^(javascript|data|vbscript):", href, re.I):
            return False
        if ".." in (url.path or ""):
            return False
        return True
    except Exception:
        return False


def sanitize_next(raw):
    if raw is None:
        return None
    trimmed = str(raw).strip()
    if not trimmed or re.match(r"^(javascript|data|vbscript):", trimmed, re.I):
        return None
    try:
        url = urlparse(urljoin(ORIGIN + "/", trimmed))
        if not _is_safe(url.geturl()):
            return None
        path = url.path or "/"
        parts = [p for p in path.split("/") if p]
        leaf = parts[-1] if parts else ""
        if leaf and not re.search(r"\.html$", leaf, re.I):
            return None
        if not leaf:
            return "dashboard.html"
        rel_path = path.lstrip("/")
        return f"{rel_path}{('?' + url.query) if url.query else ''}{('#' + url.fragment) if url.fragment else ''}"
    except Exception:
        return None


def stash_pending(target: str):
    rel = sanitize_next(target)
    if not rel:
        return None
    store[PENDING_KEY] = rel
    return rel


def consume_pending():
    raw = store.get(PENDING_KEY)
    store.pop(PENDING_KEY, None)
    return sanitize_next(raw)


assert_(
    "sanitize allows tutorial deep-link",
    sanitize_next("tutorial.html?course=python&lesson=2") == "tutorial.html?course=python&lesson=2",
)
assert_(
    "sanitize allows quiz deep-link",
    sanitize_next("quizzes.html?quiz=python") == "quizzes.html?quiz=python",
)
assert_("sanitize blocks external host", sanitize_next("https://evil.example/phish") is None)
assert_("sanitize blocks javascript", sanitize_next("javascript:alert(1)") is None)
stashed = stash_pending("https://in4mind.app/tutorial.html?course=html&lesson=1")
assert_("stash stores relative path", stashed == "tutorial.html?course=html&lesson=1")
assert_("stash writes IN4MIND_NEXT_REDIRECT", store.get(PENDING_KEY) == "tutorial.html?course=html&lesson=1")
consumed = consume_pending()
assert_("consume returns stashed path", consumed == "tutorial.html?course=html&lesson=1")
assert_("consume clears storage", PENDING_KEY not in store)

# Journey invariants: no obvious redirect loop markers in auth/onboarding
assert_(
    "auth avoids self-onboarding loop pattern",
    "onboarding.html" in auth_ctrl and "consumePendingRedirect" in auth_ctrl,
)
assert_("global chat quizChallengeHref", "quizChallengeHref" in read("src/js/services/GlobalChatService.js"))
assert_("global chat relative quiz url", "quizzes.html?quiz=" in read("src/js/controllers/GlobalChatController.js"))
assert_("chat challenge stashes in4mind_open_quiz", "in4mind_open_quiz" in read("src/js/controllers/GlobalChatController.js"))
assert_("chat challenge stashes pending redirect", "stashPendingRedirect" in read("src/js/controllers/GlobalChatController.js"))
assert_("UiDialog custom confirm", "function confirm" in read("src/js/services/UiDialog.js"))
assert_("UserScopedStorage namespaced key", "${base}:${accountId()}" in read("src/js/services/UserScopedStorage.js"))
assert_("CloudBlobSync mergeTombstones", "function mergeTombstones" in read("src/js/services/CloudBlobSync.js"))
assert_("NotesService moveToFolder", "function moveToFolder" in read("src/js/services/NotesService.js"))
assert_("NotesService restoreNote", "function restoreNote" in read("src/js/services/NotesService.js"))
assert_("Notes cascade tombstones", "_markTombstones('notes'" in read("src/js/services/NotesService.js"))
assert_("ProjectsService archive", "function archive" in read("src/js/services/ProjectsService.js"))
assert_("ProjectsService emptyTasks", "function emptyTasks" in read("src/js/services/ProjectsService.js"))
assert_("AppShell showUndoToast", "function showUndoToast" in read("src/js/services/AppShell.js"))
assert_("folder menu Escape handler", "e.key === 'Escape'" in read("src/js/controllers/NotesController.js"))
assert_("notes drag-and-drop", "text/in4mind-note" in read("src/js/controllers/NotesController.js"))
assert_("projects archived toggle", "projects-archived-toggle" in read("projects.html"))
assert_("apply-bundles unifies css hash", "rewrite_asset_versions" in read("scripts/apply-bundles.py"))
assert_("asset version ux1", "20260820ux1" in read("src/js/config/asset-version.js"))
assert_("shell bundles UserScopedStorage", "UserScopedStorage.js" in read("scripts/bundle-shell.js"))
assert_("shell bundles UiDialog", "UiDialog.js" in read("scripts/bundle-shell.js"))

if failed:
    print(f"\n{failed} smoke check(s) failed", file=sys.stderr)
    sys.exit(1)

print("\nAll smoke checks passed")
