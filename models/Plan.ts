import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPlanLimits {
  // Keyword Tracker limits
  keywordSearches: number; // searches per month
  keywordsPerSearch: number; // max keywords per search
  searchHistoryDays: number; // how long to keep history

  // Future tool limits (extensible)
  backlinksChecks?: number;
  siteAudits?: number;
  competitorAnalysis?: number;
  contentOptimization?: number;

  // API limits
  apiRequestsPerDay: number;
  apiRequestsPerMonth: number;

  // Feature flags
  features: {
    aiOverviewTracking: boolean;
    serpFeatureAnalysis: boolean;
    exportData: boolean;
    apiAccess: boolean;
    prioritySupport: boolean;
    whiteLabel: boolean;
    customReports: boolean;
    teamMembers: number; // 0 = no team feature, -1 = unlimited
  };
}

export interface IPlan extends Document {
  name: string;
  slug: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
    currency: string;
  };
  limits: IPlanLimits;
  isActive: boolean;
  isDefault: boolean; // Default plan for new users
  sortOrder: number;
  color: string; // For UI display
  badge?: string; // e.g., "Most Popular", "Best Value"
  createdAt: Date;
  updatedAt: Date;
}

const PlanLimitsSchema = new Schema(
  {
    // Keyword Tracker limits
    keywordSearches: { type: Number, required: true, default: 100 },
    keywordsPerSearch: { type: Number, required: true, default: 10 },
    searchHistoryDays: { type: Number, required: true, default: 30 },

    // Future tool limits
    backlinksChecks: { type: Number, default: 0 },
    siteAudits: { type: Number, default: 0 },
    competitorAnalysis: { type: Number, default: 0 },
    contentOptimization: { type: Number, default: 0 },

    // API limits
    apiRequestsPerDay: { type: Number, required: true, default: 100 },
    apiRequestsPerMonth: { type: Number, required: true, default: 1000 },

    // Feature flags
    features: {
      aiOverviewTracking: { type: Boolean, default: false },
      serpFeatureAnalysis: { type: Boolean, default: false },
      exportData: { type: Boolean, default: false },
      apiAccess: { type: Boolean, default: false },
      prioritySupport: { type: Boolean, default: false },
      whiteLabel: { type: Boolean, default: false },
      customReports: { type: Boolean, default: false },
      teamMembers: { type: Number, default: 0 },
    },
  },
  { _id: false }
);

const PlanSchema = new Schema<IPlan>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      monthly: { type: Number, required: true, default: 0 },
      yearly: { type: Number, required: true, default: 0 },
      currency: { type: String, default: "USD" },
    },
    limits: {
      type: PlanLimitsSchema,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    color: {
      type: String,
      default: "#6366f1", // Indigo
    },
    badge: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
PlanSchema.index({ slug: 1 }, { unique: true });
PlanSchema.index({ isActive: 1, sortOrder: 1 });

// Ensure only one default plan
PlanSchema.pre("save", async function () {
  if (this.isDefault) {
    await (this.constructor as Model<IPlan>).updateMany(
      { _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
});

const Plan: Model<IPlan> =
  mongoose.models.Plan || mongoose.model<IPlan>("Plan", PlanSchema);

export default Plan;

// Type for plan input data (without Document fields and timestamps)
type PlanInput = Omit<IPlan, keyof Document | "createdAt" | "updatedAt">;

// Default plans data for seeding
export const DEFAULT_PLANS: PlanInput[] = [
  {
    name: "Free",
    slug: "free",
    description: "Perfect for getting started with basic keyword tracking",
    price: { monthly: 0, yearly: 0, currency: "USD" },
    limits: {
      keywordSearches: 50,
      keywordsPerSearch: 5,
      searchHistoryDays: 7,
      backlinksChecks: 0,
      siteAudits: 0,
      competitorAnalysis: 0,
      contentOptimization: 0,
      apiRequestsPerDay: 50,
      apiRequestsPerMonth: 500,
      features: {
        aiOverviewTracking: false,
        serpFeatureAnalysis: false,
        exportData: false,
        apiAccess: false,
        prioritySupport: false,
        whiteLabel: false,
        customReports: false,
        teamMembers: 0,
      },
    },
    isActive: true,
    isDefault: true,
    sortOrder: 0,
    color: "#6b7280", // Gray
  },
  {
    name: "Basic",
    slug: "basic",
    description: "For individuals and small projects needing more power",
    price: { monthly: 19, yearly: 190, currency: "USD" },
    limits: {
      keywordSearches: 500,
      keywordsPerSearch: 20,
      searchHistoryDays: 30,
      backlinksChecks: 100,
      siteAudits: 5,
      competitorAnalysis: 10,
      contentOptimization: 0,
      apiRequestsPerDay: 500,
      apiRequestsPerMonth: 10000,
      features: {
        aiOverviewTracking: true,
        serpFeatureAnalysis: true,
        exportData: true,
        apiAccess: false,
        prioritySupport: false,
        whiteLabel: false,
        customReports: false,
        teamMembers: 0,
      },
    },
    isActive: true,
    isDefault: false,
    sortOrder: 1,
    color: "#3b82f6", // Blue
  },
  {
    name: "Pro",
    slug: "pro",
    description: "For professionals and growing businesses",
    price: { monthly: 49, yearly: 490, currency: "USD" },
    limits: {
      keywordSearches: 2000,
      keywordsPerSearch: 50,
      searchHistoryDays: 90,
      backlinksChecks: 500,
      siteAudits: 20,
      competitorAnalysis: 50,
      contentOptimization: 100,
      apiRequestsPerDay: 2000,
      apiRequestsPerMonth: 50000,
      features: {
        aiOverviewTracking: true,
        serpFeatureAnalysis: true,
        exportData: true,
        apiAccess: true,
        prioritySupport: true,
        whiteLabel: false,
        customReports: true,
        teamMembers: 5,
      },
    },
    isActive: true,
    isDefault: false,
    sortOrder: 2,
    color: "#8b5cf6", // Purple
    badge: "Most Popular",
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    description: "For large teams and agencies with unlimited needs",
    price: { monthly: 149, yearly: 1490, currency: "USD" },
    limits: {
      keywordSearches: -1, // -1 = unlimited
      keywordsPerSearch: 100,
      searchHistoryDays: 365,
      backlinksChecks: -1,
      siteAudits: -1,
      competitorAnalysis: -1,
      contentOptimization: -1,
      apiRequestsPerDay: -1,
      apiRequestsPerMonth: -1,
      features: {
        aiOverviewTracking: true,
        serpFeatureAnalysis: true,
        exportData: true,
        apiAccess: true,
        prioritySupport: true,
        whiteLabel: true,
        customReports: true,
        teamMembers: -1, // Unlimited
      },
    },
    isActive: true,
    isDefault: false,
    sortOrder: 3,
    color: "#f59e0b", // Amber
    badge: "Best Value",
  },
];
