import { createServer } from "node:http";

import { buildApp } from "../src/app.js";
import { closePool, createPool, getPool, setPool } from "../src/db/client.js";
import { runMigrations } from "../src/db/migrate.js";
import { createPostgresRepositories } from "../src/repositories/postgres/index.js";

const PORT = 3010;
const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://geendersom@127.0.0.1:5432/api_monitor";

process.env.DATABASE_URL = DATABASE_URL;

type Json = Record<string, unknown>;

const request = async (
  path: string,
  init?: RequestInit,
): Promise<{ status: number; body: Json }> => {
  const response = await fetch(`http://127.0.0.1:${PORT}${path}`, init);
  const body = (await response.json()) as Json;

  return { status: response.status, body };
};

const resetDatabase = async (): Promise<void> => {
  const pool = createPool(DATABASE_URL);
  await runMigrations(pool);

  await pool.query(`
    TRUNCATE TABLE
      alert_events,
      incidents,
      check_results,
      monitors
    RESTART IDENTITY CASCADE
  `);

  await pool.end();
};

const startApi = async () => {
  const pool = getPool();
  await runMigrations(pool);
  const repositories = createPostgresRepositories(pool);

  const app = buildApp({
    logger: false,
    repositories,
    onClose: closePool,
  });

  await app.listen({ port: PORT, host: "127.0.0.1" });

  return app;
};

const stopApi = async (app: Awaited<ReturnType<typeof startApi>>) => {
  await app.close();
  setPool(createPool(DATABASE_URL));
};

const main = async () => {
  console.log("=== TAREFA 20 — TESTE DE PERSISTÊNCIA ===");
  console.log(`DATABASE_URL=${DATABASE_URL}`);

  await resetDatabase();

  let statusCode = 500;
  const targetServer = createServer((_request, response) => {
    response.writeHead(statusCode);
    response.end(statusCode === 200 ? "ok" : "error");
  });

  await new Promise<void>((resolve, reject) => {
    targetServer.once("error", reject);
    targetServer.listen(0, "127.0.0.1", () => resolve());
  });

  const targetAddress = targetServer.address();
  if (!targetAddress || typeof targetAddress === "string") {
    throw new Error("Unable to resolve target server address");
  }

  const targetUrl = `http://127.0.0.1:${targetAddress.port}/health`;

  console.log("\n[1/4] Subindo API (primeira instância)...");
  const app1 = await startApi();

  console.log("[2/4] Gravando dados via API...");
  const createMonitor = await request("/monitors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Persist Monitor", url: targetUrl }),
  });

  if (createMonitor.status !== 201) {
    throw new Error(`Falha ao criar monitor: ${JSON.stringify(createMonitor)}`);
  }

  const monitorId = createMonitor.body.id as string;

  await request(`/monitors/${monitorId}/check`);
  await request(`/monitors/${monitorId}/check`);
  statusCode = 200;
  await request(`/monitors/${monitorId}/check`);

  const beforeRestart = {
    monitor: await request(`/monitors/${monitorId}`),
    monitors: await request("/monitors"),
    checks: await request(`/monitors/${monitorId}/checks`),
    stats: await request(`/monitors/${monitorId}/stats`),
    incidents: await request(`/monitors/${monitorId}/incidents`),
    alerts: await request(`/monitors/${monitorId}/alerts`),
    allAlerts: await request("/alerts"),
  };

  console.log("Dados antes do restart:");
  console.log(
    JSON.stringify(
      {
        monitorId,
        monitors: (beforeRestart.monitors.body.monitors as unknown[]).length,
        checks: (beforeRestart.checks.body.checks as unknown[]).length,
        incidents: (beforeRestart.incidents.body.incidents as unknown[])
          .length,
        alerts: (beforeRestart.alerts.body.alerts as unknown[]).length,
        stats: beforeRestart.stats.body,
      },
      null,
      2,
    ),
  );

  console.log("\n[3/4] Encerrando API (simulando restart)...");
  await stopApi(app1);

  console.log("[4/4] Subindo API (segunda instância) e relendo dados...");
  const app2 = await startApi();

  const afterRestart = {
    monitor: await request(`/monitors/${monitorId}`),
    monitors: await request("/monitors"),
    checks: await request(`/monitors/${monitorId}/checks`),
    stats: await request(`/monitors/${monitorId}/stats`),
    incidents: await request(`/monitors/${monitorId}/incidents`),
    alerts: await request(`/monitors/${monitorId}/alerts`),
    allAlerts: await request("/alerts"),
  };

  await stopApi(app2);
  targetServer.close();

  const checksBefore = beforeRestart.checks.body.checks as Json[];
  const checksAfter = afterRestart.checks.body.checks as Json[];
  const incidentsBefore = beforeRestart.incidents.body.incidents as Json[];
  const incidentsAfter = afterRestart.incidents.body.incidents as Json[];
  const alertsBefore = beforeRestart.alerts.body.alerts as Json[];
  const alertsAfter = afterRestart.alerts.body.alerts as Json[];

  const assertions = [
    {
      name: "Monitor sobrevive ao restart",
      pass: JSON.stringify(beforeRestart.monitor.body) ===
        JSON.stringify(afterRestart.monitor.body),
    },
    {
      name: "Lista de monitores preservada",
      pass: JSON.stringify(beforeRestart.monitors.body) ===
        JSON.stringify(afterRestart.monitors.body),
    },
    {
      name: "Histórico de checks preservado",
      pass: checksBefore.length === 3 && checksBefore.length === checksAfter.length &&
        JSON.stringify(checksBefore) === JSON.stringify(checksAfter),
    },
    {
      name: "Stats preservadas",
      pass: JSON.stringify(beforeRestart.stats.body) ===
        JSON.stringify(afterRestart.stats.body),
    },
    {
      name: "Incidentes preservados",
      pass: incidentsBefore.length === 1 && incidentsBefore.length === incidentsAfter.length &&
        JSON.stringify(incidentsBefore) === JSON.stringify(incidentsAfter),
    },
    {
      name: "Alertas do monitor preservados",
      pass: alertsBefore.length === 2 && alertsBefore.length === alertsAfter.length &&
        JSON.stringify(alertsBefore) === JSON.stringify(alertsAfter),
    },
    {
      name: "GET /alerts preservado",
      pass: JSON.stringify(beforeRestart.allAlerts.body) ===
        JSON.stringify(afterRestart.allAlerts.body),
    },
    {
      name: "Cenário DOWN DOWN UP correto",
      pass:
        checksAfter.filter((check) => check.status === "down").length === 2 &&
        checksAfter.filter((check) => check.status === "up").length === 1 &&
        (incidentsAfter[0]?.status as string) === "resolved" &&
        alertsAfter.map((alert) => alert.type).join(",") ===
          "incident_opened,incident_resolved",
    },
  ];

  console.log("\n=== RESULTADO ===");
  let allPassed = true;

  for (const assertion of assertions) {
    const status = assertion.pass ? "PASS" : "FAIL";
    console.log(`${status} — ${assertion.name}`);

    if (!assertion.pass) {
      allPassed = false;
    }
  }

  if (!allPassed) {
    console.error("\nTeste de persistência FALHOU.");
    process.exit(1);
  }

  console.log("\nTeste de persistência APROVADO.");
  console.log("API → PostgreSQL → restart → dados continuam lá.");
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
