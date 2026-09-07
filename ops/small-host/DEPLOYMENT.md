# 部署记录

## 2026-09-07 首次部署

状态：服务端部署完成；等待用户批准 Windows 根证书导入和浏览器最终验证

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
- [ ] 用户批准后在 Windows 信任根证书
- [ ] 浏览器无证书警告且协议为 HTTP/2（服务端 curl 已确认 HTTP/2）
- [ ] 多标签页事件流保持响应
- [x] 未自动执行任何付费 AI 生成

### 完成信息

- 完成时间：2026-09-07 12:19 CST
- 页面：`https://localhost:1443/zh`，服务端校验 HTTP 200 / HTTP/2
- HTTP 跳转：`http://localhost:13000` 返回 308 至 HTTPS
- Worker：`v0.5.0-beta.1-3275844dc8b6-blue` 为 Current Version，green 停止
- 长期容器：app、caddy、minio、mysql、redis、temporal、temporal-worker-blue
- 初始化容器：全部 Exited (0)
- 容器重启：全部 0；OOM：全部 false
- 最近 10 分钟关键错误关键词计数：全部服务为 0
- 资源余量、证书指纹、主机地址及代理配置仅记录在本地私有运维档案，不提交 Git。
