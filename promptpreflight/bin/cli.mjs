#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { sanitize, RULE_IDS } from "../src/core.js";

const usage = [
  "PromptPreflight — privacy check before sending text to AI",
  "",
  "Usage:",
  "  node bin/cli.mjs --input draft.txt --out sanitized.txt",
  "  node bin/cli.mjs --input draft.txt --check",
  "  printf 'email alice@example.com' | node bin/cli.mjs",
  "",
  "Options:",
  "  -i, --input FILE      Read from FILE (default: stdin)",
  "  -o, --out FILE        Write sanitized text to a NEW file",
  "  --check               Print findings only; exit 2 when found",
  "  --json                With --check, print JSON counts (never raw values)",
  "  --disable RULE        Disable one built-in rule (repeatable)",
  "  --custom-file FILE    Text file with custom sensitive phrases (one per line)",
  "  --list-rules          List rule IDs",
  "  -h, --help            Show this help",
  "",
  "Output files are never overwritten. Do not use this as your only security review."
].join("\n");

function parseArgs(argv) {
  const args = {
    input: null, out: null, check: false, json: false,
    disabled: new Set(), customFile: null,
    help: false, listRules: false
  };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === "--help" || flag === "-h") args.help = true;
    else if (flag === "--list-rules") args.listRules = true;
    else if (flag === "--check") args.check = true;
    else if (flag === "--json") args.json = true;
    else if (["--input", "-i", "--out", "-o", "--disable", "--custom-file"].includes(flag)) {
      const value = argv[++i];
      if (!value || value.startsWith("--")) throw new Error("Missing value for " + flag);
      if (flag === "--input" || flag === "-i") args.input = value;
      if (flag === "--out" || flag === "-o") args.out = value;
      if (flag === "--disable") args.disabled.add(value);
      if (flag === "--custom-file") args.customFile = value;
    } else throw new Error("Unknown argument: " + flag);
  }
  if (args.json && !args.check) throw new Error("--json requires --check.");
  if (args.out && args.check) throw new Error("--out cannot be used with --check.");
  for (const id of args.disabled) {
    if (!RULE_IDS.includes(id)) throw new Error("Unknown rule: " + id);
  }
  if (args.input && args.out && resolve(args.input) === resolve(args.out)) {
    throw new Error("The output file must differ from the source file.");
  }
  return args;
}

async function readStdin() {
  if (process.stdin.isTTY) {
    throw new Error("Use --input FILE or pipe text into stdin.");
  }
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(usage + "\n");
    return;
  }
  if (args.listRules) {
    process.stdout.write(RULE_IDS.join("\n") + "\n");
    return;
  }
  const text = args.input && args.input !== "-"
    ? await readFile(args.input, "utf8")
    : await readStdin();
  if (text.includes("\u0000")) {
    throw new Error("This looks like a binary file; only UTF-8 text is supported.");
  }
  const enabledRules = RULE_IDS.filter((id) => !args.disabled.has(id));
  enabledRules.push("custom");
  const customTerms = args.customFile
    ? (await readFile(args.customFile, "utf8")).split(/\r?\n/)
    : [];
  const result = sanitize(text, { enabledRules, customTerms });

  if (args.check) {
    const report = {
      total: result.total,
      distinct: result.distinct,
      findings: result.findings.map(({ id, severity, count }) => ({ id, severity, count }))
    };
    if (args.json) process.stdout.write(JSON.stringify(report, null, 2) + "\n");
    else {
      process.stdout.write("Potentially sensitive matches: " + report.total + "\n");
      for (const item of report.findings) {
        process.stdout.write(" - " + item.id + ": " + item.count + "\n");
      }
    }
    if (result.total > 0) process.exitCode = 2;
    return;
  }
  if (args.out) {
    // wx: create-only; never overwrite an existing file containing user data.
    await writeFile(args.out, result.sanitized, { encoding: "utf8", flag: "wx", mode: 0o600 });
    process.stderr.write("Wrote sanitized text to " + args.out + "\n");
    process.stderr.write("Masked " + result.total + " potential sensitive values.\n");
  } else process.stdout.write(result.sanitized);
}

main().catch((error) => {
  process.stderr.write("Error: " + error.message + "\n");
  process.exitCode = 1;
});
