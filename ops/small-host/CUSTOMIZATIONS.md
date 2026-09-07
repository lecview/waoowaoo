# 定制修改记录

每项定制使用独立的 `feature/*` 或 `fix/*` 分支，并记录：需求、上游基线、涉及文件、测试结果、数据库影响、镜像 digest、部署日期和回滚方式。

## 当前记录

### Caddy IP 直连兼容

- 原因：访问 IP 字面量的 TLS 客户端可能不发送 SNI，Caddy 无法从缓存中选择 IP 证书并返回 TLS internal error。
- 修改：部署端保存带 `default_sni` 的 Caddy 原生 JSON，并通过不入库的 Compose 叠加文件加载；地址等主机信息不进入公开分支。
- 影响：无 SNI 客户端使用部署配置中的主机证书；不改变应用逻辑。
- 回滚：从 `COMPOSE_FILE` 移除私有叠加文件并重建 Caddy 服务。
- 验证：配置校验、容器重建、无 SNI TLS 握手、IP HTTPS、HTTP/2 和双标签页加载。
