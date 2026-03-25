# AI Mock Interview (Next.js + Vercel + Supabase)

一个可直接部署上线的 AI 模拟面试网页应用（无需登录），支持 Access Code 次数控制（每个 code 默认最多 3 次）。

## 功能概览

- Next.js App Router 前后端一体
- 所有模型调用都在服务端 API 路由（前端不暴露 API key）
- Access Code 校验与次数扣减在后端（Supabase）
- 无登录系统，适合小规模种子用户测试
- 支持：
  - 选择 school / program
  - 简历信息输入
  - 多轮 interview chat
  - 反馈生成与复制

## 技术栈

- **Frontend**: Next.js 14 + React 18
- **Backend**: Next.js Route Handlers (`app/api/*`)
- **Database**: Supabase
- **Deploy**: Vercel

---

## 目录说明

- `app/page.tsx`: 首页，包含 Access Code 解锁 + 面试配置入口
- `app/interview/page.tsx`: 面试对话页
- `app/result/page.tsx`: 面试反馈页
- `app/api/validate-code/route.ts`: 校验 code（不扣次数）
- `app/api/start-session/route.ts`: 开始面试（扣次数 + 创建 session）
- `app/api/chat/route.ts`: 多轮对话
- `app/api/feedback/route.ts`: 反馈生成
- `lib/accessCode.ts`: Supabase access code 逻辑
- `lib/supabaseAdmin.ts`: Supabase 服务端客户端
- `lib/gemini.ts`: 模型调用封装
- `types/index.ts`: 类型定义

---

## 环境变量

复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

填写以下变量：

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

> 注意：`SUPABASE_SERVICE_ROLE_KEY` 仅服务端使用，不能暴露到前端。

---

## Supabase 配置

### 1) 创建表

在 Supabase SQL Editor 执行：

```sql
create table if not exists public.access_codes (
  code text primary key,
  max_uses integer not null default 3,
  used_count integer not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
```

### 2) 插入测试 code

```sql
insert into public.access_codes (code, max_uses, used_count, status)
values
  ('SEED2026A', 3, 0, 'active'),
  ('SEED2026B', 3, 0, 'active');
```

---

## API 设计

### `POST /api/validate-code`

- 入参：`{ code }`
- 返回：`{ valid, remainingUses, message? }`
- 不扣次数

### `POST /api/start-session`

- 入参：`{ accessCode, schoolId, programId, resumeText?, coverLetterText? }`
- 逻辑：先验证并扣减次数，再创建 session
- 返回：`{ sessionId, remainingUses, openingQuestion, ... }`

### `POST /api/chat`

- 入参：`{ sessionId, messages, schoolId, programId }`
- 多轮追问
- 不扣次数

### `POST /api/feedback`

- 入参：`{ sessionId, messages, schoolId, programId }`
- 返回结构化反馈

---

## 本地运行

```bash
npm install
npm run dev
```

打开 <http://localhost:3000>。

---

## Vercel 部署

1. 推送代码到 GitHub
2. 在 Vercel 导入仓库
3. 配置环境变量（与 `.env.local` 同名）
4. 点击 Deploy

推荐在 Vercel Project Settings 中配置：

- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

部署完成后，访问 Vercel 分配域名即可。

---

## 约束与说明

- 无登录系统
- Access Code 次数限制在后端实现
- 不存储用户隐私文件内容（仅临时用于 prompt 生成）
- 适合小规模测试；如需生产级并发保障，建议用数据库函数或事务进一步强化扣减原子性
