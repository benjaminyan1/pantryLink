const express = require('express');
const router = express.Router();
const {
    createItem,
    getAllItems,
    getItem,
    updateItem,
    deleteItem
} = require('../controllers/itemController');


router.post('/items', createItem);


router.get('/items', getAllItems);


router.get('/items/:id', getItem);


router.put('/items/:id', updateItem);


router.delete('/items/:id', deleteItem);

module.exports = router; 