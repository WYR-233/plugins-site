import json, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

p = r"G:\deepseek\workspace\plugins-site\data\plugins.json"
raw = json.load(open(p, encoding="utf-8"))
arr = raw["plugins"]

entry = {
    "id": "dsh-memory-lite",
    "name": "dsh-memory-lite",
    "title": "记忆库增强",
    "tagline": "让 DSH 会查你的「md 卡片 + Git」长期记忆库",
    "version": "0.2.0",
    "updated": "2026-09-11",
    "license": "MIT",
    "repo": "https://github.com/WYR-233/dsh-memory-lite",
    "website": "https://plugins.wyr233.com/#plugins",
    "release": "https://github.com/WYR-233/dsh-memory-lite/releases/latest",
    "tarball": "https://github.com/WYR-233/dsh-memory-lite/releases/latest/download/dsh-memory-lite.tgz",
    "category": "记忆 / 检索",
    "tags": ["记忆库", "检索", "markdown", "Git", "只读", "零依赖"],
    "status": "listed",
    "statusText": "已投 awesome-dsh-plugin 收录",
    "summary": "给一个「纯文件的长期记忆库」加上检索能力：多了 memory_find 工具（中文按相邻双字词匹配、标题/关键词/正文加权）、开场一小段受预算约束的记忆库摘要，以及设置页里的概览 / 健康 / 开关。",
    "features": [
        "memory_find 检索工具：返回卡片路径 + 命中词 + 原文片段，比逐个翻目录省 token",
        "开场摘要注入：库在哪、有哪些主题、先检索再猜（默认 ≤900 字符，可调）",
        "设置页：卡片数 / 体量 / 主题 / 最长卡、最近体检结果、开关与条数上限，中英双语",
        "只读设计：不写卡片、不 commit、不 push；自动化交给你的定时脚本",
        "零运行时依赖、无数据库；唯一状态是一个小 JSON 配置（原子写）",
    ],
    "install": "dsh plugin --profile web add github:WYR-233/dsh-memory-lite",
    "note": "需要把插件配置的 memoryRoot 指到你的记忆库目录（或设环境变量 DSH_MEMORY_ROOT）；另需要一个支持 `--stdin --top <n>` / `--stats` 约定的检索脚本（默认 tools/memory-find.mjs）。",
    "requires": "DSH 0.1.5+；Node 22+；一个 markdown 卡片的记忆库目录",
}

# 幂等：同 id 已存在则覆盖
before = len(arr)
arr = [a for a in arr if a.get("id") != entry["id"]]
arr.append(entry)
raw["plugins"] = arr
json.dump(raw, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(f"plugins.json: {before} -> {len(arr)} 条；已写入 {entry['id']} v{entry['version']}")
