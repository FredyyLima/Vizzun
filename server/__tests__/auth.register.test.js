import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { app, prisma } from "../index.js";
import { genValidCpf, genUniqueEmail, validClientPayload } from "./test-utils.js";

const createdUserIds = [];

describe("POST /api/register", () => {
  afterAll(async () => {
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
  });

  it("creates a client user with valid data", async () => {
    const payload = validClientPayload();
    const response = await request(app).post("/api/register").send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ role: "CLIENT", personType: "CPF" });
    expect(response.body.id).toBeTruthy();
    createdUserIds.push(response.body.id);
  });

  it("rejects an invalid CPF", async () => {
    const payload = validClientPayload({ cpf: "11111111111" });
    const response = await request(app).post("/api/register").send(payload);

    expect(response.status).toBe(400);
    expect(response.body.errors.fieldErrors.cpf).toBeTruthy();
  });

  it("rejects a password without a number", async () => {
    const payload = validClientPayload({ password: "SomenteLetras" });
    const response = await request(app).post("/api/register").send(payload);

    expect(response.status).toBe(400);
    expect(response.body.errors.fieldErrors.password).toBeTruthy();
  });

  it("rejects a duplicate email", async () => {
    const payload = validClientPayload();
    const first = await request(app).post("/api/register").send(payload);
    expect(first.status).toBe(201);
    createdUserIds.push(first.body.id);

    const second = await request(app)
      .post("/api/register")
      .send({ ...payload, cpf: genValidCpf(), email: payload.email });

    expect(second.status).toBe(409);
    expect(second.body.field).toBe("email");
  });

  it("rejects a duplicate CPF", async () => {
    const payload = validClientPayload();
    const first = await request(app).post("/api/register").send(payload);
    expect(first.status).toBe(201);
    createdUserIds.push(first.body.id);

    const second = await request(app)
      .post("/api/register")
      .send({ ...payload, cpf: payload.cpf, email: genUniqueEmail("teste-auth") });

    expect(second.status).toBe(409);
    expect(second.body.field).toBe("cpf");
  });
});
