import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app, prisma } from "../index.js";
import { validClientPayload } from "./test-utils.js";

const createdUserIds = [];
let credentials;

describe("POST /api/login and GET /api/me", () => {
  beforeAll(async () => {
    credentials = validClientPayload();
    const response = await request(app).post("/api/register").send(credentials);
    expect(response.status).toBe(201);
    createdUserIds.push(response.body.id);
  });

  afterAll(async () => {
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
  });

  it("rejects login with wrong password", async () => {
    const response = await request(app)
      .post("/api/login")
      .send({ email: credentials.email, password: "SenhaErrada1" });

    expect(response.status).toBe(401);
  });

  it("rejects login for an email that does not exist", async () => {
    const response = await request(app)
      .post("/api/login")
      .send({ email: "naoexiste@example.com", password: "SenhaForte1" });

    expect(response.status).toBe(401);
  });

  it("logs in with correct credentials and sets an httpOnly auth cookie", async () => {
    const response = await request(app)
      .post("/api/login")
      .send({ email: credentials.email, password: credentials.password });

    expect(response.status).toBe(200);
    expect(response.body.email).toBe(credentials.email);

    const setCookie = response.headers["set-cookie"];
    expect(setCookie).toBeTruthy();
    const tokenCookie = setCookie.find((cookie) => cookie.startsWith("token="));
    expect(tokenCookie).toBeTruthy();
    expect(tokenCookie.toLowerCase()).toContain("httponly");
  });

  it("rejects GET /api/me without a session cookie", async () => {
    const response = await request(app).get("/api/me");
    expect(response.status).toBe(401);
  });

  it("returns the authenticated user's own data on GET /api/me", async () => {
    const loginResponse = await request(app)
      .post("/api/login")
      .send({ email: credentials.email, password: credentials.password });
    const cookie = loginResponse.headers["set-cookie"];

    const meResponse = await request(app).get("/api/me").set("Cookie", cookie);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.email).toBe(credentials.email);
  });

  it("does not expose a /api/user/:id route (IDOR regression check)", async () => {
    const loginResponse = await request(app)
      .post("/api/login")
      .send({ email: credentials.email, password: credentials.password });
    const cookie = loginResponse.headers["set-cookie"];

    const response = await request(app).get(`/api/user/${createdUserIds[0]}`).set("Cookie", cookie);
    expect(response.status).toBe(404);
  });
});
