# AI 情报站 · 使用手册

> 每天自动聚合 12 类你要的信息，做成一个可以永久访问的网站，同时本地也能每天更新。

---

## 一、这个网站给你什么

| 频道 | 内容 |
|---|---|
| ✦ AIGC 前沿 | 大模型、生成式 AI、产品与产业最新动态 |
| ⚙ AIGC 技巧与做法 | 提示词、工作流、实操教程、落地案例 |
| ⚡ 全球 AI 黑客松 | 世界各地 hackathon、创客马拉松（含剩余天数） |
| ✂ 剪辑技巧 | 剪辑、调色、声音、AI 后期 |
| ♿ 残障大学生成长 | 职业就业、实习成长营、助残政策 |
| ◈ 实习机会 | 最新实习岗位（AI / 剪辑 / 游戏 / 设计） |
| ⛨ 考公·考编·央国企 | 公务员、事业编、央企国企岗位公告 |
| 🎓 戏影考研·985 | 戏剧与影视 985 院校招生、复试、推免、调剂 |
| ◆ 大厂活动·比赛 | 互联网大厂线上线下活动、开发者大会、赛事 |
| ▶ AI 应用开发竞赛 | AI 应用 / Agent / 算法大赛 |
| ◉ AI 3D / 游戏开发 | AI 3D 生成、游戏开发、Game Jam |
| ❖ AI 影游·互动影像 | AI 影视、互动影游、AIGC 影像创作比赛 |

外加：**每日晨报**（可直接转发到微信/QQ）、**全站搜索**、**归档**、**报名截止提醒**、**985/戏影筛选**。

---

## 二、本地怎么跑

```powershell
cd D:\ai游戏\ai-info-hub

node src/collect.mjs     # 只采集
node src/build.mjs       # 只建站
node src/daily.mjs       # 采集 + 建站 + 晨报 + TODAY.md（日常用这个）
node src/serve.mjs       # 本地预览 http://127.0.0.1:5180
node scripts/verify.mjs  # 站点自检
```

**你的机器没有全局 Node 也没关系**：`scripts\sync.ps1` 会自动找 DSH 自带的 Node 运行时。
手动跑时如果 `node` 命令不存在，用完整路径：

```powershell
& "$env:APPDATA\DSH Desktop\runtime-commands\generations\*\private\node-bin\node.cmd" src\daily.mjs
```

---

## 三、每天自动更新（本地定时）

### 方式 A：免管理员（推荐先用这个）

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install-task.ps1
```

会在「启动」文件夹放一个快捷方式，指向 `scripts\daily-loop.vbs`：开机后隐藏运行，之后每 24 小时跑一次 `sync.ps1`。

### 方式 B：精确到分钟（需要管理员 PowerShell）

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install-task.ps1 -UseTaskScheduler -Time "07:30"
```

注册 Windows 计划任务，每天 07:30 精确触发。

### 每天会做什么

1. 采集全部 76 个信息源
2. 重新生成站点 `dist/`
3. 生成当天晨报 `data/briefing/日期.md`
4. 重写 `TODAY.md`（在 DSH 里打开就能看今天有什么）
5. 弹 Windows 通知
6. 如果目录是 git 仓库，自动提交并推送

日志：`data/logs/sync-YYYY-MM-DD.log`

```powershell
Start-ScheduledTask -TaskName "AI情报站每日同步"      # 立即跑一次（方式 B）
Get-ScheduledTaskInfo -TaskName "AI情报站每日同步"     # 看上次结果
Remove-Item "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\AI情报站每日同步.lnk"   # 取消方式 A
```

---

## 四、微信 / QQ 的重要信息怎么进来

微信和 QQ **没有公开接口**，官方路径是导出/复制。本工具做了三个入口：

**① 粘贴法（最简单）**
1. 微信里复制消息
2. 存成 `inbox/2026-10-21.txt`（格式见 `inbox/示例-格式说明.txt`）
3. `npm run daily` 或等定时任务

**② 剪贴板一键导入**
```powershell
node scripts/wx-qq-import.mjs --clipboard
```

**③ JSON 批量导入**（如果你用别的工具导出了 json）

导入时会自动按 12 个频道分类，**无关内容（闲聊）会被自动丢弃**，不会污染站点。

> 为什么不能直连微信数据库？
> 微信 4.x 的消息库 `message_*.db` 是 **SQLCipher 加密** 的（实测文件头是随机字节，不是 SQLite 的 `SQLite format 3`）。
> 要解密必须从微信进程内存里提取密钥，这类工具（如 PyWxDump）会修改客户端行为、有账号风险，因此本方案不采用。
> 公众号文章本身被抓不到，但**同主题内容已由量子位、机器之心、InfoQ、新片场等公开源覆盖**；
> 你想额外保留的公众号，用上面 ①②③ 任意一种方式加进来即可。

---

## 五、做成永久网站（GitHub Pages 免费）

### 第 1 步：创建仓库

1. 打开 https://github.com/new
2. Repository name 填 `ai-info-hub`（名字随意）
3. **Public**（必须公开，免费 Pages 才可用）
4. 不要勾选 README，点 **Create repository**

### 第 2 步：上传代码

在本机 PowerShell 里执行（把 `你的用户名` 换成你的 GitHub 用户名）：

```powershell
cd D:\ai游戏\ai-info-hub

git init
git add .
git commit -m "初始提交：AI 情报站"
git branch -M main
git remote add origin https://github.com/你的用户名/ai-info-hub.git
git push -u origin main
```

> 第一次 push 会弹出浏览器登录 GitHub，登录并授权即可。

### 第 3 步：开启 Pages

1. 进入仓库 → **Settings** → 左侧 **Pages**
2. **Source** 选 `GitHub Actions`（不是 Deploy from a branch）
3. 回到 **Actions** 标签页，会看到「每日情报同步」正在跑（也可以点 **Run workflow** 手动触发一次）
4. 跑完后访问：

```
https://你的用户名.github.io/ai-info-hub/
```

**这个链接就是永久的**，每天北京时间 06:30 自动更新，打开永远是最新的。

### 第 4 步（可选）：改推送时间

编辑 `.github/workflows/daily.yml` 里的：

```yaml
- cron: '30 22 * * *'    # UTC 22:30 = 北京时间 06:30
```

换算：**北京时间 = UTC + 8**，所以想早上 7 点推送就写 `0 23 * * *`。

---

## 六、网站结构

```
ai-info-hub/
├─ src/                 采集、解析、建站、每日流程
│  ├─ collect.mjs       抓取 + 分类 + 去重
│  ├─ build.mjs         生成静态站
│  ├─ daily.mjs         每日一键流程
│  └─ serve.mjs         本地预览
├─ config/
│  ├─ sources.mjs       信息源清单（想加源改这里）
│  ├─ topics.mjs        12 个频道定义
│  ├─ rules.mjs         关键词分类规则
│  └─ schools.mjs       985 / 戏影院校识别
├─ assets/              样式与前端脚本
├─ data/
│  ├─ items.json        全量情报库（累积）
│  ├─ status.json       每个源的成功/失败状态
│  ├─ daily/            每日快照
│  └─ briefing/         每日晨报 Markdown
├─ inbox/               微信/QQ 导入入口
├─ dist/                生成的网站（部署这个）
└─ .github/workflows/daily.yml   每日自动部署
```

---

## 七、想加信息源怎么办

编辑 `config/sources.mjs`，加一行即可：

```js
// RSS 源
{ id: 'my-feed', name: '我的源', type: 'rss', url: 'https://example.com/feed.xml', hint: 'aigc-frontier' },

// 网页列表（用 include 正则筛出文章链接）
{ id: 'my-site', name: '我的站', type: 'html', url: 'https://example.com/news/',
  hint: 'postgrad', include: /example\.com\/article\/\d+/, minLen: 8 },
```

然后 `node src/collect.mjs --only=my-feed` 单独测试。

**想调分类准确度**：编辑 `config/rules.mjs` 里每个频道的 `strong`（强关键词）、`weak`（弱关键词）、`deny`（否决词）。

---

## 八、常见问题

**Q：网页打开是空白的？**
A：先 `node src/build.mjs`；如果 `dist/` 不存在就是没建站。

**Q：某个源一直失败？**
A：看 `data/status.json`。很多站（知乎、微博、小红书）有反爬或需要登录，已在代码里标注为不采用。

**Q：数据会丢吗？**
A：不会。`data/items.json` 累积 120 天，GitHub 上每天会提交一次，历史都在 commit 里。

**Q：能推送到微信/QQ 吗？**
A：能。每天生成的 `data/briefing/日期.md` 就是给你复制转发用的，站点 `briefing/` 页面也能直接看。

**Q：手机能看吗？**
A：能，页面是响应式的。GitHub Pages 地址在手机浏览器打开即可，也可以「添加到主屏幕」。

---

## 九、隐私与合规

- 所有抓取均来自**公开的 RSS / API / 网页**，不涉及登录态
- 微信/QQ 消息**只处理你主动提供的导出内容**，不读取客户端数据库
- 站点内容版权归原作者，仅供个人学习聚合
- 仓库公开意味着别人也能访问，请不要把私人聊天内容放进 `inbox/`
