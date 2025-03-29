const Item = require('../models/item');

// Create a new item
const createItem = async (req, res) => {
    try {
        const { name, description, brand, category, expirationDate, nutritionalInfo, unitType } = req.body;

        // Basic validation
        if (!name) {
            return res.status(400).json({ error: 'Item name is required' });
        }

        const item = await Item.create({
            name,
            description,
            brand,
            category,
            expirationDate,
            nutritionalInfo,
            unitType
        });

        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all items
const getAllItems = async (req, res) => {
    try {
        const { category, brand, search } = req.query;
        let query = {};

        // Add filters if provided
        if (category) query.category = category;
        if (brand) query.brand = brand;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const items = await Item.find(query).sort({ name: 1 });
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a specific item
const getItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update an item
const updateItem = async (req, res) => {
    try {
        const { name, description, brand, category, expirationDate, nutritionalInfo, unitType } = req.body;
        
        const item = await Item.findByIdAndUpdate(
            req.params.id,
            {
                name,
                description,
                brand,
                category,
                expirationDate,
                nutritionalInfo,
                unitType
            },
            { new: true, runValidators: true }
        );

        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete an item
const deleteItem = async (req, res) => {
    try {
        const item = await Item.findByIdAndDelete(req.params.id);
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createItem,
    getAllItems,
    getItem,
    updateItem,
    deleteItem
}; 