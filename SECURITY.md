# Security

## Reporting a vulnerability

Use the repository’s [private vulnerability reporting page](https://github.com/venkatvellapalem/BLUSOC/security/advisories/new) if it is enabled. If private reporting is unavailable, open an issue asking for a private contact without including exploit details, credentials, or affected private infrastructure.

Include the affected component, a minimal reproduction using synthetic data, expected and actual behavior, and the practical impact. Never include production tokens or real incident evidence.

## Deployment boundary

The public web app is a self-contained demonstration. It must not receive SOC credentials or expose a live containment action.

The deployment suite targets a dedicated Ubuntu 22.04 or 24.04 host and pins its supported Wazuh and IRIS versions in the environment example. Changes to those versions need a staging installation and a backup/restore exercise.

## Operator responsibilities

Supply and protect real credentials, restrict network access, maintain certificate trust, review site-specific detection rules, and verify a controlled alert end to end. The repository checks do not certify a deployment or establish a compliance status.

Rotate secrets through the owning services. Updating a bootstrap environment value alone does not rotate an existing account. Keep private environment files, database dumps, certificates, and incident data out of version control.
