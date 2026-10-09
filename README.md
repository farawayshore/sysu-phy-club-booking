# 物院社团时间预约

在线网站：https://farawayshore.github.io/sysu-phy-club-booking/

## 仓库结构

- `club-booking/`：网站前后端源码、测试与开发文档。
- `peiyangfangan/`：去除账号信息后的培养方案正文。
- 根 `index.html`：当前已发布的前端成品，访问地址保持不变。
- `.github/workflows/pages.yml`：只发布网页成品，不发布源码和培养方案。

## 本地开发

进入 `club-booking/` 后运行 `npm ci`，然后 `npm run dev`。验证使用 `node --test tests/*.test.mjs`、`npx tsc --noEmit` 和 `npm run build`。

生成本地单文件 HTML：`node scripts/export-html.mjs`。
生成 Pages 成品：`npm run build:pages`，输出在 `club-booking/outputs/github-pages/`。

源码与线上成品分别更新：本轮已同步专业/班型筛选、课程分类配色及只读课表页面；后端与数据库已配套更新。发布新功能时先联调 uniCloud 后端，再把上述 Pages 成品复制到仓库根目录提交，Actions 会继续发布到同一网址。培养方案不上传云数据库，不作为 Pages 部署产物。

原始培养方案网页可能带页面账号信息，保留本地，不直接提交。
