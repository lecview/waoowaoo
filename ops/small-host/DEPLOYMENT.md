# 部署记录

## 2026-09-07 首次部署

状态：部署及局域网直连验证完成

### 部署前基线

- Debian 12 / Linux amd64
- Docker Engine、Docker Compose 与 `flock` 满足发布版要求
- 端口 `13000`、`1443` 部署前未占用
- 现有容器和 1Panel 配置必须保留

### 安装约束

- 使用同一发布标签中的 Compose、Caddyfile 与 Worker rollout 脚本。
- 应用与 Codex runtime 均固定到 Release 公布的不可变 digest。
- 首次 Worker 布局为 blue=1、green=0。
- 使用官方 `worker-rollout.sh bootstrap blue`，不另建启动路径。
- `.env` 使用独立随机密钥，权限限制为安装账户可读，不打印、不提交。
- Caddy `/data` 与 `/config` 命名卷必须保留。
- 不运行 `docker compose down -v`。

### 验证清单

- [x] Compose 配置校验通过
- [x] 应用和 Runtime 镜像拉取成功
- [x] Worker bootstrap 成功
- [x] 初始化容器成功退出
- [x] 长期运行容器健康
- [x] `http://localhost:13000` 跳转至 HTTPS
- [x] 公共根证书已仅导出 `root.crt`
- [x] Windows 当前用户已信任部署根证书（仅公钥证书）
- [x] Windows Edge 直连局域网入口无证书拦截，页面为 HTTP/2
- [x] 首个注册用户已通过 UUID 显式映射为管理员
- [ ] 多标签页事件流保持响应
- [x] 未自动执行任何付费 AI 生成

局域网 IP 入口启用时，部署端通过私有 Caddy JSON 及 Compose 叠加文件设置 `default_sni`，兼容不发送 SNI 的 IP 字面量客户端；具体地址只保存在本地私有记录。

### 完成信息

- 完成时间：2026-09-07 12:45 CST
- 页面：局域网 HTTPS 入口，服务端与 Windows Edge 均校验 HTTP 200 / HTTP/2
- HTTP 跳转：局域网 HTTP 入口返回 308 至 HTTPS
- Worker：`v0.5.0-beta.1-3275844dc8b6-blue` 为 Current Version，green 停止
- 长期容器：app、caddy、minio、mysql、redis、temporal、temporal-worker-blue
- 初始化容器：全部 Exited (0)
- 容器重启：全部 0；OOM：全部 false
- 最近 10 分钟关键错误关键词计数：全部服务为 0
- 资源余量、证书指纹、主机地址及代理配置仅记录在本地私有运维档案，不提交 Git。
