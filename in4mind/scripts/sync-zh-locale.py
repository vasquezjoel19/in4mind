# Sync missing locale keys from en.js into zh.js (fill gaps with Chinese where known, else EN).
import re
import json
from pathlib import Path

ROOT = Path(r"c:\Users\JoelVasquez\Downloads\in4mind_refactored (1)\in4mind\src\js\locales")

# Manual Chinese for recently-added / high-visibility keys (dot paths).
ZH_OVERRIDE = {
  "paths.nextLesson": "继续课时",
  "paths.nextQuiz": "去做测验",
  "paths.nextProject": "引导项目",
  "paths.nextCert": "认证考试",
  "paths.done": "路线已完成",
  "analytics.level": "等级",
  "analytics.xp": "XP",
  "search.noResults": "无结果",
  "notif.srsTitle": "间隔复习",
  "notif.srsBody": "复习「{topic}」（逾期 {days} 天）",
  "notif.studyTitle": "该学习了",
  "notif.studyBody": "今天花 15 分钟：一节课或一次短测验。",
  "srs.dueTitle": "间隔复习",
  "srs.overdue": "{n}天",
  "offline.download": "下载离线包",
  "offline.downloading": "下载中…",
  "offline.downloaded": "已可离线学习",
  "offline.ready": "课程已准备好离线学习。",
  "offline.fail": "未能完整下载课程。请在稳定网络下重试。",
  "auth.errEmailTaken": "该邮箱已被注册。",
  "auth.confirmEmail": "账号已创建。请查收 {email} 并确认链接后再登录。",
  "auth.errEmailNotConfirmed": "请先确认邮箱再登录。",
  "tutorial.askTutor": "AI 导师",
  "tutorial.lessonLocked": "请先完成上一课以解锁此课。",
  "tutorial.progressLocal": "进度已保存在本设备。登录后可同步。",
  "tutorial.loginToSave": "登录后即可参加认证考试。",
  "share.notes": "分享我的笔记",
  "share.projects": "分享我的项目",
  "share.weeklyCta": "分享本周",
  "share.weeklyEyebrow": "本周总结",
  "share.weeklySub": "{date} 所在周",
  "share.weeklyText": "本周在 IN4MIND：连续 {streak} 天 · {lessons} 课时 · {quizzes} 测验 · 等级 {level}。#IN4MIND",
  "share.dueTopics": "有 {n} 个主题待复习",
  "share.print": "打印 / PDF",
  "share.copyText": "复制文本",
  "guided.reviewing": "正在批改你的回答…",
  "guided.reviewScore": "得分：{n}/100",
  "guided.reviewAi": "AI 反馈",
  "guided.reviewLocal": "本地反馈",
  "connectivity.offline": "离线。你的更改会保存在此设备。",
  "connectivity.online": "已重新连接",
  "connectivity.syncing": "正在同步…",
  "connectivity.synced": "已同步",
  "cookies.title": "Cookie",
  "cookies.accept": "接受",
  "cookies.reject": "拒绝",
  "notes.pageTitle": "我的笔记",
  "notes.pageSub": "整理课程与项目笔记。",
  "notes.searchPlaceholder": "搜索笔记…",
  "notes.searchAria": "搜索笔记",
  "notes.newNote": "新建笔记",
  "notes.newFolder": "新建文件夹",
  "notes.recentFolders": "最近文件夹",
  "notes.myNotes": "我的笔记",
  "notes.today": "今天",
  "notes.thisWeek": "本周",
  "notes.thisMonth": "本月",
  "notes.allNotes": "全部",
  "notes.favorites": "收藏",
  "notes.recent": "最近",
  "notes.fromLessons": "来自课时",
  "notes.empty": "还没有笔记。创建第一篇吧！",
  "notes.saved": "笔记已保存",
  "notes.deleted": "笔记已删除",
  "notes.deleteConfirm": "删除此笔记？",
  "notes.untitled": "无标题",
  "notes.editNote": "编辑笔记",
  "notes.titlePlaceholder": "笔记标题",
  "notes.contentPlaceholder": "在此书写…",
  "notes.tagsPlaceholder": "标签，用逗号分隔",
  "notes.openLesson": "查看课时",
  "notes.folderNamePrompt": "文件夹名称：",
  "notes.notesCount": "{n} 条笔记",
  "projects.pageTitle": "我的项目",
  "projects.pageSub": "用任务、笔记和关联课程组织学习。",
  "projects.searchPlaceholder": "搜索项目…",
  "projects.searchAria": "搜索项目",
  "projects.newProject": "新建项目",
  "projects.empty": "用项目来组织你的学习。",
  "projects.noDesc": "暂无描述",
  "projects.tasks": "任务",
  "projects.back": "返回",
  "projects.linkedCourse": "关联课程",
  "projects.noCourse": "— 无 —",
  "projects.complete": "已完成",
  "projects.tasksTitle": "任务",
  "projects.addTask": "添加任务…",
  "projects.notesTitle": "项目笔记",
  "projects.noNotes": "暂无关联笔记。",
  "projects.openCourse": "打开课程",
  "projects.saved": "项目已保存",
  "projects.deleted": "项目已删除",
  "projects.deleteConfirm": "删除此项目？",
  "projects.namePrompt": "项目名称：",
  "projects.descPlaceholder": "描述你的项目…",
}


def js_file_to_dict(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    text = re.sub(r"^'use strict';\s*", "", text)
    text = re.sub(r"^const\s+\w+\s*=\s*", "", text, count=1)
    text = re.sub(r";?\s*if\s*\(typeof[\s\S]*$", "", text)
    text = text.strip().rstrip(";").strip()
    # Quote bare keys
    text = re.sub(r'([{\[,]\s*)([A-Za-z_][\w-]*)\s*:', r'\1"\2":', text)
    # Single-quoted strings -> JSON double quotes (naive but OK for these locale files)
    def repl_str(m):
        s = m.group(0)
        inner = s[1:-1].replace("\\'", "'").replace('"', '\\"')
        return '"' + inner + '"'
    text = re.sub(r"'(?:\\'|[^'])*'", repl_str, text)
    # Remove trailing commas
    text = re.sub(r",\s*([}\]])", r"\1", text)
    return json.loads(text)


def flatten(d, prefix=""):
    out = {}
    if not isinstance(d, dict):
        return out
    for k, v in d.items():
        key = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            out.update(flatten(v, key))
        else:
            out[key] = v
    return out


def unflatten(flat: dict) -> dict:
    root = {}
    for path, val in flat.items():
        parts = path.split(".")
        cur = root
        for p in parts[:-1]:
            cur = cur.setdefault(p, {})
        cur[parts[-1]] = val
    return root


def deep_fill(base: dict, fill: dict) -> dict:
    """Return copy of base with missing keys filled from fill."""
    if not isinstance(base, dict):
        return base
    out = dict(base)
    for k, v in fill.items():
        if k not in out:
            out[k] = v
        elif isinstance(out[k], dict) and isinstance(v, dict):
            out[k] = deep_fill(out[k], v)
    return out


def to_js(obj, indent=2, level=1) -> str:
    sp = " " * (indent * level)
    sp0 = " " * (indent * (level - 1))
    if isinstance(obj, dict):
        if not obj:
            return "{}"
        lines = ["{"]
        items = list(obj.items())
        for i, (k, v) in enumerate(items):
            key = f"'{k}'" if not re.match(r"^[A-Za-z_]\w*$", k) else k
            comma = "," if i < len(items) - 1 else ""
            if isinstance(v, dict):
                lines.append(f"{sp}{key}: {to_js(v, indent, level + 1)}{comma}")
            else:
                # escape
                s = str(v).replace("\\", "\\\\").replace("'", "\\'")
                lines.append(f"{sp}{key}: '{s}'{comma}")
        lines.append(f"{sp0}}}")
        return "\n".join(lines)
    s = str(obj).replace("\\", "\\\\").replace("'", "\\'")
    return f"'{s}'"


def main():
    es = js_file_to_dict(ROOT / "es.js")
    en = js_file_to_dict(ROOT / "en.js")
    zh = js_file_to_dict(ROOT / "zh.js")

    # Prefer EN structure as source of missing keys (then ES for anything EN lacks)
    merged = deep_fill(zh, en)
    merged = deep_fill(merged, es)

    # Apply Chinese overrides for known paths
    flat = flatten(merged)
    for path, zh_val in ZH_OVERRIDE.items():
        flat[path] = zh_val
    # For still-English fills that exist in EN but not original ZH, keep EN text
    # (overrides already applied). Reconstruct preserving key order from ES as much as possible.
    filled = unflatten(flat)

    # Order top-level keys like ES
    ordered = {}
    for k in es.keys():
        if k in filled:
            ordered[k] = filled[k]
    for k, v in filled.items():
        if k not in ordered:
            ordered[k] = v

    missing_before = set(flatten(es)) - set(flatten(zh))
    still_missing = set(flatten(es)) - set(flatten(ordered))

    out = "use strict';\n\nconst LOCALE_ZH = " + to_js(ordered, 2, 1) + ";\n\n"
    out += "if (typeof module !== 'undefined') module.exports = LOCALE_ZH;\n"
    (ROOT / "zh.js").write_text(out, encoding="utf-8")

    print(f"Missing before: {len(missing_before)}")
    print(f"Still missing vs ES: {len(still_missing)}")
    if missing_before:
        print("Sample filled:", ", ".join(sorted(list(missing_before))[:25]))


if __name__ == "__main__":
    main()
