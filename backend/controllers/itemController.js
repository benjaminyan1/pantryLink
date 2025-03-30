const Item = require('../models/item');


const createItem = async (req, res) => {
    try {
        const { name } = req.body;

        
        if (!name) {
            return res.status(400).json({ error: 'Item name is required' });
        }

        
        const existingItem = await Item.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (existingItem) {
            return res.status(400).json({ error: 'An item with this name already exists' });
        }

        const item = await Item.create({ name });

        res.status(201).json(item);
    } catch (error) {
        
        if (error.code === 11000) {
            return res.status(400).json({ error: 'An item with this name already exists' });
        }
        res.status(500).json({ error: error.message });
    }
};


const getAllItems = async (req, res) => {
    try {
        const { category, brand, search } = req.query;
        let query = {};

        
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


const updateItem = async (req, res) => {
    try {
        const { name } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Item name is required' });
        }
        
        const item = await Item.findByIdAndUpdate(
            req.params.id,
            { name },
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