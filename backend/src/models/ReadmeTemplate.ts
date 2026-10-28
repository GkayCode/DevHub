
import mongoose, { Schema, type InferSchemaType } from "mongoose";

const readmeTemplateSchema = new Schema(
  {
    templateId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export type ReadmeTemplateData = InferSchemaType<
  typeof readmeTemplateSchema
>;

const ReadmeTemplate =
  mongoose.models.ReadmeTemplate ||
  mongoose.model("ReadmeTemplate", readmeTemplateSchema);

export default ReadmeTemplate;
