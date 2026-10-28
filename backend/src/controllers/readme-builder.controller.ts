import type { RequestHandler } from "express";
import ReadmeTemplate from "../models/ReadmeTemplate";
import {
  renderReadmeTemplate,
  type ReadmeVariables,
} from "../utils/readme-renderer";

export const renderReadme: RequestHandler = async (
  req,
  res
) => {
  const templateId = req.params.id;
  const id = Array.isArray(templateId) ? templateId[0] : templateId;

  if (!id || !/^[a-zA-Z0-9_-]{1,80}$/.test(id)) {
    res.status(400).json({
      success: false,
      message: "Geçersiz şablon kimliği.",
    });
    return;
  }

  const body: unknown = req.body;
  const variables =
    typeof body === "object" &&
    body !== null &&
    "variables" in body
      ? body.variables
      : undefined;

  if (
    typeof variables !== "object" ||
    variables === null ||
    Array.isArray(variables)
  ) {
    res.status(400).json({
      success: false,
      message: "variables alanı bir nesne olmalıdır.",
    });
    return;
  }

  const normalizedVariables: ReadmeVariables = {};

  for (const [key, value] of Object.entries(variables)) {
    if (!/^[a-zA-Z0-9_]{1,80}$/.test(key)) {
      res.status(400).json({
        success: false,
        message: `Geçersiz değişken adı: ${key}`,
      });
      return;
    }

    if (typeof value !== "string" || value.length > 5000) {
      res.status(400).json({
        success: false,
        message: `Değişken değeri geçersiz: ${key}`,
      });
      return;
    }

    normalizedVariables[key] = value;
  }

  try {
    const template = await ReadmeTemplate.findOne({
      templateId: id,
    }).lean();
    const foundTemplate = Array.isArray(template) ? template[0] : template;

    if (!foundTemplate) {
      res.status(404).json({
        success: false,
        message: "README şablonu bulunamadı.",
      });
      return;
    }

    const result = renderReadmeTemplate(
      foundTemplate.content,
      normalizedVariables
    );

    res.status(200).json({
      success: true,
      data: {
        templateId: foundTemplate.templateId,
        name: foundTemplate.name,
        content: result.content,
        missingVariables: result.missingVariables,
      },
    });
  } catch (error) {
    console.error("README rendering error:", error);

    res.status(500).json({
      success: false,
      message: "README oluşturulamadı.",
    });
  }
};