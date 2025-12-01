import mongoose from 'mongoose';

const CountrySchema = new mongoose.Schema({
    _id: Number,
    name: String,
    iso3: String,
    iso2: String,
    numeric_code: String,
    phonecode: String,
    capital: String,
    currency: String,
    currency_name: String,
    currency_symbol: String,
    tld: String,
    native: String,
    region: String,
    region_id: Number,
    subregion: String,
    subregion_id: Number,
    nationality: String,
    timezones: [{
        zoneName: String,
        gmtOffset: Number,
        gmtOffsetName: String,
        abbreviation: String,
        tzName: String
    }],
    translations: Object,
    latitude: String,
    longitude: String,
    emoji: String,
    emojiU: String,
    wikiDataId: String
});

export default mongoose.models.Country || mongoose.model('Country', CountrySchema);
