---
name: herdweb-prod-is-separate-checkout
description: herdweb 生产 checkout ~/.local/share/herdweb；合并≠上线；超白名单字段 400 且不重试
kind: fact
valid_as_of: 2026-09-04
origin: 553a4b9e-6c4c-41fa-b6cd-bcc024fa78ed
verify:
  kind: file_contains
  path: /home/zlx/.config/systemd/user/herdweb.service
  needle: 'WorkingDirectory=/home/zlx/.local/share/herdweb'
---

# herdweb 生产是独立 checkout，合并 ≠ 上线

## 事实

生产 herdweb **不是**从 `~/projects/oss/herdweb` 跑的。它是一份独立 checkout：

- 路径：`/home/zlx/.local/share/herdweb`
- 由 `herdweb.service`（user unit）直接 `tsx cli.ts` **从源码运行**，无构建产物中转
- 上线动作是 `git pull` + `systemctl --user restart herdweb.service`

所以**把改动合并进 herdweb 主干，生产端不会自动生效**。
2026-09-04 实测：主干已合并 `level` 字段白名单后，该 checkout 仍停在 6 个 commit 之前，
其 `src/notify/events.ts` 里 `act_soon` 命中 0 处。

## 为什么这条值得记：失败形态是静默的

herdweb 的 `parseNotifyEvent` 是 **fail-closed 白名单**（`ALLOWED_FIELDS`）：
出现未知字段直接 `throw new NotifyEventError('unknown field: …', 400)`，**整条事件拒收**。

而生产侧的生产者（agent-config 的 `delegate_badge_notify.post_notify_event`）
**对 4xx 不重试、只写 journal**。两者叠加的表现是：

> 手机上「最近没事发生」。

没有告警、没有报错弹出、通知面板也不会显示失败——这是本仓 P1 红线里
「静默出错（结果错但不报错）」的典型形态。

## 操作约束

**新增任何出站字段时，顺序必须是「先部署收端，再让发端发出」**，不能反过来。

发前复核三条（任一不满足就停手）：

```bash
grep -c "<新字段或新取值>" /home/zlx/.local/share/herdweb/src/notify/events.ts   # 期望 ≥1
git -C /home/zlx/.local/share/herdweb rev-list --count HEAD..origin/main        # 期望 0
systemctl --user show herdweb.service -p ActiveEnterTimestamp --value           # 期望晚于部署时刻
```

canary 验证用**无效的 `id`** 发探针，这样请求会在字段校验通过后、投递之前被挡下，
不会真的推到手机上：合法取值应返回 `400 id must be a string`（说明字段被接受了），
非法取值应返回 `400 invalid <字段>`。

注意 `kind=test` **不是**演习——它跳过去重且照常投递到手机（见
[herdweb-kind-test-really-pushes](herdweb-kind-test-really-pushes.md)），不要拿它做探针。

## 跨仓契约的另一半

agent-config 侧 `scripts/herdr/lead_stop_watch.py` 的 `HERDWEB_ALLOWED_FIELDS`
**必须是** herdweb `ALLOWED_FIELDS` 的子集；枚举型字段（如 `level`）的字面量
两侧必须逐字节一致。本仓测试里这些字面量是**硬编码**断言而非引用常量——
引用会让两边同时改错时测试仍绿。
