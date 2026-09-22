---
name: herdweb-kind-test-really-pushes
description: herdweb 的 kind=test 不是「演习」——它跳过去重且照常投递到手机，探针会真推送
kind: fact
valid_as_of: 2026-09-01
origin: 0d085ed1-4f6f-417a-8876-26b463531546
---

**`kind=test` 会真的推到手机。**herdweb `src/notify/service.ts` 实测（2026-09-01）：

- `service.ts:386` 是 `if (normalized.kind !== 'test')` 才做 `(targetId, id)` 去重
  ——即 `test` **跳过去重**，同 id 重发也照样投递；
- `service.ts:177` 对 `kind=test` 且 `id` 为空的事件自动编号；
- **没有任何「test 不投递」的分支**，`KIND_LABELS` 里 `test: '测试'` 就是给它准备的显示文案。

所以「用 kind=test 做探针就不会打扰用户」是错的，恰恰相反：test 是**最容易刷屏**的那个 kind。
2026-09-01 我据此写了 notify-selftest 的 canary，被 gate 主审抓成 finding；
自己手工验收时还对真实 herdweb 跑了 3 次 × 3 个生产端，给用户手机推了约 11 条噪声。

**要做不投递的形状探测**，可行路子是发一个**必定被收端拒绝**的哨兵，
从「拒绝理由是不是预期的那一种」反推形状是否被接受——既不投递又保住区分能力。

推论：任何「向生产收端打探针」的自检，先问一句**它会不会真的送达终端用户**，
再问它能不能验出东西。顺序反了就会造出一个持续刷屏的监控。

相关：notify-governance-design、（见 lesson 查重对照表 C 堆：persistent-display-false-positive-cost）、（见 lesson 查重对照表 C 堆：defense-must-work-in-its-own-scenario）
