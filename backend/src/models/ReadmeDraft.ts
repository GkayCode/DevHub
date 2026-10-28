    import mongoose, { Schema } from "mongoose";

const readmeDraftSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 120,
    },
    content: {
      type: String,
      required: true,
      maxlength: 100000,
    },
    templateId: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const ReadmeDraft =
  mongoose.models.ReadmeDraft ||
  mongoose.model("ReadmeDraft", readmeDraftSchema);

export default ReadmeDraft;