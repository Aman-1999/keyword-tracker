import mongoose from 'mongoose';

const DataForSeoTaskSchema = new mongoose.Schema({
    taskId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true,
        index: true,
    },
    keyword: {
        type: String,
        required: true,
    },
    domain: {
        type: String,
        required: true,
    },
    location_code: {
        type: Number,
        required: true,
    },
    filters: {
        language: String,
        device: String,
        os: String,
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'ready', 'failed'],
        default: 'pending',
        index: true,
    },
    result: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
    },
    rankingResultId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RankingResult',
        default: null,
    },
    error: {
        type: String,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
    completedAt: {
        type: Date,
        default: null,
    },
});

// Compound index for efficient queries
DataForSeoTaskSchema.index({ jobId: 1, status: 1 });
DataForSeoTaskSchema.index({ status: 1, createdAt: 1 });

export default mongoose.models.DataForSeoTask || mongoose.model('DataForSeoTask', DataForSeoTaskSchema);
