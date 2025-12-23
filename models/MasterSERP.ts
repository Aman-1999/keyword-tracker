import mongoose from "mongoose";

const MasterSERPSchema = new mongoose.Schema({
  taskId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  // Enhanced Metadata
  domain: { type: String, index: true }, // User's tracked domain
  keyword: { type: String, index: true },
  ranks: { type: mongoose.Schema.Types.Mixed }, // { rank_group, rank_absolute, etc. }
  isAiOverview: { type: Boolean, default: false },
  isPeopleAlsoAsk: { type: Boolean, default: false },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: "30d", // Optional: auto-expire after 30 days if desired, or remove for permanent
  },
});

// Compound indexes for history and analytics queries
MasterSERPSchema.index({ domain: 1, keyword: 1, createdAt: -1 });
MasterSERPSchema.index({ isAiOverview: 1, isPeopleAlsoAsk: 1 });
MasterSERPSchema.index({ createdAt: -1 });

export default mongoose.models.MasterSERP ||
  mongoose.model("MasterSERP", MasterSERPSchema);
