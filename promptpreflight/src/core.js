/**
 * PromptPreflight: deterministic sensitive-data detection for AI prompts.
 *
 * No network calls, telemetry, external dependencies, or persistence.
 * This is a best-effort detector, not a proof that a prompt is safe to share.
 */

function validChineseId(value) {
  if (!/^[1-9]\d{5}(?:18|19|20)\d{2}\d{2}\d{2}\d{3}[\dXx]$/.test(value)) {
    return false;
  }
  const year = Number(value.slice(6, 10));
  const month = Number(value.slice(10, 12));
  const day = Number(value.slice(12, 14));
  const birthday = new Date(Date.UTC(year, month - 1, day));
  if (birthday.getUTCFullYear() !== year ||
      birthday.getUTCMonth() !== month - 1 ||
      birthday.getUTCDate() !== day) {
    return false;
  }
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const check = "10X98765432";
  const checksum = weights.reduce((sum, weight, i) => {
    return sum + Number(value[i]) * weight;
  }, 0);
  return check[checksum % 11] === value[17].toUpperCase();
}

function validIPv4(value) {
  return value.split(".").every((part) => Number(part) <= 255);
}

/** The order is also the default order shown in the browser UI. */
export const RULES = Object.freeze([
  {
    id: "private_keys",
    label: "Private key blocks",
    labelZh: "私钥文本",
    severity: "critical",
    pattern: /-----BEGIN (?:(?:RSA|EC|OPENSSH|DSA|ENCRYPTED) )?PRIVATE KEY-----[\s\S]{0,32768}?-----END (?:(?:RSA|EC|OPENSSH|DSA|ENCRYPTED) )?PRIVATE KEY-----/g,
    priority: 100
  },
  {
    id: "api_keys",
    label: "Known API and access tokens",
    labelZh: "API 密钥与访问令牌",
    severity: "critical",
    pattern: /\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{20,}|github_pat_[A-Za-z0-9_]{30,}|gh[pousr]_[A-Za-z0-9]{30,}|(?:AKIA|ASIA)[A-Z0-9]{16}|AIza[A-Za-z0-9_-]{35}|sk_(?:live|test)_[A-Za-z0-9]{16,})\b/g,
    priority: 90
  },
  {
    id: "jwt",
    label: "JWT tokens",
    labelZh: "JWT 身份令牌",
    severity: "critical",
    pattern: /\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g,
    priority: 80
  },
  {
    id: "url_credentials",
    label: "Credentials in URLs",
    labelZh: "URL 中的账号密码",
    severity: "critical",
    pattern: /https?:\/\/[^\s/@:]{1,128}:[^\s/@]{1,128}@[A-Za-z0-9.-]+(?::\d{2,5})?/g,
    priority: 75
  },
  {
    id: "assigned_secrets",
    label: "Passwords and secrets in assignments",
    labelZh: "变量中的密码与密钥",
    severity: "high",
    pattern: /\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|password|private[_-]?key|secret)\s*[:=]\s*(?:"([^"\r\n]{8,})"|'([^'\r\n]{8,})'|([A-Za-z0-9._~+/-]{8,}))/gi,
    valueGroup: true,
    priority: 70
  },
  {
    id: "cn_ids",
    label: "Chinese national ID numbers",
    labelZh: "中国居民身份证号",
    severity: "high",
    pattern: /(?<!\d)[1-9]\d{5}(?:18|19|20)\d{2}\d{4}\d{3}[\dXx](?!\d)/g,
    validate: validChineseId,
    priority: 50
  },
  {
    id: "emails",
    label: "Email addresses",
    labelZh: "邮箱地址",
    severity: "medium",
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    priority: 40
  },
  {
    id: "phones",
    label: "Mainland China mobile numbers",
    labelZh: "中国大陆手机号",
    severity: "medium",
    pattern: /(?<!\d)(?:\+?86[\s-]?)?1[3-9]\d{9}(?!\d)/g,
    priority: 35
  },
  {
    id: "wallets",
    label: "EVM wallet addresses",
    labelZh: "EVM 钱包地址",
    severity: "medium",
    pattern: /\b0x[a-fA-F0-9]{40}\b/g,
    priority: 30
  },
  {
    id: "ip_addresses",
    label: "IPv4 addresses",
    labelZh: "IPv4 地址",
    severity: "low",
    pattern: /(?<![\d.])(?:\d{1,3}\.){3}\d{1,3}(?![\d.])/g,
    validate: validIPv4,
    priority: 20
  }
]);

const RULE_BY_ID = new Map(RULES.map((rule) => [rule.id, rule]));
export const RULE_IDS = Object.freeze(RULES.map((rule) => rule.id));

function normaliseCustomTerms(customTerms) {
  if (!Array.isArray(customTerms)) return [];
  return [...new Set(customTerms
    .filter((value) => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => value.length >= 3 && value.length <= 128))].slice(0, 40);
}

function collectCandidates(text, enabled, customTerms) {
  const candidates = [];
  for (const rule of RULES) {
    if (!enabled.has(rule.id)) continue;
    for (const match of text.matchAll(rule.pattern)) {
      let value = match[0];
      let start = match.index;
      if (rule.valueGroup) {
        value = match[1] || match[2] || match[3] || "";
        start += match[0].lastIndexOf(value);
      }
      if (!value || (rule.validate && !rule.validate(value))) continue;
      candidates.push({
        id: rule.id,
        start,
        end: start + value.length,
        value,
        priority: rule.priority
      });
    }
  }

  if (enabled.has("custom")) {
    for (const term of customTerms) {
      let at = 0;
      while ((at = text.indexOf(term, at)) !== -1) {
        candidates.push({
          id: "custom",
          start: at,
          end: at + term.length,
          value: term,
          priority: 110
        });
        at += term.length;
      }
    }
  }
  return candidates;
}

function selectNonOverlapping(candidates, text) {
  // Merge overlapping spans to avoid accidentally exposing parts of a secret.
  // The sort plus a linear scan keeps processing bounded on long text.
  const ordered = candidates.sort((a, b) => a.start - b.start || b.end - a.end);
  const chosen = [];
  for (const candidate of ordered) {
    const last = chosen.at(-1);
    if (!last || candidate.start >= last.end) {
      chosen.push({ ...candidate });
      continue;
    }
    last.end = Math.max(last.end, candidate.end);
    if (candidate.priority > last.priority) {
      last.id = candidate.id;
      last.priority = candidate.priority;
    }
  }
  for (const item of chosen) {
    item.value = text.slice(item.start, item.end);
  }
  return chosen;
}

function displayLabel(ruleId, language) {
  if (ruleId === "custom") {
    return language === "zh" ? "自定义敏感词" : "Custom phrases";
  }
  const rule = RULE_BY_ID.get(ruleId);
  return language === "zh" ? rule.labelZh : rule.label;
}

export function sanitize(text, options = {}) {
  if (typeof text !== "string") {
    throw new TypeError("Input must be a string.");
  }
  const enabled = options.enabledRules === undefined
    ? new Set([...RULE_IDS, "custom"])
    : new Set(options.enabledRules);
  const language = options.language === "zh" ? "zh" : "en";
  const customTerms = normaliseCustomTerms(options.customTerms);
  const matches = selectNonOverlapping(collectCandidates(text, enabled, customTerms), text);

  const byType = new Map();
  const replacements = new Map();
  const typeCounts = new Map();
  const output = [];
  let cursor = 0;

  for (const match of matches) {
    const mapKey = match.id + "\u0000" + match.value;
    let placeholder = replacements.get(mapKey);
    if (!placeholder) {
      const next = (typeCounts.get(match.id) || 0) + 1;
      typeCounts.set(match.id, next);
      placeholder = "[" + match.id.toUpperCase() + "_" + next + "]";
      replacements.set(mapKey, placeholder);
    }
    output.push(text.slice(cursor, match.start), placeholder);
    cursor = match.end;
    byType.set(match.id, (byType.get(match.id) || 0) + 1);
  }
  output.push(text.slice(cursor));

  const findings = [...byType].map(([id, count]) => ({
    id,
    label: displayLabel(id, language),
    severity: RULE_BY_ID.get(id)?.severity || "high",
    count
  }));
  findings.sort((a, b) =>
    (RULE_BY_ID.get(b.id)?.priority || 110) -
    (RULE_BY_ID.get(a.id)?.priority || 110)
  );

  return {
    sanitized: output.join(""),
    findings,
    total: matches.length,
    distinct: replacements.size,
    inputLength: text.length
  };
}
