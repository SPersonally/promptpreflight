import { RULES, sanitize } from "./src/core.js";

const copy = {
  en: {
    localBadge: "Local processing",
    github: "GitHub",
    eyebrow: "OPEN SOURCE · PRIVACY FIRST",
    title: "Think before you prompt.",
    subtitle: "Catch and mask credentials, personal information, and wallet addresses before sharing text with AI tools.",
    featureOne: "✓ No uploads",
    featureTwo: "✓ No API keys",
    featureThree: "✓ No tracking",
    stepOne: "01 / INPUT",
    inputTitle: "Your original prompt",
    sample: "Load example",
    clear: "Clear all",
    upload: "Import .txt / .md",
    stepTwo: "02 / OUTPUT",
    outputTitle: "Safer to share",
    waiting: "Waiting for input",
    download: "Download",
    copy: "Copy safe text",
    neverPerfect: "Always review before sharing.",
    stepThree: "03 / REVIEW",
    reviewTitle: "Privacy findings",
    reviewHint: "Counts only. Detected values are never listed here.",
    empty: "Paste a prompt to start the preflight.",
    noMatch: "No supported patterns detected. Manual review is still essential.",
    stepFour: "04 / CONTROL",
    settingsTitle: "Detection rules",
    settingsHint: "Choose what to mask. Changes apply instantly.",
    customTitle: "Custom words or company names",
    customHint: "One phrase per line",
    limitTitle: "A useful first check, not a guarantee.",
    limitBody: "Pattern-based detection cannot find every secret, and some normal text may be flagged. Review the output manually. For high-risk data, use additional security controls.",
    footerLeft: "Open source · MIT license · Works without an AI account",
    placeholderIn: "Paste the text you are about to send to an AI assistant...",
    placeholderOut: "The sanitized version will appear here.",
    placeholderCustom: "Project Codename\nInternal Company",
    characters: "characters",
    masked: "Masked",
    noPatterns: "No patterns found",
    severityCritical: "critical",
    severityHigh: "high",
    severityMedium: "medium",
    severityLow: "low",
    copied: "Sanitized text copied.",
    copyError: "Clipboard unavailable. Select and copy the output manually.",
    downloaded: "Download prepared.",
    fileError: "Select a .txt or .md file smaller than 500 KB."
  },
  zh: {
    localBadge: "仅在本地处理",
    github: "GitHub",
    eyebrow: "开源工具 · 隐私优先",
    title: "发给 AI 前，先检查一下。",
    subtitle: "在复制内容给 ChatGPT、Claude 等 AI 工具之前，自动识别并隐藏密钥、个人信息、钱包地址等敏感内容。",
    featureOne: "✓ 无内容上传",
    featureTwo: "✓ 无需 API Key",
    featureThree: "✓ 不追踪",
    stepOne: "01 / 输入",
    inputTitle: "原始提示词",
    sample: "载入示例",
    clear: "清空",
    upload: "导入 .txt / .md",
    stepTwo: "02 / 输出",
    outputTitle: "脱敏后的内容",
    waiting: "等待输入",
    download: "下载",
    copy: "复制脱敏内容",
    neverPerfect: "分享之前请再次人工检查。",
    stepThree: "03 / 检查报告",
    reviewTitle: "敏感信息检测",
    reviewHint: "只显示类别和数量，不展示检测到的原始敏感值。",
    empty: "粘贴一段文字，开始隐私检查。",
    noMatch: "未匹配到内置规则，但仍需要人工检查。",
    stepFour: "04 / 自定义",
    settingsTitle: "检测规则",
    settingsHint: "可以选择要隐藏的类型，修改后立即生效。",
    customTitle: "自定义敏感词或公司名称",
    customHint: "每行一个词",
    limitTitle: "它只是第一道检查，不保证万无一失。",
    limitBody: "基于规则的检测不可能识别所有秘密，也可能误报正常文本。分享前请人工确认；高风险内容需要额外的安全保护。",
    footerLeft: "开源 · MIT 许可证 · 不需要 AI 账号",
    placeholderIn: "粘贴准备发送给 AI 的文字……",
    placeholderOut: "脱敏结果会出现在这里。",
    placeholderCustom: "内部项目代号\n公司名称",
    characters: "字",
    masked: "已隐藏",
    noPatterns: "未发现匹配项",
    severityCritical: "严重",
    severityHigh: "高",
    severityMedium: "中",
    severityLow: "低",
    copied: "脱敏内容已复制。",
    copyError: "浏览器不允许自动复制，请手动选中右侧内容复制。",
    downloaded: "已准备下载文件。",
    fileError: "请选择小于 500KB 的 .txt 或 .md 文件。"
  }
};

const $ = (id) => document.getElementById(id);
const source = $("source");
const output = $("output");
const custom = $("custom");
const ruleElements = new Map();
let language = navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
let currentResult = sanitize("");
let toastTimer;
let debounceTimer;

function t(key) {
  return copy[language][key] || key;
}

function showToast(message) {
  $("toast").textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $("toast").textContent = ""; }, 4200);
}

function renderRules() {
  const container = $("rules");
  for (const rule of RULES) {
    const label = document.createElement("label");
    label.className = "rule-item";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = true;
    input.addEventListener("change", run);
    const name = document.createElement("span");
    label.append(input, name);
    container.append(label);
    ruleElements.set(rule.id, { input, name, rule });
  }
}

function renderTranslations() {
  document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  document.title = language === "zh"
    ? "PromptPreflight — 发给 AI 前，先检查隐私"
    : "PromptPreflight — privacy check before AI";
  for (const node of document.querySelectorAll("[data-i18n]")) {
    node.textContent = t(node.dataset.i18n);
  }
  source.placeholder = t("placeholderIn");
  output.placeholder = t("placeholderOut");
  custom.placeholder = t("placeholderCustom");
  $("language").setAttribute("aria-label", language === "zh" ? "Switch to English" : "切换为中文");
  for (const { name, rule } of ruleElements.values()) {
    name.textContent = language === "zh" ? rule.labelZh : rule.label;
  }
}

function renderFindings() {
  const container = $("findings");
  container.replaceChildren();
  if (!source.value) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = t("empty");
    container.append(empty);
  } else if (!currentResult.total) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = t("noMatch");
    container.append(empty);
  } else {
    for (const finding of currentResult.findings) {
      const item = document.createElement("div");
      item.className = "finding";
      const left = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = finding.label;
      const severity = document.createElement("span");
      severity.className = "severity " + finding.severity;
      const word = finding.severity[0].toUpperCase() + finding.severity.slice(1);
      severity.textContent = t("severity" + word);
      left.append(title, severity);
      const count = document.createElement("span");
      count.className = "finding-count";
      count.textContent = String(finding.count);
      item.append(left, count);
      container.append(item);
    }
  }
  $("count").textContent = String(currentResult.total);
}

function run() {
  const enabledRules = [...ruleElements]
    .filter(([, element]) => element.input.checked)
    .map(([id]) => id);
  enabledRules.push("custom");
  const customTerms = custom.value.split(/\r?\n/);
  currentResult = sanitize(source.value, { enabledRules, customTerms, language });
  output.value = source.value ? currentResult.sanitized : "";
  $("input-count").textContent = source.value.length.toLocaleString() + " " + t("characters");
  const badge = $("result-badge");
  badge.className = "result-badge";
  if (!source.value) badge.textContent = t("waiting");
  else if (currentResult.total > 0) {
    badge.classList.add("detected");
    badge.textContent = t("masked") + " " + currentResult.total;
  } else {
    badge.classList.add("clean");
    badge.textContent = t("noPatterns");
  }
  $("copy").disabled = !source.value;
  $("download").disabled = !source.value;
  renderFindings();
}

function scheduleRun() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(run, 120);
}

renderRules();
renderTranslations();
run();

source.addEventListener("input", scheduleRun);
custom.addEventListener("input", scheduleRun);
$("language").addEventListener("click", () => {
  language = language === "zh" ? "en" : "zh";
  renderTranslations();
  run();
});
$("clear").addEventListener("click", () => {
  source.value = "";
  custom.value = "";
  for (const entry of ruleElements.values()) entry.input.checked = true;
  run();
  source.focus();
});
$("sample").addEventListener("click", () => {
  source.value = language === "zh"
    ? "请帮我总结这封邮件，但不要透露我的个人信息。\n邮箱：alex@example.com\n手机号：13800138000\n内部服务密码：password=illustration12345\n我的办公网络地址是 192.168.1.8。"
    : "Please summarize this customer-support note for an AI assistant.\nEmail: alex@example.com\nPhone: 13800138000\nInternal service password: password=illustration12345\nOffice IP: 192.168.1.8.";
  run();
  source.focus();
});
$("copy").addEventListener("click", async () => {
  run();
  try {
    await navigator.clipboard.writeText(currentResult.sanitized);
    showToast(t("copied"));
  } catch {
    output.focus();
    output.select();
    showToast(t("copyError"));
  }
});
$("download").addEventListener("click", () => {
  run();
  const blob = new Blob([currentResult.sanitized], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "promptpreflight-sanitized.txt";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast(t("downloaded"));
});
$("upload").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const validExtension = /\.(?:txt|md)$/i.test(file.name);
  if (!validExtension || file.size > 500000) {
    showToast(t("fileError"));
  } else {
    const contents = await file.text();
    if (contents.length <= source.maxLength) {
      source.value = contents;
      run();
    } else showToast(t("fileError"));
  }
  event.target.value = "";
});
