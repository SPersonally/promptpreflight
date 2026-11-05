import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const cli = resolve("bin/cli.mjs");

function run(args, input = "") {
  return spawnSync(process.execPath, [cli, ...args], {
    input, encoding: "utf8", cwd: resolve(".")
  });
}

test("CLI supports piping without showing original matching values", () => {
  const result = run([], "alice@example.com");
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "[EMAILS_1]");
});

test("CLI --check exits 2 when a finding exists", () => {
  const result = run(["--check"], "alice@example.com");
  assert.equal(result.status, 2);
  assert.match(result.stdout, /emails: 1/);
  assert.ok(!result.stdout.includes("alice@example.com"));
});

test("CLI --check --json returns counts, never sensitive values", () => {
  const result = run(["--check", "--json"], "alice@example.com");
  assert.equal(result.status, 2);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.total, 1);
  assert.ok(!result.stdout.includes("alice@example.com"));
});

test("CLI can safely write a new file but refuses to overwrite it", async () => {
  const temp = await mkdtemp(join(tmpdir(), "promptpreflight-test-"));
  const input = join(temp, "input.txt");
  const output = join(temp, "output.txt");
  try {
    await writeFile(input, "alice@example.com", "utf8");
    const first = run(["--input", input, "--out", output]);
    assert.equal(first.status, 0, first.stderr);
    assert.equal(await readFile(output, "utf8"), "[EMAILS_1]");
    const second = run(["--input", input, "--out", output]);
    assert.equal(second.status, 1);
    assert.equal(await readFile(output, "utf8"), "[EMAILS_1]");
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test("CLI rejects writing directly over the input", async () => {
  const temp = await mkdtemp(join(tmpdir(), "promptpreflight-test-"));
  const input = join(temp, "input.txt");
  try {
    await writeFile(input, "do not change this", "utf8");
    const result = run(["--input", input, "--out", input]);
    assert.equal(result.status, 1);
    assert.equal(await readFile(input, "utf8"), "do not change this");
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
