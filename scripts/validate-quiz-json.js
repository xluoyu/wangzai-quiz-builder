#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const file = process.argv[2];

if (!file) {
  console.error("用法：node validate-quiz-json.js <输出-json-路径>");
  process.exit(1);
}

let data;

try {
  data = JSON.parse(fs.readFileSync(path.resolve(file), "utf8"));
} catch (error) {
  console.error(`JSON 无效：${error.message}`);
  process.exit(1);
}

const errors = [];
const requiredTopLevel = ["meta", "dimensions", "normalization", "questions", "results", "references"];

for (const key of requiredTopLevel) {
  if (!data[key]) errors.push(`缺少顶层字段：${key}`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const dimensionKeys = Object.keys(data.dimensions);
const optionCount = data.meta.optionCountPerQuestion;
const expectedQuestionCount = data.meta.questionCount;

if (dimensionKeys.length < 4 || dimensionKeys.length > 7) {
  errors.push("dimensions 必须包含 4-7 个维度");
}

if (!Number.isInteger(expectedQuestionCount) || expectedQuestionCount !== data.questions.length) {
  errors.push("meta.questionCount 必须等于 questions.length");
}

if (!Number.isInteger(optionCount) || optionCount < 2) {
  errors.push("meta.optionCountPerQuestion 必须是大于等于 2 的整数");
}

if (typeof data.meta.disclaimer !== "string" || !/entertainment|娱乐/i.test(data.meta.disclaimer)) {
  errors.push("meta.disclaimer 必须明确说明仅供娱乐");
}

const actualMax = Object.fromEntries(dimensionKeys.map((key) => [key, 0]));

for (const question of data.questions) {
  if (!question.id || !question.prompt) errors.push("每道题都需要 id 和 prompt");
  if (!Array.isArray(question.options) || question.options.length !== optionCount) {
    errors.push(`${question.id || "未知题目"}：应有 ${optionCount} 个选项`);
    continue;
  }

  for (const option of question.options) {
    const scoreKeys = Object.keys(option.scores || {});
    if (!option.id || !option.text) errors.push(`${question.id}：每个选项都需要 id 和 text`);
    if (scoreKeys.length < 2 || scoreKeys.length > 3 || !scoreKeys.every((key) => dimensionKeys.includes(key))) {
      errors.push(`${question.id}：每个选项必须对 2-3 个已定义维度计分`);
    }
    if (!Object.values(option.scores || {}).every((value) => Number.isInteger(value) && value >= 0 && value <= 5)) {
      errors.push(`${question.id}：计分必须是 0-5 的整数`);
    }
  }

  for (const key of dimensionKeys) {
    actualMax[key] += Math.max(...question.options.map((option) => option.scores?.[key] || 0));
  }
}

for (const key of dimensionKeys) {
  if (data.normalization.maxRawScore?.[key] !== actualMax[key]) {
    errors.push(`normalization.maxRawScore.${key} 必须等于 ${actualMax[key]}`);
  }
}

const weights = data.meta.resultMatching?.dimensionWeights || {};

if (Object.keys(weights).sort().join("|") !== dimensionKeys.slice().sort().join("|")) {
  errors.push("resultMatching.dimensionWeights 必须与 dimensions 的键名完全一致");
}

if (!Object.values(weights).every((value) => typeof value === "number" && value > 0)) {
  errors.push("resultMatching.dimensionWeights 必须都是正数");
}

for (const result of data.results) {
  const requiredResultFields = ["id", "title", "summary", "whyMatched", "strengths", "pitfalls", "strategyTip", "toneLine"];
  if (!requiredResultFields.every((key) => result[key])) {
    errors.push(`${result.id || "未知结果"}：缺少必需的结果内容`);
  }
  if (Object.keys(result.targetProfile || {}).sort().join("|") !== dimensionKeys.slice().sort().join("|")) {
    errors.push(`${result.id || "未知结果"}：targetProfile 必须与 dimensions 的键名完全一致`);
  }
  if (!Object.values(result.targetProfile || {}).every((value) => Number.isInteger(value) && value >= 0 && value <= 100)) {
    errors.push(`${result.id || "未知结果"}：targetProfile 的数值必须是 0-100 的整数`);
  }
}

if (!Array.isArray(data.references) || data.references.length < 3) {
  errors.push("references 至少需要 3 个来源");
} else if (!data.references.every((source) => source.label && source.url && source.usedFor)) {
  errors.push("每个来源都需要 label、url 和 usedFor");
}

if (errors.length) {
  console.error(`测评 JSON 无效：\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

console.log(`校验通过：${data.questions.length} 道题，${data.results.length} 个结果，${dimensionKeys.length} 个维度`);
