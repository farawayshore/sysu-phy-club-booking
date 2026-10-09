# 2026-10-09 前后端同步发布

- 50 项 Node 测试、TypeScript、12 项 SQL 冲突案例、生产构建通过。新旧两份本地 HTML 已导出。
- booking-api 已由已登录 HBuilderX 上传；一次性固定课表迁移使用完整文档读取及 revision 条件写入，19 → 20，保留原有预约。迁移后重新上传常规 API，撤下迁移代码。
- 云端课表与 data/timetables.json 深比较一致：4 个年级入口、25 条实际规则、8 门必修/4 门选修，本次隐藏公共选修 0 门。
- API 课表 POST/PUT/PATCH/DELETE 均 405；clientDB 写入权限关闭。线上与本地均无课表编辑入口；暂无网页管理员登录，所有者通过源文件及云控制台维护。
- 两个月边界在线验证：2026-12-09 可预约且可回读，12-10 被拒绝；测试预约清理，原有预约保留。
- 前端 GitHub Actions 发布及浏览器验证待完成；证据记录于本地 outputs/deployment/oct09-*。
