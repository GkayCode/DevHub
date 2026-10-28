import { describe, expect, it } from "vitest";
import request from "supertest";

import app from "../app";

describe("GitHub statistics endpoint", () => {
  it("geçersiz kullanıcı adını reddeder", async () => {
    const response = await request(app).get(
      "/api/github-stats/invalid%20username"
    );

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "Geçersiz GitHub kullanıcı adı."
    );
  });
});