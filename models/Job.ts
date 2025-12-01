import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    domain: {
        type: String,
        required: true,
        index: true,
    },
    keywords: [String],
    location: {
        type: String,
        required: true,
    },
    location_code: {
        type: Number,
        required: true,
    },
    filters: {
        language: {
            type: String,
            default: 'en',
        },
        device: {
            type: String,
            enum: ['desktop', 'mobile', 'tablet'],
            default: 'desktop',
        },
        os: {
            type: String,
            default: 'windows',
        },
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
        default: 'pending',
        index: true,
    },
    progress: {
        total: {
            type: Number,
            required: true,
        },
        completed: {
            type: Number,
            default: 0,
        },
        failed: {
            type: Number,
            default: 0,
        },
    },
    results: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RankingResult',
    }],
    error: {
        type: String,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    completedAt: {
        type: Date,
        default: null,
    },
});

// Compound index for efficient queries
JobSchema.index({ userId: 1, status: 1, createdAt: -1 });

export default mongoose.models.Job || mongoose.model('Job', JobSchema);
