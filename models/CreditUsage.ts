import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICreditUsage extends Document {
    userId: mongoose.Types.ObjectId;
    apiEndpoint: string;
    creditsUsed: number;
    requestParams: any;
    responseStatus: number;
    timestamp: Date;
    createdAt: Date;
}

const CreditUsageSchema: Schema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        apiEndpoint: {
            type: String,
            required: true,
            index: true,
        },
        creditsUsed: {
            type: Number,
            required: true,
        },
        requestParams: {
            type: Schema.Types.Mixed,
            default: {},
        },
        responseStatus: {
            type: Number,
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for analytics
CreditUsageSchema.index({ userId: 1, timestamp: -1 });
CreditUsageSchema.index({ apiEndpoint: 1, timestamp: -1 });

const CreditUsage: Model<ICreditUsage> =
    mongoose.models.CreditUsage ||
    mongoose.model<ICreditUsage>('CreditUsage', CreditUsageSchema);

export default CreditUsage;
