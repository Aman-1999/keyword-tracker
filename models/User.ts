import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      maxlength: [60, "Name cannot be more than 60 characters"],
      index: true,
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [6, "Password cannot be less than 6 characters"],
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },
    // Subscription & Plan
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      index: true,
    },
    planSlug: {
      type: String,
      default: "free",
      index: true,
    },
    subscription: {
      status: {
        type: String,
        enum: ["active", "canceled", "past_due", "trialing", "none"],
        default: "none",
      },
      billingCycle: {
        type: String,
        enum: ["monthly", "yearly", "none"],
        default: "none",
      },
      currentPeriodStart: Date,
      currentPeriodEnd: Date,
      cancelAtPeriodEnd: Boolean,
    },
    // Usage tracking (resets monthly)
    usage: {
      keywordSearches: { type: Number, default: 0 },
      apiRequests: { type: Number, default: 0 },
      backlinksChecks: { type: Number, default: 0 },
      siteAudits: { type: Number, default: 0 },
      competitorAnalysis: { type: Number, default: 0 },
      contentOptimization: { type: Number, default: 0 },
      lastResetAt: { type: Date, default: Date.now },
    },
    requestTokens: {
      type: Number,
      default: 1,
      min: 0,
      index: true,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common admin queries
UserSchema.index({ role: 1, createdAt: -1 });
UserSchema.index({ requestTokens: 1, role: 1 });
UserSchema.index({ lastActiveAt: -1 });

export default mongoose.models.User || mongoose.model("User", UserSchema);
