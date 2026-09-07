# 小主机部署资料

这里保存可安全提交到 Git 的部署说明和定制记录。任何密钥、完整 `.env`、数据库内容、证书私钥及含用户数据的日志都不得提交。

## 基线

- 上游：`https://github.com/waooAI/waoowaoo`
- 发布版：`v0.5.0-beta.1`
- 源码提交：`6cbbe22cc6492159e0f649d507e4e21a9aec3074`
- 应用镜像：`ghcr.io/waooai/waoowaoo@sha256:3275844dc8b670d0271d4b6b519ef9812a6d97658408eefbb570cb4c241228dd`
- Runtime 镜像：`ghcr.io/waooai/waoowaoo-codex-runtime@sha256:227e693df52733c6ade9a086fcae6c0ae3e603260349d6adb480e59e5f672219`
- 服务器目录：使用独立、持久化的安装目录
- Compose 项目名：`waoowaoo`
- 浏览器入口：`https://localhost:1443`（可通过 SSH 隧道）

## 文档

- [DEPLOYMENT.md](DEPLOYMENT.md)：安装和验证记录
- [RUNBOOK.md](RUNBOOK.md)：日常运维、升级与回滚
- [CUSTOMIZATIONS.md](CUSTOMIZATIONS.md)：后续定制修改台账
- [connect-tunnel.ps1](connect-tunnel.ps1)：Windows 访问隧道
