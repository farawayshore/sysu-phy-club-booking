# 2026-10-09 前后端同步发布

- 50 项 Node 测试、TypeScript、12 项 SQL 冲突案例、生产构建通过。新旧两份本地 HTML 已导出。
- booking-api 已由已登录 HBuilderX 上传；一次性固定课表迁移使用完整文档读取及 revision 条件写入，19 → 20，保留原有预约。迁移后重新上传常规 API，撤下迁移代码。
- 云端课表与 data/timetables.json 深比较一致：4 个年级入口、25 条实际规则、8 门必修/4 门选修，本次隐藏公共选修 0 门。
- API 课表 POST/PUT/PATCH/DELETE 均 405；clientDB 写入权限关闭。线上与本地均无课表编辑入口；暂无网页管理员登录，所有者通过源文件及云控制台维护。
- 两个月边界在线验证：2026-12-09 可预约且可回读，12-10 被拒绝；测试预约清理，原有预约保留。
- 前端提交 2e26480ad0a001fae6b2de714a312719e4a8806a 已成功部署，Actions 运行 https://github.com/farawayshore/sysu-phy-club-booking/actions/runs/37870837314 成功。正式网址 https://farawayshore.github.io/sysu-phy-club-booking/ 返回内容与导出 HTML SHA-256 一致。
- 线上浏览器验证：全选顺序大一/大二/大三/大四，下周显示 8 个必修块、6 个选修块；取消选修后保留 8 个必修块。无编辑按钮，实时更新已连接；390px 页面无横向溢出，七天全部位于屏内。
- 证据记录于本地 outputs/deployment/oct09-*，截图 outputs/qa/oct09-live-desktop.png 与 oct09-live-mobile.png。本地 HTML 编辑入口的静态渲染测试通过；本轮浏览器禁止打开 file://，未通过该通道检查本地文件。
