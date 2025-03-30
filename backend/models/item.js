const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true  // Add unique constraint
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Item', itemSchema);