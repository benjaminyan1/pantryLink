const express = require('express');
const router = express.Router();

const {
    registerDasher,
    getDasherProfile,
    getAvailableDeliveries,
    acceptDelivery,
    getDeliveryRoute,
    getHeatmap
} = require('../controllers/dasherController');


router.post('/dashers', registerDasher);


router.get('/dashers/:id', getDasherProfile);


router.get('/deliveries/available', getAvailableDeliveries);


router.post('/deliveries/:id/accept', acceptDelivery);


router.get('/deliveries/:id/route', getDeliveryRoute);


router.get('/heatmap', getHeatmap);

module.exports = router;