import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../index.js";

describe("POST /api/login rate limiting", () => {
  it("blocks after repeated failed attempts from the same client", async () => {
    const attempt = () =>
      request(app)
        .post("/api/login")
        .send({ email: "rate-limit-test@example.com", password: "SenhaErrada1" });

    let lastResponse;
    for (let i = 0; i < 10; i += 1) {
      lastResponse = await attempt();
      expect(lastResponse.status).toBe(401);
    }

    const eleventh = await attempt();
    expect(eleventh.status).toBe(429);
  });
});
