import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISearchHistory extends Document {
  domain: string;
  location: string;
  location_code: number;
  userId: mongoose.Types.ObjectId;
  keywords: string[];
  filters: {
    language: string;
    device: string;
    os: string;
  };
  taskIds: string[];
  createdAt: Date;
}

const SearchHistorySchema: Schema = new Schema(
  {
    domain: { type: String, required: true, index: true },
    location: { type: String, required: true },
    location_code: { type: Number, required: true, index: true },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    keywords: { type: [String], required: true },
    filters: {
      language: { type: String, default: "en" },
      device: { type: String, default: "desktop" },
      os: { type: String, default: "windows" },
    },
    taskIds: { type: [String], default: [], index: true },
    keywordCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
SearchHistorySchema.index({ userId: 1, createdAt: -1 });
SearchHistorySchema.index({ userId: 1, domain: 1, createdAt: -1 });
SearchHistorySchema.index({ domain: 1, createdAt: -1 });
SearchHistorySchema.index({ taskIds: 1 });

const SearchHistory: Model<ISearchHistory> =
  mongoose.models.SearchHistory ||
  mongoose.model<ISearchHistory>("SearchHistory", SearchHistorySchema);

export default SearchHistory;
