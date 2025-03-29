const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    brand: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        enum: ['canned', 'dry', 'fresh', 'frozen', 'hygiene', 'other'],
        default: 'other'
    },
    expirationDate: {
        type: Date
    },
    nutritionalInfo: {
        calories: Number,
        protein: Number,
        allergens: [String]
    },
    unitType: {
        type: String,
        enum: ['piece', 'pound', 'ounce', 'gram', 'package'],
        default: 'piece'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Item', itemSchema); 