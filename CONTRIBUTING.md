# Contributing

Changes should make the project easier to understand, run, or maintain. Keep claims tied to code and evidence.

## Development

Use Node.js 24, Python 3.10+, and Bash. Install dependencies from the repository root:

```bash
npm ci
python -m venv .venv
```

Activate it with `source .venv/bin/activate` on Linux/macOS, or `.venv\Scripts\Activate.ps1` in Windows PowerShell. Then run:

```bash
python -m pip install -r requirements-dev.txt
npm run dev
```

## Before opening a pull request

Run `npm run verify:all`. For a visual change, also inspect desktop and mobile layouts, keyboard navigation, reduced motion, and the relevant demo interactions.

For changes to `data/`, update the sanitized source first, then run `npm run data:sync`. Keep private infrastructure identifiers and credentials out of fixtures, screenshots, and logs.

For deployment changes, add a behavioral test for the failure or edge case you changed. Run a dry plan and test the resulting configuration on a disposable supported Ubuntu host before describing a live install as verified.

## Pull requests

Explain the concrete problem, the resulting behavior, and the checks you ran. Include a screenshot for visible UI changes and document any runtime or configuration migration.

Keep the showcase’s illustrated workflow distinct from provisioned services. Label simulated data and model outputs. Do not add unsupported customer, capacity, availability, or security claims.

## Reporting bugs

Include the command or route, expected behavior, actual behavior, and relevant versions. Redact tokens, credentials, private hostnames, and sensitive event data.

Use [SECURITY.md](SECURITY.md) for vulnerability reports.
