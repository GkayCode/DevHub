import { describe, expect, it } from "vitest";
import { renderReadmeTemplate } from "../utils/readme-renderer";

describe("README renderer", () => {
  it("şablondaki değişkenleri değiştirir", () => {
    const result = renderReadmeTemplate(
      "# {{projectName}}\n{{description}}",
      {
        projectName: "DevHub",
        description: "GitHub profil aracım.",
      }
    );

    expect(result.content).toBe(
      "# DevHub\nGitHub profil aracım."
    );
    expect(result.missingVariables).toEqual([]);
  });

  it("eksik değişkenleri bildirir", () => {
    const result = renderReadmeTemplate(
      "# {{projectName}}\n{{description}}",
      {
        projectName: "DevHub",
      }
    );

    expect(result.content).toBe(
      "# DevHub\n{{description}}"
    );
    expect(result.missingVariables).toEqual(["description"]);
  });

  it("aynı eksik değişkeni yalnızca bir kez listeler", () => {
    const result = renderReadmeTemplate(
      "{{name}} ve tekrar {{name}}",
      {}
    );

    expect(result.missingVariables).toEqual(["name"]);
  });
});