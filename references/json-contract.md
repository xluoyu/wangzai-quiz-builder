# 前端测评 JSON 契约

每次生成数据文件时都使用此契约。可以添加面向展示的字段，但不可删除或重命名必需字段。

```json
{
  "meta": {
    "id": "topic-slug-quiz-v1",
    "title": "测评标题",
    "subtitle": "一句话引导文案",
    "disclaimer": "本测评仅供娱乐，不评估真实能力、人格、健康或未来结果。",
    "questionCount": 18,
    "optionCountPerQuestion": 4,
    "resultMatching": {
      "method": "weightedEuclideanDistance",
      "description": "归一化分数后选择距离最近的目标画像；距离相同时使用 priority 决定结果。",
      "dimensionWeights": {
        "exampleDimension": 1
      }
    }
  },
  "dimensions": {
    "exampleDimension": {
      "label": "维度名称",
      "description": "此维度代表的含义。"
    }
  },
  "normalization": {
    "formula": "round(rawScore / maxRawScore[dimension] * 100)",
    "clamp": [0, 100],
    "maxRawScore": {
      "exampleDimension": 42
    }
  },
  "questions": [
    {
      "id": "q01-example",
      "category": "可选分类",
      "prompt": "简洁的情境题",
      "scenario": "可选的背景信息",
      "options": [
        {
          "id": "a",
          "text": "一个合理的选择",
          "scores": {
            "exampleDimension": 4
          }
        }
      ]
    }
  ],
  "results": [
    {
      "id": "result-slug",
      "title": "结果标题",
      "priority": 1,
      "historicalScope": "用于历史或文化主题；其他主题可改用 contextNote。",
      "targetProfile": {
        "exampleDimension": 70
      },
      "summary": "结果概述。",
      "whyMatched": "画像匹配原因。",
      "strengths": ["一项具体优势。"],
      "pitfalls": ["一项建设性提醒。"],
      "strategyTip": "一条不带强制性的娱乐化建议。",
      "toneLine": "一句有记忆点的收尾。"
    }
  ],
  "references": [
    {
      "label": "来源标题",
      "url": "https://example.org/source",
      "usedFor": "该来源如何支撑事实背景。"
    }
  ]
}
```

## 必须满足的约束

- `meta.questionCount` 等于 `questions.length`。
- 每道题的选项数等于 `meta.optionCountPerQuestion`，默认是 4。
- 每个选项对 2-3 个已定义维度计分，每项分数为 0-5 的整数。
- `normalization.maxRawScore` 必须等于每个维度在所有题目中可选择的最高分之和。
- 每个结果的 `targetProfile` 键名必须与 `dimensions` 完全一致，数值必须为 0-100 的整数。
- `meta.resultMatching.dimensionWeights` 键名必须与 `dimensions` 完全一致，数值必须为正数。
- `references` 至少有 3 项，且每项都有非空的 `label`、`url` 和 `usedFor`。
