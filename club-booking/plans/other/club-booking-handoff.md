# 社团预约网站：进度交接

> 2026-10-09 已获用户授权发布全部本地更新，并要求本地页也关闭课表编辑。最新发布状态以 ../oct09-release.md 为准。

> 2026-10-09 已根据物理学/拔尖计划方案给现有12门课程的25条规则分类（8必修、4专选），公共选修可隐藏，本次全部有出处、隐藏0门。49项测试通过；仅本地更新，见 ../course-classification-audit.json。

> 2026-10-08 本地新增专业、特殊班型与必修/选修筛选；大四继承大三选项，特殊班型均默认关闭，无“普通班”开关。未访问云数据库、未部署。详见 ../curriculum-classification.md；仍待培养方案与各专业课表。

> 工作流程（用户最新要求）：先本地调试、通过后再同步线上；使用独立本地测试数据，减少免费云数据库额度消耗。本轮剩余浏览器调试已在本地完成。

> 预约范围已改为两个自然月、分页动态限制。2026-10-08 线上新边界预约验证被数据库读取额度耗尽阻断（615/500 RU），代码/构建/分页验证通过，详见 ../two-month-booking.md。

> 实时推送已于 2026-10-08 接入，已验证跨页面新增与取消；当前同步行为以 ../realtime-updates.md 为准。

> 最新状态（2026-10-08）：用户确认国内网络连接成功后，正式切换为 GitHub Pages + uniCloud 阿里云后端。当前部署、测试、已知网关404限制与维护方式见 ../unicloud-connection.md 和 README 顶部。以下为历史记录，Cloudflare/D1不再是主数据库。

用户于 2026-10-08 要求因额度不足暂存，停止后续开发。后续仅在用户要求继续时恢复。

## 项目与 Sites

- 本地源码：`~/AI/ai_works/club-booking`
- Sites project_id：`appgprj_6ac6f6c83130819188f2590a65076d7f`
- 源码已由 Sites site-workflow 推送并打包，commit：`4d3639947be60ada6e334d8bb6073288c4fe33f2`
- 发布包：`~/AI/ai_works/club-booking/outputs/deploy.tar.gz`
- 预期网址：`https://sysu-club-calendar.spry-hake-0326.chatgpt.site`（是否部署成功见下方补充；不要凭预期网址声称已上线）
- 已调用 save_version_and_deploy_private，暂停时工具尚未返回；先检查已有版本/部署，勿重复建站或重复保存部署。
- 保持默认 owner-private。未得到公开访问授权。不要持久化任何凭据。

## 完成内容

- Vinext + React + Cloudflare D1；数据库迁移 `drizzle/0000_shallow_bloodstorm.sql`。
- 浅绿白底设计，三页周历，手机上下布局、横向周历从今天开始。
- 时间来自 `resources/class curriculum/2026学年度第一学期个人课程表.doc`：1–2=08:00–09:40，3–4=10:10–11:50，5–6=14:20–16:00，7–8=16:30–18:10，9–10=19:00–20:40，第11节=20:50–21:35。
- 默认单一共用资源；北京时间今天到第14天（含），本周及之后两周共三页，超范围日期禁用；过去时间禁约，不支持跨日。
- 自定义 HH:mm；连续课节快捷选择；精确匹配课节边界时显示节次，否则显示时间。
- 同社团重叠直接拦截，其他社团重叠弹窗确认或取消；一条原子条件 INSERT 重检所有冲突，防止并发漏检，新增冲突须重新确认。
- D1共享保存、每30秒及窗口聚焦自动刷新。未增加删除/管理功能。
- `app/schedule.ts` 的 CLUBS 目前为空，待正式名单；提交按钮禁用，私密预览可看。

## 已验证

- TypeScript检查通过；生产构建通过。
- 5组日期/输入/边界单元测试通过，12项SQLite原子冲突测试通过。
- 本地浏览器实测：第三页不可后翻，超范围日期禁用，点击课节填日期时间，首次预约成功，同社团重复拦截，异社团取消不写入、确认保留两条，18:07–18:53自定义时间预约成功。
- 发现原生日期输入 fill 未触发 React onChange，已加 onInput 并验证表单摘要同步。
- 桌面1365px和手机390px视觉检查；手机横向周历与固定时间轴。空状态移动端随水平滚动定位最后做过修复，可继续复看。
- 临时测试社团 A/B 已从源码移除，3条本地测试预约已按测试社团名删除；正式站点未写测试数据。

## 待用户回答

已通过异步问题工具提出但尚未收到答案：
1. 正式社团名称列表。
2. 访问方式：任何持链接者查看预约 / 查看公开预约登录 / 仅自己预览。
3. 是否一个共用场地；默认今天至第14天（含）的两周规则是否接受。

恢复时先读 Sites SKILL.md，复用 project_id 和本地目录。确认上一部署结果，再根据答案补名单、权限和场地范围，完成最终交付。不要重新建站。

## 暂存时最终状态补充

- 私密部署已成功：`https://sysu-club-calendar.spry-hake-0326.chatgpt.site`。
- deployment_id：`appgdep_6ac6faedd8308191a38695ac101ed658`
- version_id：`appgprj_6ac6f6c83130819188f2590a65076d7f~appgver_ac47c3492e608191af527d1ee483415a`
- 工具确认 status=succeeded；无需重复发布同一版本。
- 本地开发服务已停止，源码工作树干净。上述“部署待确认”已由本补充解决。

## 2026-10-08 续接：本地 HTML 已交付，线上修改待恢复访问

本节取代上方“待用户回答”与“未得到公开访问授权”的旧状态：

- 用户给定社团：SPS、torchwood、学生会，之后可扩充。
- 用户明确要求任何持链接者可查看和预约。
- 增加必填活动地点；日历块、详情、冲突提示显示地点。地点不改变原来按社团/时段判断冲突的规则。
- 时间范围仍为北京时间今天至第14天（含）。
- 当前账号对原 project_id 调用 get_site/get_deployment_status 均返回 NOT_FOUND；未修改站点 ID、未新建替代站点、未发布或改访问权限。需恢复原 Sites 账号/工作区访问后完成公开发布。
- 本地已修改 app/schedule.ts、app/page.tsx、app/api/bookings/route.ts、db/schema.ts 和样式。追加迁移 drizzle/0001_young_war_machine.sql，保留已发布的 0000 迁移不变。
- 用户随后要求本地 HTML 与发布版页面相同。已导出 outputs/共时-社团预约-本地版.html，直接复用同一个 React 页面和 CSS，包含上述新增内容。
- 本地版持久化为浏览器 localStorage，与线上 D1 不同步；页面注明本地保存。没有在线正式预约数据，也没有内置演示数据。CSS 的 Google Fonts 是可选联网字体，离线使用系统后备字体；JS/CSS/图标均已嵌入文件。
- 可复现导出：node scripts/export-html.mjs。入口 offline/entry.tsx。
- 验证：tsc --noEmit 通过；6组日期/输入测试、12项 SQLite 原子冲突案例与地点存取、2组本地保存/重新读取/冲突确认/存储失败测试通过；Safari file:// 打开并检查页面及社团名单。UI 测试使用独立 outputs/qa/local-test.html。

## 2026-10-08 再次修改：更名与取消预约

- 页面更名为“物院社团时间预约”，移除“共时”“相聚”及其他宣传性文案。
- 点击预约块查看详情，有“取消预约”按钮；点击进入二次确认，“否，保留预约”返回详情，“是，取消预约”才执行删除。删除失败留在确认框显示错误。
- 网站源码增加同源、确认标记及 ID 校验的 DELETE /api/bookings；本地版同步支持删除并持久化。当前无用户登录/身份归属限制，沿用公开预约模式。
- 最新本地文件为 outputs/物院社团时间预约.html；旧 outputs/共时-社团预约-本地版.html 也原位更新，可沿旧路径使用原浏览器本地记录。存储 key 保持不变。
- 10组日期及本地存储/取消预约测试、12项原子冲突测试、SQL定点删除与重复删除检查通过；类型检查与导出通过。
- 线上仍未发布，先前原 Sites 项目 NOT_FOUND 的访问问题仍待解决。

## 2026-10-08 日历时间轴与非课时显示

- 日历覆盖 00:00–24:00，首次加载及切换周时默认滚到 08:00。
- 连续分段显示全部11课节、课间、11:50–14:20午饭/午休、18:10–19:00晚饭、课前和晚间时段。非课时只有背景及时间标注，不添加快捷预约按钮；自定义时间可预约。
- 统一基础比例 2 px/min，所有日期共用同一映射；不再对预约高度设置固定12px下限或减3px。
- BookingBlock 使用 ResizeObserver 测量真实内容高度。只有有预约且内容超出时长高度的区间扩展，全周同步对齐；长地点完整换行；删除后恢复基础比例。
- 新增 timelineSegments/timelineScale 及 tests/timeline.test.mjs，验证全天连续覆盖、等时长等高度、课间和午饭比例、内容扩展及删除后恢复、非课时预约。
- 类型检查通过，14组现有及新增测试全部通过，生产构建通过；未进行本轮浏览器视觉检查（当前无可用浏览器检查工具）。
- 两个 HTML 导出路径均原位更新，浏览器存储 key 未改。线上仍未更新。

## 2026-10-08 手机端适配

- 小屏幕改为上下布局；日历独立双向滚动，固定日期表头与左侧128px时间轴，每日列至少160px，显示文字保持可读。
- 手机导航/分页触控区44px、表单与确认按钮48px；输入字号16px，自定义时间改原生 type=time、精确到分钟。手机快捷课节为两列。
- 修复手机首次定位日期的计算，按实际元素边界对齐，并响应手机布局切换。
- 弹窗按动态视口限制高度、允许滚动；打开时锁定背景滚动；兼顾安全区域、小屏页眉及底栏。
- HTML及网页元数据设置 viewport-fit=cover；新旧HTML文件均重新导出。
- TypeScript、14组现有测试、生产构建通过；CSS按Safari15.4/Chrome100目标解析无警告。未做手机真机或移动端浏览器视觉实测，不能将这些静态检查描述为真机验证。
- 发信功能仍处于方案讨论，尚未实现或发送任何邮件。原线上站点尚未更新。

## 2026-10-08 年级课表筛选与课程冲突提示

- 新增 data/timetables.json，依据原 XML Word 课表及 ai_works/dida-life-memory/curriculum/current-term.json 导入 grad3 term1 为“大三”；25 条授课规则、12 门课程，第一周星期一 2026-09-07。未带入老师、学生姓名或 Dida 任务 ID。页面明确这是个人选课试用数据，尚非全年级完整课表。
- 年级筛选支持“不筛选”与多选；仅选中年级参与显示、预约冲突判断。按日期对应实际教学周，保留不连续周次、授课时段变化。显示沿用今天至第14天（含）窗口与自然周分页。课程蓝紫色、虚线边框，与活动颜色区分；使用相同叠放与比例时间轴。
- 课程详情只读，不显示预约删除按钮。预约与课程冲突时列出年级、课程名、重叠时间、地点；用户明确确认才继续。既撞课又撞其他社团活动时依次确认，保留同社团不能重复预约的约束。线上 API 与本地接口均校验；确认签名含课程名和时段/地点，更新课程后会重新确认。
- 本地版提供“导入 / 更新课表”编辑器，可手动修改课程、周次、星期、时刻、地点，添加年级/课程，JSON 导入导出，停课及调休日期。草稿点击保存才生效；导入替换所有待保存年级，明确提示；保存前保留上次浏览器数据备份。停课 sourceDate=null，调课 sourceDate=被借用课程的日期，不自动推断节假日。
- 浏览器课表 key 为 physics-club-curriculum-v1，与预约存储分开。编辑器仅在本地版开放，不增加无身份验证的线上公开课表写入接口。线上课表使用打包 JSON，管理者更新源文件后需重新发布。尚未恢复原 Sites 访问，线上本轮未更新。
- 新旧 HTML 均原位重新导出，新增 outputs/大三-2026第一学期课表.json 可导入模板。
- 验证：TypeScript 通过；21 组 Node 测试通过（含周次、多年级、调休、边界时间、课程及活动双重确认、修改课表后重新确认）；12 项 SQL 原子冲突、地点回读通过；生产构建通过。
- Chrome headless 独立临时用户目录实测桌面1440×1000、手机模拟390×844：课程开关、课程只读详情、无横向页面溢出、JSON 文件导入、保存刷新、多年级叠加、冲突弹窗列出课程、确认前不保存、确认后成功。无 JS 运行异常。不是手机真机测试。检查中修复手机 primary 确认按钮字号被旧规则覆盖的问题。
- 视觉证据在 outputs/qa/grade-filter-desktop.png、grade-filter-mobile.png、grade-editor-mobile.png、course-conflict-mobile.png；测试使用隔离浏览器存储，没有写入用户实际预约。

## 2026-10-08 迁移为独立本地项目

- 项目整体移动到 ~/Projects/club-booking，包含 .git 历史、未提交修改、依赖、HTML、课表数据、测试、数据库迁移和原 Sites 配置；移动前后逐项核验 50 份源码/数据/输出文件 SHA-256 一致。
- 原 ~/AI/ai_works/club-booking 留作指向新目录的符号链接；已有 HTML 地址继续有效，避免用户被迫更改 file:// 浏览器存储来源。新地址不自动继承旧地址的本地存储。
- 本交接文件同步移动至新项目 plans/other/，原位置仅保留兼容链接。以前记录中的旧路径为历史路径，可通过兼容链接继续访问。
- 更新 README 和独立项目 AGENTS.md，包名改为 physics-club-booking；浏览器验证脚本改用相对项目根路径。
- 当前可用 Codex 工具未提供添加本地项目的接口；侧栏需用户选择“添加项目”并打开新目录。文件系统与 Git 层面的项目迁移已完成。
- 在新目录重新完成类型检查、21 组功能测试、12 项 SQL 冲突检查、HTML 导出、生产构建及独立 Chrome 桌面/手机尺寸交互检查，全部通过。旧 HTML 路径可经兼容链接继续访问。

## 2026-10-08 独立 Cloudflare 部署成功

本节取代上方仅本地交付、原 Sites 访问受限的当前发布状态。用户明确选择自己的 Cloudflare 账号，要求不用 OpenAI Sites，并已完成 Wrangler 登录。

- 正式网址：https://physics-club-booking.sysu-physics-clubs.workers.dev
- Worker：`physics-club-booking`；账号的 workers.dev 子域名：`sysu-physics-clubs`。
- D1：`physics-club-booking-db`，ID `a4c58e38-a2e2-4c21-83c3-cb30f355a696`；区域 APAC，绑定 `DB`。
- 已部署版本：`d8df3294-d3ab-4984-b19a-dcf30cb719d6`，Wrangler deployments list 确认 100% 流量；0000、0001 两份迁移已应用，无待执行迁移。
- `vite.config.ts` 使用 `wrangler.jsonc` 和 `build/cloudflare-worker.ts`；移除当前构建中的 Sites 插件、认证模拟及 CONNECTORS 服务绑定。历史文件保留，`.openai/hosting.json` SHA-256 校验未改。
- `npm run dev/build/start/deploy` 走独立 Cloudflare 路径。`npm run db:migrate:remote` 使用源配置执行迁移，`npm run deploy` 先构建再部署同一个 Worker。
- 两个本地 HTML 重新导出；localStorage key 不变。本地记录未迁移至 D1。线上课表仍为打包数据；在线课表编辑和即时推送没有在本次增加。
- 验证：tsc 通过、21 组 Node 测试通过、12 项 SQL 冲突案例及地点回读通过、生产构建与部署 dry-run 通过。上传总量 gzip 219.14 KiB。
- 新子域名注册后最初 TLS 握手失败，随后恢复，网页与 API 均 HTTP 200。
- 2026-10-08 12:00（北京时间），Chrome headless 两个隔离 BrowserContext：桌面表单新增预约，手机尺寸另一会话未手动刷新，约 29.6 秒后自动看到；同社团重复提交返回 409；另一会话经二次确认取消，原会话聚焦刷新后消失。确认未写入 localStorage，测试预约已清理，无 JS 异常。
- 已视觉检查 1440×1000 桌面及 390×844 手机模拟截图，无页面横向溢出。不是手机真机测试；本机浏览器可能使用系统代理，未验证校园网或移动网络直连。
- 发布证据：`outputs/deployment/deployment-receipt.json`、`deployments.log`、`version.log`、`migrations-status.log`、`browser-verification.json`；截图 `outputs/qa/cloudflare-desktop.png`、`cloudflare-mobile.png`。验证脚本 `outputs/qa/verify-cloudflare-browser.mjs`。
- 未开通付费套餐或使用付费 API。沿用公开预约模式，无登录归属限制，持链接者均可预约及取消。
- 用户随后询问 GitHub Pages 前端 + Cloudflare 后端是否可行；已说明可行并询问选择。尚未收到明确切换指令，当前仍是 Cloudflare 整站；若拆分须新建在线静态入口、配置 API 基址与精确来源的 CORS/OPTIONS，并处理框架自身的来源校验，不能直接上传 offline HTML。

## 2026-10-08 转为 GitHub Pages 前端 + Cloudflare API（发布待仓库可见性确认）

- 用户明确选择拆分部署，并指定 `git@github.com:farawayshore/sysu-phy-club-booking.git`。
- 已读取该仓库：私有，原 main 仅 README，初始提交 `b1b46fd`。发布克隆在 `outputs/pages-repo`；根项目未修改 Git remote。
- 前端入口 `online/entry.tsx`、导出脚本 `scripts/export-pages.mjs`，产物 `outputs/github-pages/index.html`。前端仍复用 app/page.tsx 和 app/globals.css；通过明确 API 基址调用 Cloudflare，不使用离线存储适配器。首页链接改为相对路径以兼容 Pages 子目录。
- `app/booking-api.ts` 将在线静态前端和原相对接口地址分开；离线 HTML 存储 key、导入课表及取消逻辑保持不变，两个 HTML 已重新导出。
- API Worker 入口 `worker/api.ts`，配置 `wrangler.api.jsonc`，复用同一个 D1。`worker/router.ts` 处理精确来源 `https://farawayshore.github.io` 的 CORS/OPTIONS，允许 GET/POST/DELETE、Content-Type；错误响应也带正确 CORS；不允许通配来源或共享凭据。路由中原同源校验改为与配置一致的来源校验。
- Cloudflare 整站入口保留作本地开发与历史备用。`npm run deploy:api` / `npm run deploy` 将上传纯 API Worker，根路径重定向到 Pages。尚未执行该发布，避免 Pages 不可用时破坏现有网站。
- 类型检查、26 组 Node 测试（含 5 组跨域行为测试）、12 项 SQL 冲突案例及地点回读、完整生产构建、API deploy dry-run 均通过；API gzip 4.82 KiB。
- 前端文件以提交 `a025c55` 推送到指定仓库 main，未修改原 README。仅新增 index.html 与 .nojekyll。
- Pages 创建被 GitHub API 拒绝：HTTP 422，`Your current plan does not support GitHub Pages for this repository.`。未改变仓库可见性，已向用户询问是否公开该仓库，等待明确答复。
- 拟用 Pages 地址：https://farawayshore.github.io/sysu-phy-club-booking/；目前尚未启用，不能声称可访问。
- GitHub 拒绝证据：`outputs/deployment/pages-create-response.json`；创建请求 `pages-create-request.json`。后续批准后可继续启用，部署 API，并运行 `node outputs/qa/verify-pages-browser.mjs https://farawayshore.github.io/sysu-phy-club-booking/ https://physics-club-booking.sysu-physics-clubs.workers.dev`。

## 2026-10-08 课表迁入 D1，公开只读、管理端更新

- 用户要求课表最好入库；随后明确选择“继续公开展示，先把数据移到数据库”，并要求课表编辑仅自己可用。未授权公开 GitHub 仓库或重写历史，GitHub Pages 仍待原可见性批准。
- 新增 schema / 迁移 `0002_curriculum_documents.sql`，已应用到同一远端 D1。文档 `current-term` 已导入并设为 public：1 份课表、25 条授课规则，回读 SHA-256 一致，证据 `outputs/deployment/curriculum-import-remote.json`。
- `scripts/import-curriculum.mjs` 使用管理端 Wrangler OAuth 更新、投影白名单字段并回读校验。`npm run db:import:curriculum -- --remote --public` 明确公开导入；无 --public 时新文档默认 private，更新已有文档保留可见性。脚本从 data/timetables.json 读取，私密 SQL 中间文件只在 gitignored outputs/。
- 新增 `db/curriculum.ts` 和只读 GET `/api/curriculum`，只查询 visibility=public 的文档。没有面向网站访客的 POST/PUT/PATCH/DELETE 课表接口。新账号系统尚未实现，网页管理员编辑仍待后续建设；目前仅持 Cloudflare 管理权限者可更新共享课表。
- app/page.tsx 改为在线读取课表 API；服务端预约冲突校验也读取同一 D1 文档。数据更新后页面下次刷新生效，不必重打包前端。
- 本地入口独立传入 data/timetables.json，保留离线课表、浏览器编辑和原 localStorage key。在线入口与 API 构建不导入原课表数据，新增构建依赖检查防止误打包。
- 指定 GitHub 私有仓库 main 更新到 `5ce10fc`；前端最新文件不再包含课表数据。早期提交 a025c55 仍包含内置课表和本机提交身份，未擅自重写；本次起已为发布克隆配置 GitHub noreply 提交身份。
- 因 Pages 仍未启用，本次先更新当前 Cloudflare 整站，保持可用；新部署版本 `32780cae-84b3-4ce5-ac5c-fde3579ef0bc`。拆分用纯 API Worker 已同步支持只读课表，但尚未替换正式整站。
- 类型检查、原 26 组测试、新 3 组课表访问/构建边界测试、12 项 SQL 冲突与地点回读、完整生产构建通过。实际部署日志 `outputs/deployment/deploy-database-curriculum.log`。浏览器验证正在进行。

### 课表入库最终验证

- 2026-10-08 12:13（北京时间），线上浏览器实际读取 D1 的25条课表，筛选及课程只读详情正常，未显示课表编辑入口。
- 从浏览器对课表接口发起 POST/PUT/PATCH/DELETE，均返回405；前后读取课表内容一致。
- 两个隔离浏览器会话再次完成新增预约→约29.3秒自动同步→二次确认取消→另一会话同步移除，测试记录已清理，无JS异常。证据 `outputs/deployment/database-curriculum-browser.json`。
- 本地HTML既有浏览器验证脚本通过：桌面/手机模拟、课表导入保存刷新、多年级、课程冲突确认。离线编辑仅改变测试浏览器本地存储。
- 拆分API配置再次dry-run通过。GitHub仓库仍为PRIVATE，Pages尚未启用；原Sites标识校验不变。

## 2026-10-08 手机整周概览

- 用户希望手机一次完整看到一周，替代原先每列160px、总宽1248px横向滚动。
- 手机<=760px改为44px时间轴+均分七天列，移除自动滚至今天的横向定位；保持上下滚动和缩放。日期表头缩至62px。
- 手机时间比例1 px/min，桌面仍2 px/min；切换布局后重新定位08:00。活动简短标题最多3行，完整名称/社团/地点/时间仍保留在可点击详情与无障碍标签中。压缩显示也通过ResizeObserver维持共用时间轴。
- 手机筛选区和日期分页适当压缩，预约表单保持16px输入及原有触控尺寸。两个离线HTML与Pages导出均更新。
- 类型检查、29组Node测试、12项SQL冲突及地点回读、生产构建通过。
- 隔离Chrome浏览器实测320/390/430/760px：七个日期全部在可见区域、日历与页面均无横向溢出、45分钟空课节45px；真实坐标点击活动能打开完整详情；切回1440px恢复90px课节和地点文字。未写入正式数据库。
- 已视觉检查390px完整七列，证据 `outputs/qa/mobile-week-390.png`、`mobile-week-detail.png`、`mobile-week-desktop.png`，验证记录 `outputs/deployment/mobile-week-verification.json`。发布后线上检查待补充。

- 发布完成：Cloudflare版本 `a3972657-8311-4605-9557-7eb9870d7cd7`，GitHub私有仓库main已同步 `4bc273a`（Pages仍未启用）。线上Chrome手机尺寸320/390/430px实测全部七列可见、D1课表筛选正常、无横向溢出和JS异常；线上截图已视觉检查，证据 `outputs/qa/mobile-week-online.png` 与 `outputs/deployment/mobile-week-online.json`。

## 2026-10-08 GitHub Pages + Cloudflare 拆分发布完成

本节取代以上“仓库私有、等待可见性授权、Pages尚未启用”的当前状态。用户已自行公开指定仓库，并要求继续发布。

- 已现场确认仓库 PUBLIC。启用 main 根目录分支式 Pages，HTTPS enforced=true。
- 正式前端：https://farawayshore.github.io/sysu-phy-club-booking/
- GitHub Pages build `1268377080` 为 built，提交 `4bc273a1280af54a63632a1d18b817a5cc421eb5`。线上 HTML 与该提交产物逐字节一致，SHA-256 `b84b58dcb8571266dab0656391d7e39507af3a5b81bfbb8b9022ca53f565b544`，267858 bytes。
- Cloudflare Worker 已切换到 wrangler.api.jsonc 的纯 API 入口，部署版本 `e4850dbe-5a6b-46d5-b0f7-7c0bb53f9a5f`；沿用同一 D1。原 workers.dev 根路径302跳转到Pages，API路径继续工作。
- Pages来源精确允许 `https://farawayshore.github.io`；跨域预约POST预检实测204、正确Allow-Origin/Methods/Headers。课表仅公开GET，无公开写入功能，管理方式不变。
- 类型检查、8组相关CORS/课表访问测试、API dry-run通过；完整构建和全部29组测试沿用上一轮通过结果，本轮没有修改应用代码。
- 证据：`outputs/deployment/pages-create-response.json`、`pages-build-status.json`、`pages-headers.txt`、`deploy-pages-backend.log`、`pages-preflight-headers.txt`。跨站浏览器验证待补充。
- 用户自行公开仓库前未清理历史。最初 a025c55 的本机提交身份和内置课表仍在历史，未擅自重写；新提交从5ce10fc起用GitHub noreply身份。课表公开展示已获用户明确同意。

### 拆分发布最终验证

- GitHub Pages页面上的两个隔离浏览器会话完成真实新增预约、约29.3秒自动同步、重复拦截409、二次确认取消及聚焦同步，测试预约已清理；既有预约保留。25条D1课表成功跨站读取，课程详情只读。
- 课表POST/PUT/PATCH/DELETE均405，不允许的Origin写预约403；原Cloudflare根网址实测302至Pages。桌面及390px手机截图已检查，无横向页面溢出或JS异常。不是手机真机或校园网直连测试。
- 验证证据：`pages-browser-verification.json`、`pages-api-access-checks.json`、`old-url-redirect.txt`、`pages-final-bookings.json`，均位于outputs/deployment；截图outputs/qa/pages-desktop.png与pages-mobile.png。
