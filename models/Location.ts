import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILanguage {
    language_name: string;
    language_code: string;
    keywords?: number;
    serps?: number;
    available_sources?: string[];
}

export interface ILocation extends Document {
    location_code: number;
    location_name: string;
    location_code_parent: number | null;
    country_iso_code: string;
    location_type: string;
    available_languages: ILanguage[];
    // Metadata
    createdAt: Date;
    updatedAt: Date;
}

const LanguageSchema = new Schema({
    language_name: { type: String, required: true },
    language_code: { type: String, required: true },
    keywords: { type: Number },
    serps: { type: Number },
    available_sources: [{ type: String }],
}, { _id: false });

const LocationSchema: Schema = new Schema(
    {
        location_code: { type: Number, required: true, unique: true, index: true },
        location_name: { type: String, required: true, index: true },
        location_code_parent: { type: Number, default: null },
        country_iso_code: { type: String, required: true, index: true },
        location_type: { type: String, required: true },
        available_languages: [LanguageSchema],
    },
    {
        timestamps: true,
    }
);

// Text index for search functionality
LocationSchema.index({ location_name: 'text', country_iso_code: 'text' });

const Location: Model<ILocation> =
    mongoose.models.Location ||
    mongoose.model<ILocation>('Location', LocationSchema);

export default Location;
