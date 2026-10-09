# 实时预约更新（2026-10-08）

## 已实现

- GitHub Pages、uniCloud 阿里云数据库位置不变。用户已亲自在 DCloud 开通 uni-push 2.0 并关联 sysu-club-booking；应用 __UNI__F181DF8，仅 Web/小程序平台。
- 预约新增/取消的原子写入成功后，booking-api 广播 `{type:'booking-state-changed',revision}`。推送只通知版本变化，不包含预约或个人课表内容，不公开管理密钥。
- SDK 来自官方 npm @dcloudio/uni-push 3.0.0-alpha-5030120260930001；online/vendor 保留原包、许可证及源码校验值。scripts/prepare-push-sdk.mjs 选择 H5 条件代码，online/unipush-web-adapter.ts 以原生 WebSocket 实现 SDK 依赖的少量 uni 接口，没有重建网站为 uni-app。
- 每个页面有独立的内存推送标识，避免多个标签页相互踢下线；刷新后重新注册，不收集网站用户姓名/手机号，不存储客户端标识到数据库。服务商仍处理建立连接所需的 IP、浏览器信息和推送设备标识。
- 连接、断线状态可见。初次进入、重连、返回前台和手动刷新读取 API；收到新版本通知时读取一次。没有周期性数据库轮询；保留本地日期检查，跨北京时间午夜时更新日期和数据。
- coalescedRefresh 合并请求，读取过程中收到更新会再读一次，避免遗漏。所有预约合法性/冲突仍由服务器检查。
- 推送失败或超限不会把已成功的预约误报为失败；接口返回成功及 warning，页面提示手动刷新。推送等待上限 2.5 秒。
- 本地 HTML 不接入推送，原 localStorage key 保持不变，已重新导出两个文件。

## 发布与维护

- 默认 `node scripts/build-unicloud.mjs`、`node scripts/export-pages.mjs` 开启推送。`BOOKING_PUSH_ENABLED=0` 仅用于明确回滚，关闭推送后仅手动/返回页面刷新，不恢复定时轮询。
- 云函数 package.json 配置 extensions.uni-cloud-push。通过已有 HBuilderX CLI 上传 booking-api；无需管理员 Secret 写入前端。
- Pages 发布输出 index.html、.nojekyll 和两个许可文件，不上传本地课表、DCloud 登录配置或原始项目目录。
- 当前广播免费限额每天 100 次、每分钟 5 次；云函数/数据库仍使用原空间额度。没有启用付费套餐。
- 推送不是可靠消息队列：临时断线通过重连补查；服务商限流/丢消息时用户可返回页面或手动刷新。不声称保证每次变更都实时送达。
- **手动在数据库控制台改课表不会触发 booking-api 的通知。**目前这类管理修改后，已打开的网页需手动刷新或返回前台。将来增加受身份保护的课表管理入口时应复用同一个版本通知；不要开放公共推送或课表写入接口。

## 验证

- 37 项 Node 测试、TypeScript、生产构建、12 项 SQL 原子冲突测试和地点回读通过。
- backend GET 返回 revision，新增/取消在持久化后通知；测试验证推送失败仍返回预约成功、失败/无效操作不广播。
- GitHub Pages 首次发布 commit 7de0ae4d14908264042a8ecdb6c426947b4de5c4，断网恢复修复 commit ef4c1d14d4e9292fc1d2d821862881591f4e4ae1，Pages build=built，线上 HTML 与本地发布产物逐字节一致。
- 两个真实浏览器标签页各自显示“实时更新已连接”；从 API 写入测试预约后，两个页面无导航/聚焦/手动刷新即出现记录；删除后两个页面自动移除。
- 网络事件显示 WebSocket 收到消息后 2 毫秒即发起获取最新预约的请求。测试写入 revision15，取消 revision16，唯一测试记录已删除。
- 证据：outputs/deployment/push-before.json、push-mutation.json、push-cancel.json、push-pages-build.json、push-tests.log、push-build.log、push-sql-tests.log。164.7 秒网络观察期间仅有一次 API 请求，与一条真实用户新增预约推送相邻（约2毫秒）；没有定时轮询请求。真实用户记录保留，测试记录不存在。事件证据 push-browser-events.json。

- 断网恢复验证发现浏览器 offline 事件不一定立即关闭已有 WebSocket，导致 SDK 误认为仍连接；适配器现在主动关闭半开连接，新增回归测试。最终线上复测：断网显示“实时连接中断”，恢复后建立新 WebSocket 并显示“实时更新已连接”，自动补查预约。网络模拟与屏幕尺寸均已恢复。证据 push-reconnect.json。

- 最终手机390px检查：页面宽度与滚动宽度均390px，七个日期列完整可见，截图 outputs/qa/realtime-mobile.png；已视觉检查实时状态及手动刷新入口。最终 Pages HTML 与本地输出一致。
