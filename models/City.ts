import mongoose from 'mongoose';

const CitySchema = new mongoose.Schema({
    _id: Number,
    name: String,
    state_id: Number,
    state_code: String,
    state_name: String,
    country_id: Number,
    country_code: String,
    country_name: String,
    latitude: String,
    longitude: String,
    wikiDataId: String,
    population: Number,
    native: String,
    translations: Object,
    location: {
        type: { type: String, default: 'Point' },
        coordinates: [Number]
    }
});

CitySchema.index({ name: 'text', country_name: 'text', state_name: 'text' });
CitySchema.index({ name: 1 });

export default mongoose.models.City || mongoose.model('City', CitySchema);
