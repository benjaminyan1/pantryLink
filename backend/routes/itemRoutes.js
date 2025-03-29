const express = require('express');
const router = express.Router();
const {
    createItem,
    getAllItems,
    getItem,
    updateItem,
    deleteItem
} = require('../controllers/itemController');

// Create a new item
router.post('/items', createItem);

// Get all items
router.get('/items', getAllItems);

// Get a specific item
router.get('/items/:id', getItem);

// Update an item
router.put('/items/:id', updateItem);

// Delete an item
router.delete('/items/:id', deleteItem);

module.exports = router; 