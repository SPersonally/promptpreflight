# Contributing to PromptPreflight

Thank you for making safer AI workflows easier to use.

## First steps

1. Open an issue explaining the problem, false positive, or desired feature.
2. Create a small branch with focused changes.
3. Add a test for every new detector or bug fix.
4. Run npm run check and npm test locally.
5. Open a pull request with the motivation and behavior change.

The project intentionally has no runtime dependencies and does not call remote AI APIs.
Please discuss any change that would introduce a backend, analytics, storage, or outbound requests before implementing it.

## Adding a detector

Add a new rule to src/core.js with:

- A unique ID and English/Chinese labels.
- A severity and a clear expected match format.
- A global regular expression with safe performance characteristics.
- Validation where syntax checks are not sufficient (e.g. checksums).
- Tests covering real-looking synthetic examples and false positives.

**Never commit real secrets, passwords, private keys, customer data, or other people's personal information as test fixtures.**

## Code of conduct

Be respectful. Assume positive intent, explain security concerns clearly, and be considerate of users new to programming.
