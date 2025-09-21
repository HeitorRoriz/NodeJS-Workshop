import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { buildApp } from "../src/app.js";

test("POST /standups validates and stores an item", async () => {
  const app = buildApp(); await app.ready();
  const res = await request(app.server)
    .post("/standups")
    .send({ yesterday: "Auth", today: "Reset flow", blockers: "None" })
    .expect(201);
  assert.equal(res.body.yesterday, "Auth");
  assert.equal(res.body.today, "Reset flow");
  assert.ok(res.body.id);
  assert.ok(res.body.createdAt);
  await app.close();
});

test("POST /standups rejects missing fields", async () => {
  const app = buildApp(); await app.ready();
  const res = await request(app.server)
    .post("/standups")
    .send({ today: "Only today" })   // no 'yesterday'
    .expect(400);
  assert.equal(res.body.error, "ValidationError");
  await app.close();
});

test("GET /standups returns newest first and respects limit", async () => {
  const app = buildApp(); await app.ready();
  for (let i = 0; i < 5; i++) {
    await request(app.server).post("/standups").send({ yesterday: `y${i}`, today: `t${i}`, blockers: "None" }).expect(201);
  }
  const res = await request(app.server).get("/standups?limit=3").expect(200);
  assert.equal(res.body.length, 3);
  assert.equal(res.body[0].today, "t4");
  assert.equal(res.body[2].today, "t2");
  await app.close();
});

test("GET /standups returns an empty array when no entries exist", async () => {
  const app = buildApp(); await app.ready();
  const res = await request(app.server).get("/standups?limit=3").expect(200);
  assert.equal(res.body.length, 0);   // <-- This will fail, because db starts empty but our handler might behave differently
  await app.close();
});

// intentionally failing test: route not implemented yet
test("GET /standups/blockers returns only entries with blockers", async () => {
  const app = buildApp(); 
  await app.ready();

  // seed data
  await request(app.server).post("/standups").send({ yesterday: "y1", today: "t1", blockers: "DB down" }).expect(201);
  await request(app.server).post("/standups").send({ yesterday: "y2", today: "t2", blockers: "None" }).expect(201);

  // this route doesn't exist yet -> will fail with 404 (RED)
  const res = await request(app.server).get("/standups/blockers").expect(200);

  assert.equal(res.body.length, 1);
  assert.equal(res.body[0].blockers, "DB down");

  await app.close();
});