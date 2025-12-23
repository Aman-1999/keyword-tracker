import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IKeyword {
  keyword: string;
  addedAt: Date;
  lastCheckedAt?: Date;
  latestRank?: number | null;
  bestRank?: number | null;
  notes?: string;
}

export interface IKeywordList extends Document {
  userId: Types.ObjectId;
  name: string;
  domain: string;
  location: string;
  locationCode: number | null;
  language: string;
  languageName: string;
  keywords: IKeyword[];
  isActive: boolean;
  autoTrack: boolean; // Auto-track rankings periodically
  trackingFrequency: "daily" | "weekly" | "manual";
  lastTrackedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const KeywordSchema = new Schema<IKeyword>(
  {
    keyword: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
    lastCheckedAt: {
      type: Date,
    },
    latestRank: {
      type: Number,
      default: null,
    },
    bestRank: {
      type: Number,
      default: null,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
  },
  { _id: true }
);

const KeywordListSchema = new Schema<IKeywordList>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    domain: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      default: "United States",
    },
    locationCode: {
      type: Number,
      default: null,
    },
    language: {
      type: String,
      required: true,
      trim: true,
      default: "en",
    },
    languageName: {
      type: String,
      trim: true,
      default: "English",
    },
    keywords: {
      type: [KeywordSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    autoTrack: {
      type: Boolean,
      default: false,
    },
    trackingFrequency: {
      type: String,
      enum: ["daily", "weekly", "manual"],
      default: "manual",
    },
    lastTrackedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
KeywordListSchema.index({ userId: 1, domain: 1 });
KeywordListSchema.index({ userId: 1, isActive: 1 });
KeywordListSchema.index({ userId: 1, createdAt: -1 });

// Virtual for keyword count
KeywordListSchema.virtual("keywordCount").get(function () {
  return this.keywords.length;
});

// Ensure JSON includes virtuals
KeywordListSchema.set("toJSON", { virtuals: true });
KeywordListSchema.set("toObject", { virtuals: true });

const KeywordList: Model<IKeywordList> =
  mongoose.models.KeywordList ||
  mongoose.model<IKeywordList>("KeywordList", KeywordListSchema);

export default KeywordList;
