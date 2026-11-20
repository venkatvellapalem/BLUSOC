# Maintainer handoff

Start with [README.md](README.md), then use the component-specific guides:

| Area | Reference |
| --- | --- |
| Current architecture and boundaries | [docs/architecture.md](docs/architecture.md) |
| Website hosting | [docs/web-deployment.md](docs/web-deployment.md) |
| SOC installation and operations | [deployment/README.md](deployment/README.md) |
| Incident response | [docs/incident_response_playbook.md](docs/incident_response_playbook.md) |
| Contributions and validation | [CONTRIBUTING.md](CONTRIBUTING.md) |

The website is independent of the SOC stack and needs no secrets or database. The provisioned server uses a direct Wazuh-to-IRIS adapter; the wider n8n/Laya workflow is illustrated in the demos.

Run `npm run verify:all` before publishing changes. Run the deployer’s dry plan and test infrastructure changes on a disposable supported Ubuntu host. A passing static or mock test does not prove a live deployment.

Historical design and implementation notes under `docs/superpowers/` record earlier intent and may describe components that were not shipped. The current code and guides above take precedence.
