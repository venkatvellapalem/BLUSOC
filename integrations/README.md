# IRIS integrations

The Python adapter forwards Wazuh alerts to DFIR-IRIS. The status monitor reads IRIS alert changes and records an audit trail. They do not implement the n8n/Laya workflow illustrated by the website.

## Local test

Activate your Python virtual environment and install `requirements-dev.txt` from the repository root.

Start the local mock API in one terminal:

```bash
python integrations/docker/mock_iris_server.py 8000
```

It binds to loopback and uses in-memory state. It has no authentication and is intended only for local testing. The equivalent Docker sandbox is:

```bash
docker compose -f integrations/docker/docker-compose.yml up
```

In another terminal, inspect a transformed sample without sending it:

```bash
python integrations/custom-iris/custom-iris.py --test integrations/examples/wazuh-alert.json
```

Then submit it to the mock:

```bash
python integrations/custom-iris/custom-iris.py --test integrations/examples/wazuh-alert.json --send --hook-url http://127.0.0.1:8000/alerts/add --api-key local-demo-token
```

The demo token is intentionally public test data. Use a protected environment/configuration file for a real token.

The monitor can read the local mock once:

```bash
python integrations/sync-daemon/iris_status_daemon.py --endpoint http://127.0.0.1:8000/alerts/filter --api-key local-demo-token --state-db demo-state.sqlite3 --once
```

## Production binding

Use [the server deployment suite](../deployment/README.md). It installs dependencies in a virtual environment, configures verified HTTPS, discovers the instance’s IPv4/IPv6 IOC type IDs, and generates the protected adapter configuration.

Wazuh passes a non-secret marker as its integration argument. The installed wrapper loads the real token from `/etc/blusoc/integration.json`, keeping that credential out of the process arguments. The monitor receives its token through a protected systemd environment file.

For standalone adapter use, set `IRIS_IOC_IPV4_TYPE_ID` and `IRIS_IOC_IPV6_TYPE_ID` to IDs from your instance to attach typed IOCs. When they are absent, addresses remain in the description and alert context; the adapter omits untyped IOC records.

## Contracts and limits

- Severity IDs match the default IRIS 2.4 seed: informational 2, low 3, medium 4, high 5, critical 6. New alerts use status 2.
- The adapter retains up to 4,000 raw-log characters in the description and reports truncation. It does not change Wazuh’s internal buffers.
- IP addresses are classified locally. Country, ASN, and reputation are not fabricated.
- An unsuccessful HTTP response or IRIS application error produces a nonzero exit. There is no automatic POST retry or delivery outbox.
- The monitor follows IRIS pagination, preserves its baseline in SQLite, and uses capped retry backoff. It does not mutate IRIS, Wazuh, or the showcase.
- The mock implements the response shapes needed by the tests, not the full IRIS application.

Run `npm run test:integrations` for the HTTP and state tests. The [upstream IRIS alert routes](https://github.com/dfir-iris/iris-web/blob/v2.4.29/source/app/blueprints/alerts/alerts_routes.py) define the live API contract.
