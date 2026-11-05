# PromptPreflight

**A privacy preflight before you paste text into ChatGPT, Claude, Gemini, or another AI assistant.**

PromptPreflight is a small, open-source tool that finds common sensitive strings in an AI prompt and replaces them with consistent placeholders. It runs entirely in your browser, without accounts, uploads, analytics, API keys, or a backend. A dependency-free Node.js CLI is included for local workflows.

**[简体中文说明 / Chinese documentation](./README.zh-CN.md)**

## Why build this?

Developers paste logs, bug reports, database errors, documentation, and customer messages into AI assistants every day. Those snippets can accidentally contain access tokens, internal IPs, customer email addresses, or identifiers.

PromptPreflight offers a quick, local check before sharing. It is intentionally **not** an AI model or a substitute for security review: deterministic rules are transparent, fast, and work without sending the prompt to yet another third party.

## Features

| Feature | Details |
| --- | --- |
| Browser UI | Side-by-side input and sanitized output |
| Offline-friendly processing | All detection executes in the browser; no outbound API requests |
| Sensitive-data patterns | API keys, JWTs, password assignments, PEM private-key blocks, credential-bearing URLs, emails, Chinese mobile and ID numbers, EVM wallets, IPv4 |
| Consistent placeholders | Repeated identical values map to the same placeholder, e.g. [EMAILS_1] |
| Your own sensitive terms | Add project names, customers, or codenames (one phrase per line) |
| Flexible controls | Enable or disable individual detectors |
| Export | Copy safe text, download .txt, or import local .txt/.md |
| CLI | Scan or sanitize text files and stdin; machine-readable counts for CI |
| Internationalized | English and Simplified Chinese |
| Auditable | No runtime dependencies, MIT licensed, and covered by automated tests |

## Quick start: browser

Prerequisite: **Node.js 20 or newer**. No npm install is necessary.

~~~sh
git clone https://github.com/YOUR_USERNAME/promptpreflight.git
cd promptpreflight
npm start
~~~

Open **http://127.0.0.1:4173**. Paste a prompt, select which patterns to hide, and copy the sanitized result.

Alternatively, publish this repository through **GitHub Pages** (details below). Once the page is loaded, detection runs in the browser and does not send your entered text to a server.

## Quick start: command line

~~~sh
# From stdin; writes sanitized text to stdout
printf 'Contact alice@example.com' | node bin/cli.mjs

# Scan a local prompt; only counts are printed, not original values
node bin/cli.mjs --input draft.txt --check

# Get a JSON report of categories and counts for CI
node bin/cli.mjs --input draft.txt --check --json

# Save a sanitized copy WITHOUT overwriting the original
node bin/cli.mjs --input draft.txt --out cleaned.txt

# Disable certain rules
node bin/cli.mjs --input draft.txt --disable ip_addresses

# Read sensitive custom terms from a local file (one per line)
node bin/cli.mjs --input draft.txt --custom-file private-terms.txt
~~~

The check command returns exit code **0** for no matches, **2** for matches, and **1** for tool errors. JSON reports contain categories and counts, not matched secrets. Output files are intentionally create-only and never overwrite an existing file.

## What does a redaction look like?

**Input:**

~~~text
Summarize this customer ticket:
Customer: alice@example.com
Phone: 13800138000
Server IP: 192.168.1.8
Contact alice@example.com if more information is needed.
~~~

**Output:**

~~~text
Summarize this customer ticket:
Customer: [EMAILS_1]
Phone: [PHONES_1]
Server IP: [IP_ADDRESSES_1]
Contact [EMAILS_1] if more information is needed.
~~~

The original strings are **not** included in the findings summary.

## Publish your own demo with GitHub Pages

1. Make the repository **Public**.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select branch **main**, folder **/(root)**, and save.
5. Your demo will typically become available at:

   https://YOUR_USERNAME.github.io/promptpreflight/

The application files are already in the repository root. No framework, build command, or paid hosting service is required.

## Security model and limits

- No backend is used. All input handling, file reading, rule matching, and file export happen in the client. The page has a restrictive Content Security Policy, including connect-src 'none'.
- The code does **not** intentionally store prompts in localStorage, cookies, or browser analytics.
- Opening the hosted page still fetches the application code and styles from the host. This is different from uploading your input prompt; the prompt is not transmitted by application logic.
- Detectors are best-effort regular expressions and validation checks. Many secret formats are unsupported. False positives and false negatives are inevitable.
- Public addresses, IP addresses, and names may or may not be sensitive depending on your context.
- Browser extensions, compromised devices, and malicious modifications to a hosted page are outside this tool's protection.
- Do **not** rely on a "zero findings" result as proof that content is safe to share. Review sanitized text before sending it to an AI provider.
- Never post actual secret values in bug reports or demo screenshots. Rotate any credential that has already been exposed.

For details about reporting security issues, see [SECURITY.md](./SECURITY.md).

## Development

~~~sh
npm run check
npm test
~~~

The CI workflow checks syntax and runs all tests with Node.js.

## Repository layout

~~~text
promptpreflight/
├── index.html           Browser UI
├── app.js               Browser controller
├── styles.css           Responsive styles
├── src/core.js          Shared redaction/detection engine
├── bin/cli.mjs          Node.js command line interface
├── scripts/serve.mjs    Minimal local development server
├── test/                Automated tests
├── assets/logo.svg      Original project icon
└── .github/workflows/   CI
~~~

## Contribute

Issues, tests, documentation, language support, and carefully scoped detectors are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE). Feel free to fork and adapt.
