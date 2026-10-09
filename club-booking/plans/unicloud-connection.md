# uniCloud 连接准备

2026-10-08 已在用户已登录的 Chrome 控制台确认：

- 空间：sysu-club-booking，阿里云开发者版。
- Space ID：mp-a5e7c91d-8504-4701-b37b-49e7c0c4158f。
- 控制台显示到期时间：2026-11-08 00:00:00。
- 函数列表只有系统 DCloud-clientDB。网页无新建/上传自定义函数入口。
- 本机 /Applications 和 ~/Applications 未找到 HBuilderX CLI。
- 未保存页面上的 ClientSecret，未改变套餐、现有线上接口或数据库。

测试项目：outputs/unicloud-connectivity。booking-health 仅返回固定的健康状态，不访问数据库；允许 GitHub Pages 来源 https://farawayshore.github.io，不将 CORS 当成身份验证。

下一步：安装官方 HBuilderX 并由用户登录 DCloud 账号，导入测试项目，关联上述空间，上传 booking-health。官方文档：https://doc.dcloud.net.cn/uniCloud/quickstart 。上传后在控制台函数详情读取实际 HTTP 地址，不猜测域名。

验收：无代理 curl 读取、Pages 来源的浏览器 GET 和 OPTIONS、用户校园网/手机流量访问。这里只检查连接，不能把成功健康响应当成预约数据库迁移成功。确认后再实现数据库适配、并发冲突保护及降低轮询用量，备份/迁移预约和公开课表，测试通过后切换 Pages API。

当前状态：测试源码就绪，尚未上传，尚无 uniCloud 部署证据。

## 2026-10-08 19:21 连接测试上传完成

- 用户安装 HBuilderX 5.26 并自行登录。通过官方 CLI 安装 unicloud 插件成功。
- 原纯目录测试项目缺少 appid，直接关联空间返回参数不正确。用官方 CLI 创建独立 uni-app 部署壳 outputs/unicloud-deploy，自动生成 appid `__UNI__F181DF8`，仅上传云函数，不发布该模板前端。
- 成功关联原空间，上传 booking-health。控制台确认创建时间 2026-10-08 19:20:03，Node.js 16、128 MB、5 秒超时、部署类型免费。
- 实际接口：https://fc-mp-a5e7c91d-8504-4701-b37b-49e7c0c4158f.next.bspapp.com/booking-health 。默认域名仍仅供测试。
- curl --noproxy '*' GET 返回 HTTP 200、ok=true，约 1.47 秒；Allow-Origin 为 https://farawayshore.github.io。
- OPTIONS 被平台处理，HTTP 200，允许 GitHub Pages 来源和 Content-Type。与函数代码的 204 不同，不能将本地预期当线上返回值。
- 证据：outputs/deployment/unicloud-health-direct.json、unicloud-health-direct-headers.txt、unicloud-health-preflight.txt。
- 现有 Pages 仓库新增 connection-test.html，提交 8a3d1c9。仅测试固定响应，不读取或写入预约。等待 Pages 构建/浏览器验证。
- 当前尚未迁移数据库或切换正式前端 API。没有升级套餐或启用按量计费。

### 网页验证完成

- Pages 构建状态 built，提交 8a3d1c91233f402ebbf9091b7e4b94a152436bd4。
- 在 Codex 内置浏览器打开 https://farawayshore.github.io/sysu-phy-club-booking/connection-test.html ，实际显示“连接成功”，耗时 1683 毫秒。浏览器网络是否经过系统代理不作推断；无代理直连结论来自上面的 curl 测试。
- 仍需用户使用手机流量/校园网确认实际使用网络的连通性。测试页保留供用户打开。

## 用户确认连接成功后：正式切换完成

- 用户明确要求“成功，可以切换了”。原前端网址不变；没有开通付费、按量计费或新增前端站点。
- D1 全库 export 接口报认证错误；改用已授权 D1 execute 成功读取 bookings 和 curriculum_documents 两表，保存 pre-unicloud-snapshot.json。Cloudflare 写入临时维护503后重新读取 unicloud-final-source.json：0条预约，1份公开课表、25条规则。不是丢失预约；源库当时就没有记录。
- 新后端 unicloud/api.ts 复用输入验证、课程冲突规则。集合 club_booking_state/current 用 revision 原子条件更新序列化状态；并发失败重读重检。客户端数据库 schema 禁止全部直接读写，课表HTTP接口只读。
- HBuilderX 初始化数据库成功并部署 booking-api，路径 /booking-api。构建命令 node scripts/build-unicloud.mjs。部署目录 outputs/unicloud-deploy（appid __UNI__F181DF8）。不要再次运行初始化覆盖正式数据。
- 线上网关偶发404 InternalBizError/no_matching_function_for_path；具体平台成因未确认。前端仅针对这个明确未路由到函数的错误最多重试两次，普通网络错误或其他应用响应绝不自动重试写入。不要把这项措施表述为已解决所有平台稳定性问题。
- 线上测试：完整课表与源库深比较一致；真实并发同社团两请求仅一条成功，另一条409；跨社团确认后成功；取消需confirmed；课表POST/PUT/PATCH/DELETE拒绝，非法Origin403。测试数据已清理。outputs/deployment/unicloud-api-verification.json。
- 页面合并预约与课表GET为一次数据库读取，可见时每120秒刷新，后台暂停，重新聚焦/提交后刷新。仍是轮询，不是即时推送。
- GitHub Pages提交 ee21032236d3dfc7587dcf97aeaea3ad415a1e07，状态built，线上HTML与生成产物cmp一致。API基址包含 /booking-api，构建器不再丢弃URL路径。
- 原Cloudflare API已转发到新API，版本4df9f7ef-991a-4bcf-952d-955db84cf944，避免缓存旧页面写入旧D1。D1仍保留数据，不能不迁回新增数据就直接作为回退主库。
- 33项Node测试、TypeScript检查、12项原SQL冲突测试、生产构建通过；两个本地HTML已重新导出，存储key保持兼容。
- 正式Pages页面实测：新增“阿里云切换验证 1938”成功；第二个页面（最初还是旧前端，经Cloudflare转发）看到同一条；更新后的第二页二次确认取消成功；第一页面重读为空；年级课程筛选成功。未声称两个隔离浏览器或真机测试。
- 390px布局验证innerWidth=scrollWidth=390、七列存在，无横向页面溢出；截图outputs/qa/unicloud-mobile.png。测试预约清理已用API回读确认。
- 最终证据outputs/deployment/unicloud-cutover-receipt.json、unicloud-pages-final-build.json、unicloud-live-pages.html。默认域名仍为平台测试域名，免费额度和续期限制不变。
