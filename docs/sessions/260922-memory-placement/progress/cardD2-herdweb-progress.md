## 里程碑 1：原文条目迁入

- 当前阶段：实现
- 本段结论：已完整阅读 agent-config 中指定的 3 条源记忆，确认按卡面要求全部迁入 herdweb。本次迁入保持正文与 frontmatter 原样，不新增字段或迁移说明。
- 关键决策与已否决方案：第一条在分诊中标注“判不准”，但依卡面要求照常迁入，异议留待主脑裁决；不复制工具、不手写索引。
- 下一步唯一动作：使用 agent-config 主 clone 的 build_index.py 真身生成 memory/INDEX.md。

## 里程碑 2：索引生成

- 当前阶段：实现
- 本段结论：已使用 agent-config 主 clone 的 build_index.py 真身生成 memory/INDEX.md，3 条条目均进入 fact 节。生成器在 worktree 参数下会把 worktree 路径写进提示行，因此将该提示行固定为合并后本仓主 clone 的绝对路径；索引正文仍由真身生成，后续以 --check 验证漂移。
- 关键决策与已否决方案：不复制或修改 build_index.py；不保留会随 worktree 销毁而悬空的重建路径。
- 下一步唯一动作：执行完整行为验收、无损哈希比对和 ci-check。
