const express = require('express');
const router = express.Router();

const {
    createDelivery,
    getDelivery,
    updateDeliveryStatus,
    getUserDeliveries
} = require('../controllers/deliveryController');


router.post('/deliveries', createDelivery);


router.get('/deliveries/:id', getDelivery);


router.put('/deliveries/:id/status', updateDeliveryStatus);


router.get('/users/:id/deliveries', getUserDeliveries);

module.exports = router; 