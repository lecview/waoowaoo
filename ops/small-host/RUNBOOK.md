# 运维手册

所有命令均在服务器安装目录执行，并使用同一 `.env` 与 Compose 项目名。

Windows 端可运行 `ops/small-host/connect-tunnel.ps1` 建立隧道，然后访问 `https://localhost:1443`。

## 状态检查

```sh
docker compose ps -a
sh scripts/temporal/worker-rollout.sh status
docker stats --no-stream
```

## 日志检查

```sh
docker compose logs --tail=200 app
docker compose logs --tail=200 temporal-worker-blue
docker compose logs --tail=200 caddy
```

输出日志前必须检查并移除密钥、用户内容、Prompt 和私人媒体地址。

## 备份范围

升级前必须一并备份：

- MySQL 数据库
- MinIO 数据卷
- Compose `data` 卷
- 持久化的 Codex runtime 主机目录
- `.env`
- Caddy `caddy_data` 与 `caddy_config` 卷

备份属于敏感数据，不上传 GitHub。

## 升级原则

1. 阅读目标 Release 迁移说明。
2. 完成备份并记录当前镜像 digest。
3. 使用空闲 Worker slot 部署新版本并执行 promote。
4. Web 切换后验证健康和任务状态。
5. 旧 Worker 完全 drained 后才能 retire。
6. 禁止以 `docker compose down -v` 作为升级步骤。

## 回滚原则

恢复上一版本镜像 digest、`.env` 和完整一致的数据备份。不得只恢复数据库或只恢复 MinIO。
