import mongoose, { Schema, Document, Model } from 'mongoose';

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
    createdAt: Date;
}

const SearchHistorySchema: Schema = new Schema(
    {
        domain: { type: String, required: true },
        location: { type: String, required: true },
        location_code: { type: Number, required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        keywords: { type: [String], required: true },
        filters: {
            language: { type: String, default: 'en' },
            device: { type: String, default: 'desktop' },
            os: { type: String, default: 'windows' },
        },
    },
    {
        timestamps: true,
    }
);

const SearchHistory: Model<ISearchHistory> =
    mongoose.models.SearchHistory ||
    mongoose.model<ISearchHistory>('SearchHistory', SearchHistorySchema);

export default SearchHistory;
