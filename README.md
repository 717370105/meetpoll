# MeetPoll · Vercel + Supabase 部署指南

## 文件结构

```
meetpoll-vercel/
├── api/
│   ├── _supabase.js          # 共享 Supabase 客户端
│   ├── polls.js              # POST /api/polls（创建征集）
│   ├── ai-suggest.js         # POST /api/ai-suggest（AI 分析）
│   └── polls/
│       ├── [id].js           # GET /api/polls/:id（查看结果）
│       └── [id]/
│           └── votes.js      # POST /api/polls/:id/votes（提交投票）
├── public/
│   └── index.html            # 前端 SPA
├── vercel.json               # 路由配置
├── package.json
└── .env.example
```

---

## 部署步骤

### 1. 建表（Supabase SQL Editor）

```sql
CREATE TABLE polls (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  organizer   TEXT NOT NULL DEFAULT '发起人',
  duration    TEXT NOT NULL DEFAULT '待定',
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE slots (
  id          SERIAL PRIMARY KEY,
  poll_id     TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  date        TEXT NOT NULL,
  start_time  TEXT NOT NULL,
  end_time    TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE votes (
  id          SERIAL PRIMARY KEY,
  poll_id     TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  voter_name  TEXT NOT NULL,
  voted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(poll_id, voter_name)
);

CREATE TABLE vote_slots (
  vote_id     INTEGER NOT NULL REFERENCES votes(id) ON DELETE CASCADE,
  slot_id     INTEGER NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
  PRIMARY KEY (vote_id, slot_id)
);
```

### 2. 上传到 GitHub

```bash
git init
git add .
git commit -m "init meetpoll"
# 在 GitHub 新建仓库后：
git remote add origin https://github.com/你的用户名/meetpoll.git
git push -u origin main
```

### 3. 在 Vercel 部署

1. 打开 [vercel.com](https://vercel.com) → **Add New Project**
2. 选择刚才的 GitHub 仓库
3. Framework Preset 选 **Other**
4. 点击 **Environment Variables**，添加：

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | 你的 Supabase Project URL |
| `SUPABASE_ANON_KEY` | 你的 Supabase anon key |
| `ANTHROPIC_API_KEY` | （可选）你的 Anthropic API Key |

5. 点击 **Deploy** → 等待 1 分钟
6. 部署完成后访问 `https://你的项目名.vercel.app` 即可

---

## 去哪找 Supabase 的 URL 和 Key

1. 进入 Supabase 项目
2. 左侧菜单 → **Settings** → **API**
3. 复制：
   - **Project URL**（`https://xxxx.supabase.co`）
   - **Project API Keys → anon/public**

---

## 本地开发

```bash
npm install
# 创建 .env 文件，填入 SUPABASE_URL 和 SUPABASE_ANON_KEY
cp .env.example .env

# 安装 Vercel CLI
npm i -g vercel

# 本地启动（自动读取 .env）
vercel dev
# → http://localhost:3000
```
