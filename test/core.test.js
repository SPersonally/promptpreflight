import test from "node:test";
import assert from "node:assert/strict";
import { sanitize, RULE_IDS } from "../src/core.js";

test("redacts email addresses and reuses one placeholder for repeated values", () => {
  const result = sanitize("Email alice@example.com; again alice@example.com.");
  assert.equal(result.total, 2);
  assert.equal(result.distinct, 1);
  assert.equal(result.sanitized, "Email [EMAILS_1]; again [EMAILS_1].");
});

test("detects recognizable API tokens without outputting the original value", () => {
  // Construct synthetic test data at runtime to avoid committing a full
  // token-shaped literal that could trigger GitHub secret-scanning alerts.
  const secret = "sk-proj-" + "AbCdEfGhIjKlMnOpQrStUvWxYz0123456";
  const result = sanitize("Token: " + secret);
  assert.equal(result.total, 1);
  assert.ok(!result.sanitized.includes(secret));
  assert.match(result.sanitized, /\[API_KEYS_1\]/);
});

test("masks only the value in a password assignment", () => {
  const result = sanitize("password=correct-horse-battery-staple");
  assert.equal(result.sanitized, "password=[ASSIGNED_SECRETS_1]");
});

test("masks credentials embedded in a URL", () => {
  const result = sanitize("db https://alice:secretpassword@db.example.com:5432");
  assert.equal(result.sanitized, "db [URL_CREDENTIALS_1]");
});

test("checks Chinese national ID checksum, not just shape", () => {
  const valid = sanitize("ID 11010519491231002X");
  assert.equal(valid.total, 1);
  assert.match(valid.sanitized, /\[CN_IDS_1\]/);
  const invalid = sanitize("ID 110105194912310021");
  assert.equal(invalid.total, 0);
});

test("avoids masking invalid IP addresses", () => {
  const result = sanitize("ip 192.168.1.8 and 999.123.1.9");
  assert.equal(result.total, 1);
  assert.equal(result.sanitized, "ip [IP_ADDRESSES_1] and 999.123.1.9");
});

test("detects mainland mobile numbers and EVM wallet addresses", () => {
  const result = sanitize("Phone 13800138000, wallet 0x1234567890abcdef1234567890ABCDEF12345678");
  assert.equal(result.total, 2);
  assert.match(result.sanitized, /\[PHONES_1\]/);
  assert.match(result.sanitized, /\[WALLETS_1\]/);
});

test("lets users disable built-in rules", () => {
  const enabledRules = RULE_IDS.filter((id) => id !== "emails");
  const result = sanitize("alice@example.com", { enabledRules });
  assert.equal(result.total, 0);
  assert.equal(result.sanitized, "alice@example.com");
});

test("allows literal custom phrases without treating special characters as regex", () => {
  const result = sanitize("Project A.B? is secret. A.B? is repeated.", {
    enabledRules: ["custom"],
    customTerms: ["A.B?"]
  });
  assert.equal(result.sanitized, "Project [CUSTOM_1] is secret. [CUSTOM_1] is repeated.");
});

test("merges overlapping matches so a secret suffix is not left visible", () => {
  const token = "sk-proj-" + "AbCdEfGhIjKlMnOpQrStUvWxYz0123456";
  const result = sanitize(token, { customTerms: [token.slice(0, 9)] });
  assert.equal(result.total, 1);
  assert.ok(!result.sanitized.includes(token.slice(9)));
});

test("handles many detections in a long prompt", () => {
  const text = "alice@example.com\n".repeat(2000);
  const result = sanitize(text);
  assert.equal(result.total, 2000);
  assert.equal(result.distinct, 1);
});

test("never leaks the original secret in the findings object", () => {
  const result = sanitize("Contact alice@example.com");
  assert.ok(!JSON.stringify(result.findings).includes("alice@example.com"));
});

test("handles PEM private-key blocks spanning multiple lines", () => {
  const secret = "-----BEGIN " + "PRIVATE KEY-----\nabcdef\n123456\n-----END " + "PRIVATE KEY-----";
  const result = sanitize("Please inspect:\n" + secret);
  assert.equal(result.total, 1);
  assert.ok(!result.sanitized.includes("abcdef"));
  assert.match(result.sanitized, /\[PRIVATE_KEYS_1\]/);
});

test("preserves ordinary text byte-for-byte when no patterns match", () => {
  const text = "请优化以下提示词：\n\n1. 明确角色。\n2. 输出表格。\n";
  assert.equal(sanitize(text).sanitized, text);
});

test("rejects non-string input", () => {
  assert.throws(() => sanitize(null), TypeError);
});
