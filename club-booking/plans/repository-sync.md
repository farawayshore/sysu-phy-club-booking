# 2026-10-09 外层目录与 GitHub 同步

本地外层为 `club booking project/`，包含网页源码 `club-booking/` 与培养方案 `peiyangfangan/`。旧 Projects/club-booking 路径保留为兼容符号链接，让旧 file:// HTML 地址继续可访问；不改变 localStorage key。

源码目录原有 Git 历史和未提交修改均保留。GitHub 远端使用原发布 checkout `outputs/pages-repo/`，其仓库内目录镜像外层结构；未将原源码仓库改成嵌套 submodule，未替换原 .git。后续同步应复制审查后的源码到该 checkout，再提交推送。

同步仅包含源码、配置、测试、文档及去除页面账号信息后的培养方案正文。忽略 node_modules、outputs、构建输出、本地数据库、环境变量和原始网页的账号外壳/附件目录。原始 HTML 保留本地。

GitHub Pages 使用 Actions，仅发布现有根 index.html、连接测试页和许可证，不把源码和培养方案部署到 Pages。根 index.html 仍是已发布的前端版本，本轮不将尚未联调后端的本地功能替换上线。之后完整发布需先验证 uniCloud 后端，再将 export-pages 产物更新到发布 checkout 根目录。
