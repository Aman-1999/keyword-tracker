import mongoose from 'mongoose';

const SubregionSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.Mixed, // Can be ObjectId or Number based on user input
    id: Number,
    name: String,
    region_id: Number,
    translations: Object,
    wikiDataId: String
});

export default mongoose.models.Subregion || mongoose.model('Subregion', SubregionSchema);
