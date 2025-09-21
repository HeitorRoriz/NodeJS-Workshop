import Fastify from "fastify";

export function buildApp() {
  const app = Fastify({ logger: false });
  const db = [];
  let id = 1;

  app.post("/standups", async (req, reply) => {
    const { yesterday, today, blockers = "None" } = req.body ?? {};
    if (!yesterday || !today) return reply.code(400).send({ error: "ValidationError" });
    const entry = { id: id++, yesterday, today, blockers, createdAt: new Date().toISOString() };
    db.push(entry);
    return reply.code(201).send(entry);
  });

  app.get("/standups", async (req, reply) => {
    const q = req.query ?? {};
    const limit = Math.max(1, Math.min(50, Number(q.limit ?? 3)));
    const recent = [...db].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
    return reply.send(recent);
  });

    // GET /standups/blockers — only entries with blockers
  app.get("/standups/blockers", async (req, reply) => {
    const withBlockers = db.filter((s) => s.blockers && s.blockers !== "None");
    return reply.send(withBlockers);
  });

  // GET /standups/export?format=csv — export all entries as CSV
app.get("/standups/export", async (req, reply) => {
  const q = req.query ?? {};
  const format = String(q.format ?? "json").toLowerCase();

  if (format !== "csv") {
    return reply.code(400).send({ error: "ValidationError", message: "Only csv supported for now" });
  }

  const header = "id,yesterday,today,blockers,createdAt";
  const toCsvCell = (s) => `"${String(s).replaceAll('"', '""')}"`;

  const lines = [header, ...db.map(s =>
    [
      s.id,
      toCsvCell(s.yesterday),
      toCsvCell(s.today),
      toCsvCell(s.blockers),
      s.createdAt
    ].join(",")
  )];

  const csv = lines.join("\n");
  reply.header("Content-Type", "text/csv; charset=utf-8");
  return reply.send(csv);
});

  return app;
}
