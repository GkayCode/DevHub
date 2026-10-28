import { describe, expect, it } from "vitest";
import request from "supertest";

import app from "../app";

describe("DevHub API", () => {
  it("ana endpoint'te başarılı yanıt döndürür", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it("bilinmeyen endpoint için 404 döndürür", async () => {
    const response = await request(app).get(
      "/api/bu-endpoint-yok"
    );

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});