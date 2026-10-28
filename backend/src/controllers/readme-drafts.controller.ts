import type { RequestHandler } from "express";
import mongoose from "mongoose";
import ReadmeDraft from "../models/ReadmeDraft";

function bodyRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function validId(value: unknown): value is string {
  return typeof value === "string" && mongoose.isValidObjectId(value);
}

export const listDrafts: RequestHandler = async (_req, res) => {
  try {
    const drafts = await ReadmeDraft.find()
      .select("title content templateId createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean();
    res.json({ success: true, count: drafts.length, data: drafts });
  } catch (error) {
    console.error("List README drafts error:", error);
    res.status(500).json({ success: false, message: "Taslaklar alınamadı." });
  }
};

export const getDraft: RequestHandler = async (req, res) => {
  const id = req.params.id;
  if (!validId(id)) {
    res.status(400).json({ success: false, message: "Geçersiz taslak kimliği." });
    return;
  }
  try {
    const draft = await ReadmeDraft.findById(id).lean();
    if (!draft) {
      res.status(404).json({ success: false, message: "Taslak bulunamadı." });
      return;
    }
    res.json({ success: true, data: draft });
  } catch (error) {
    console.error("Get README draft error:", error);
    res.status(500).json({ success: false, message: "Taslak alınamadı." });
  }
};

export const createDraft: RequestHandler = async (req, res) => {
  const body = bodyRecord(req.body);
  if (!body) {
    res.status(400).json({ success: false, message: "İstek gövdesi JSON nesnesi olmalıdır." });
    return;
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const content = body.content;
  const templateId = body.templateId;

  if (!title || title.length > 120) {
    res.status(400).json({ success: false, message: "Başlık 1-120 karakter arasında olmalıdır." });
    return;
  }
  if (typeof content !== "string" || content.length > 100000) {
    res.status(400).json({ success: false, message: "İçerik metin olmalı ve 100.000 karakteri aşmamalıdır." });
    return;
  }
  if (templateId !== undefined && templateId !== null && (typeof templateId !== "string" || templateId.length > 80)) {
    res.status(400).json({ success: false, message: "Geçersiz şablon kimliği." });
    return;
  }

  try {
    const draft = await ReadmeDraft.create({
      title,
      content,
      templateId: typeof templateId === "string" && templateId.trim() ? templateId.trim() : null,
    });
    res.status(201).json({ success: true, data: draft });
  } catch (error) {
    console.error("Create README draft error:", error);
    res.status(500).json({ success: false, message: "Taslak kaydedilemedi." });
  }
};

export const updateDraft: RequestHandler = async (req, res) => {
  const id = req.params.id;
  if (!validId(id)) {
    res.status(400).json({ success: false, message: "Geçersiz taslak kimliği." });
    return;
  }

  const body = bodyRecord(req.body);
  if (!body) {
    res.status(400).json({ success: false, message: "İstek gövdesi JSON nesnesi olmalıdır." });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (Object.prototype.hasOwnProperty.call(body, "title")) {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title || title.length > 120) {
      res.status(400).json({ success: false, message: "Başlık 1-120 karakter arasında olmalıdır." });
      return;
    }
    updates.title = title;
  }
  if (Object.prototype.hasOwnProperty.call(body, "content")) {
    if (typeof body.content !== "string" || body.content.length > 100000) {
      res.status(400).json({ success: false, message: "Geçersiz README içeriği." });
      return;
    }
    updates.content = body.content;
  }
  if (Object.prototype.hasOwnProperty.call(body, "templateId")) {
    if (body.templateId !== null && (typeof body.templateId !== "string" || body.templateId.length > 80)) {
      res.status(400).json({ success: false, message: "Geçersiz şablon kimliği." });
      return;
    }
    updates.templateId = typeof body.templateId === "string" && body.templateId.trim() ? body.templateId.trim() : null;
  }

  if (!Object.keys(updates).length) {
    res.status(400).json({ success: false, message: "Güncellenecek alan gönderilmedi." });
    return;
  }

  try {
    const draft = await ReadmeDraft.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true }).lean();
    if (!draft) {
      res.status(404).json({ success: false, message: "Taslak bulunamadı." });
      return;
    }
    res.json({ success: true, data: draft });
  } catch (error) {
    console.error("Update README draft error:", error);
    res.status(400).json({ success: false, message: "Taslak güncellenemedi." });
  }
};

export const deleteDraft: RequestHandler = async (req, res) => {
  const id = req.params.id;
  if (!validId(id)) {
    res.status(400).json({ success: false, message: "Geçersiz taslak kimliği." });
    return;
  }
  try {
    const draft = await ReadmeDraft.findByIdAndDelete(id);
    if (!draft) {
      res.status(404).json({ success: false, message: "Taslak bulunamadı." });
      return;
    }
    res.json({ success: true, message: "Taslak silindi." });
  } catch (error) {
    console.error("Delete README draft error:", error);
    res.status(500).json({ success: false, message: "Taslak silinemedi." });
  }
};
