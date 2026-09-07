# 定制修改记录

每项定制使用独立的 `feature/*` 或 `fix/*` 分支，并记录：需求、上游基线、涉及文件、测试结果、数据库影响、镜像 digest、部署日期和回滚方式。

## 当前记录

### Caddy IP 直连兼容

- 原因：访问 IP 字面量的 TLS 客户端可能不发送 SNI，Caddy 无法从缓存中选择 IP 证书并返回 TLS internal error。
- 修改：部署端保存带 `default_sni` 的 Caddy 原生 JSON，并通过不入库的 Compose 叠加文件加载；地址等主机信息不进入公开分支。
- 影响：无 SNI 客户端使用部署配置中的主机证书；不改变应用逻辑。
- 回滚：从 `COMPOSE_FILE` 移除私有叠加文件并重建 Caddy 服务。
- 验证：配置校验、容器重建、无 SNI TLS 握手、IP HTTPS、HTTP/2 和双标签页加载。

### 首个管理员映射

- 自托管版没有默认管理员账号或密码；管理员权限由 `ADMIN_USER_IDS` 显式授权。
- 部署端先按用户名精确查询唯一用户 UUID，再通过私有 Compose 叠加文件将环境变量传入应用；用户名和 UUID 不进入公开分支。
- 验证：应用容器环境映射存在、重建后无重启异常、公开页面仍正常响应。

### Sub2API 平台模型供应商

- 原因：自托管实例需要由服务端统一提供语言、图片和视频模型，终端用户不再逐个保存供应商 Key。
- 修改：新增独立 `sub2api` provider；语言模型走 OpenAI Responses，图片走原生 Images API，视频走原生异步 Videos API。
- 平台模型：登记四个语言模型，以及首发图片 `gpt-image-2`、视频 `seedance20`；实际启用清单由私有部署环境决定。
- 凭据：仅从 `PLATFORM_SUB2API_API_KEY` 读取，不进入源码、测试夹具、Compose 公共文件或 Git 历史。
- 计费：自托管部署保持 `BILLING_MODE=OFF`；目录中的零价格只表示平台自身不扣积分，不代表上游请求免费。
- 验证：TypeScript、ESLint、供应商目录一致性及图片/视频请求契约测试；真实生成需另行授权。
- 回滚：恢复上一应用镜像与 Worker build，并把 `PROVIDER_CREDENTIAL_MODE` 恢复为原部署值。
