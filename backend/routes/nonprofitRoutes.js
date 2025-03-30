const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Item = require("../models/item"); // Adjust the path to match the correct casing

// Import nonprofit model
const Nonprofit = require("../models/Nonprofit");

// Create nonprofit profile
// DONT NEED THIS POST REQUEST ANYMORE
// router.post("/", async (req, res) => {
//     try {
//         const newNonprofit = new Nonprofit(req.body);
//         await newNonprofit.saxve();
//         res.status(201).json(newNonprofit);
//     } catch (error) {
//         res.status(500).json({ message: "Server error", error: error.message });
//     }
// });

// Get nonprofit profile
// WORKS
router.get("/profile/:id", async (req, res) => {
    try {
        const nonprofit = await Nonprofit.findById(req.params.id);
        if (!nonprofit) {
            return res.status(404).json({ message: "Nonprofit not found" });
        }
        res.json(nonprofit);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Update profile
router.put("/profile/:id", async (req, res) => {
    try {
        const updatedNonprofit = await Nonprofit.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedNonprofit) {
            return res.status(404).json({ message: "Nonprofit not found" });
        } 
        res.json(updatedNonprofit);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Get a dictionary from id to addresses
// WORKS 
router.get("/addresses", async (req, res) => {
    try {
        const nonprofits = await Nonprofit.find().lean();
        const addressDictionary = {};
        nonprofits.forEach(nonprofit => {
            if (nonprofit.address) { 
                addressDictionary[nonprofit._id] = nonprofit.address;
            }
        });
        res.json(addressDictionary);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Post request for ID does not work because it's not checking the ID correctly or something, 
// it says item not found
router.post("/needs/:id", async (req, res) => {
    try {
        const { need } = req.body;  
        const nonprofitId = req.params.id;  
        const nonprofit = await Nonprofit.findById(nonprofitId);

        if (!nonprofit) {
            return res.status(404).json({ message: "Nonprofit not found" });
        }
        const itemDetails = await Item.findById(need.itemId);
        if (!itemDetails) {
            return res.status(404).json({ message: "Item not found" });
        }
        const itemName = itemDetails.name; 

        nonprofit.needs.push({
            itemName: itemName, 
            quantity: need.quantity,
            urgency: need.urgency
        });        

        await nonprofit.save();
        res.json(nonprofit);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// works
router.get("/needs/:id", async (req, res) => {
    try {
        const nonprofitId = req.params.id; // Get nonprofit ID from the request parameters
        const nonprofit = await Nonprofit.findById(nonprofitId);
        if (!nonprofit) {
            return res.status(404).json({ message: "Nonprofit not found" });
        }
        
        res.json(nonprofit.needs); // Return the array of needs for the nonprofit
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// I think it works, check functionality of filtering based on delivery status later
router.get("/donations/:id", async (req, res) => {
    try {
        const nonprofit = await Nonprofit.findById(req.params.id);
        if (!nonprofit) {
            return res.status(404).json({ message: "Nonprofit not found" });
        }
        const deliveredDeliveries = nonprofit.upcomingDeliveries.filter(delivery => delivery.status === "delivered");
        res.json(deliveredDeliveries);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Set priority/urgency for an item
router.put("/needs/:id/priority", async (req, res) => { 
    try {
        const { priority } = req.body;
        const nonprofit = await Nonprofit.findOne({ "needs._id": req.params.id });
        if (!nonprofit) {
            return res.status(404).json({ message: "Need not found" });
    } 
        const need = nonprofit.needs.id(req.params.id);
        need.urgency = priority;
        await nonprofit.save();
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;
