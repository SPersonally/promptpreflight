# Security policy

## Reporting a vulnerability

Please report security issues privately through GitHub's **Security → Advisories → Report a vulnerability** feature if it is available for this repository.

Do not include real customer data, active API tokens, private keys, or raw sensitive prompt contents in a public GitHub issue.

If a token was accidentally disclosed in a public issue or commit, revoke it immediately; deleting a message or commit alone does not invalidate a leaked credential.

## Threat model

PromptPreflight is a client-side, best-effort redaction aid for text destined for an AI assistant. It does not guarantee that its output is safe or anonymous.

In scope:

- Recognizing the documented token and personal-data patterns.
- Avoiding network/API calls from the browser application after the page is loaded.
- Avoiding persistence of user input in cookies or localStorage.
- Rendering all user-controlled text through DOM textContent or textarea values.
- Creating sanitized copies without overwriting source files in the CLI.

Out of scope:

- Secret formats not covered by the detection rules.
- Adversarially obfuscated, encoded, or split secrets.
- Malicious browser extensions or compromised devices.
- Compromised hosting, DNS, or software supply chains.
- Data already sent to another service.
- Legal or regulatory compliance guarantees.

For high-risk material, combine this tool with organizational DLP policies, secret scanning, access controls, and manual review.
