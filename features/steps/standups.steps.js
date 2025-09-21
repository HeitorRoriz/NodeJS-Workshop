import { Given, When, Then, Before, After } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import request from "supertest";
import { buildApp } from "../../src/app.js";

Before(async function () {
  this.app = buildApp();
  await this.app.ready();
});

After(async function () {
  await this.app.close();
});

Given('I add a standup with blockers {string}', async function (text) {
  const blockers = text;
  await request(this.app.server)
    .post("/standups")
    .send({ yesterday: "y", today: "t", blockers })
    .expect(blockers === "None" ? 201 : 201);
});

When('I request the blockers list', async function () {
  this.res = await request(this.app.server).get("/standups/blockers");
});

Then('I should see exactly {int} entry with blockers {string}', function (count, expected) {
  assert.equal(this.res.status, 200);
  assert.equal(this.res.body.length, count);
  assert.equal(this.res.body[0].blockers, expected);
});

When('I request the standups export in CSV format', async function () {
  this.res = await request(this.app.server)
    .get("/standups/export?format=csv")
    .set("Accept", "text/csv");   // we expect CSV
});

Then('I should see a CSV response containing {string}', function (expected) {
  assert.equal(this.res.status, 200);
  assert.match(this.res.text, new RegExp(expected));
  assert.match(this.res.headers['content-type'], /text\/csv/);
});


