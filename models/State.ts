import mongoose from 'mongoose';

const StateSchema = new mongoose.Schema({
    _id: Number,
    name: String,
    country_id: Number,
    country_code: String,
    country_name: String,
    state_code: String,
    type: String,
    latitude: String,
    longitude: String,
    population: Number,
    native: String,
    translations: Object,
    wikiDataId: String
});

export default mongoose.models.State || mongoose.model('State', StateSchema);
