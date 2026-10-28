
import mongoose, { Schema } from "mongoose";

const userSettingsSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    theme: {
      type: String,
      enum: ["dark", "light", "system"],
      default: "dark",
    },
    defaultReadmeTemplate: {
      type: String,
      default: "project-readme",
      trim: true,
    },
  },
  { timestamps: true }
);

const UserSettings =
  mongoose.models.UserSettings ||
  mongoose.model("UserSettings", userSettingsSchema);

export default UserSettings;
