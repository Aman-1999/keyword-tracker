import mongoose from 'mongoose';

const RegionSchema = new mongoose.Schema({
    _id: Number,
    name: String,
    translations: Object,
    wikiDataId: String
});

export default mongoose.models.Region || mongoose.model('Region', RegionSchema);
