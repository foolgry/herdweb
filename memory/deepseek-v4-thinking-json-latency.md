---
name: deepseek-v4-thinking-json-latency
description: deepseek-v4-flash 默认思考；response_format=json_object 推理暴涨4.6k token/50s；需 thinking.type=disabled
kind: fact
valid_as_of: 2026-09-02
origin: 0d085ed1-4f6f-417a-8876-26b463531546
---

2026-09-02 在本机实测得到（原记录来自 Claude Code 自动记忆，2026-09-04 迁入本目录）。

`deepseek-v4-flash` 是混合思考模型，**默认思考开着**。2026-09-02 用真实 prompt（504 B）+ 真实输入包（2785 B）实测：

| 请求形状 | 耗时 | 推理 token | 正文 token |
|---|---|---|---|
| 默认思考 + `response_format: {"type":"json_object"}` | **50.3 s** | 4587 | 47 |
| 默认思考，无 response_format | 11.8 s | 977 | 43 |
| `"thinking": {"type": "disabled"}` + json_object | **1.75 s** | 0 | 46，JSON 合法 |
| `"reasoning_effort": "none"` + json_object | 1.8 s | 0 | 46 |

结论：**JSON 输出模式会让 v4-flash 的隐藏推理暴涨一个量级**；同一模型在短输入（asking 判定）上只推理 ~140 token、3 秒，所以单看短样本完全测不出来。生产里单渠道超时 30 秒，25–50 秒的抖动就是「时而成功、时而 `read operation timed out` 退回旧文案」的来源。

**How to apply:**
- **实测范围**：本条只在 `deepseek-v4-flash` 上、用一份 504 B prompt + 2785 B 输入包测过。同系列其他型号、其他输入形状未验证——照搬前先自己量一次 `usage.completion_tokens_details.reasoning_tokens`。
- 在已验证的调用上，请求体显式带 `"thinking": {"type": "disabled"}`（官方规范写法；`reasoning_effort: "none"` 也生效）。
- 判断模型调用慢，先看 `usage.completion_tokens_details.reasoning_tokens`，不要先怀疑网络或输入长度。
- 用**真实 prompt + 真实输入包**测延迟；合成短文本会低估一个量级。
- 关思考对**本用例**（同输入对比）的摘要质量无影响；这是单次对比结论，换用例要重新对比，不要当成「关思考总是安全」。

相关：agent-config#1411、归档 notify-governance-design
