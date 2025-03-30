const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Item = require("../models/item"); // Adjust the path to match the correct casing
const Delivery = require('../models/delivery');
// Import nonprofit model
const axios = require('axios');
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
// Don't need to implement this because nonprofits aren't changing their profile
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
// WORKS
router.post("/needs/:id", async (req, res) => {
    try {
        const { need } = req.body;  
        const nonprofitId = req.params.id;  
        const nonprofit = await Nonprofit.findById(nonprofitId);
        let item = await Item.findOne({ name: need.itemName });
        if (!nonprofit) {
            return res.status(404).json({ message: "Nonprofit not found" });
        }
        if (!item) {
            const response = await axios.post('http://localhost:3000/api/items', {name: need.itemName});
            item = response.data;
            nonprofit.needs.push({
                itemId: item._id, 
                quantity: need.quantity,
                urgency: need.urgency
            });
            await nonprofit.save();
            res.json(nonprofit);
            return;
        }
        const itemExists = nonprofit.needs.some(existingNeed => existingNeed.itemId.toString() === item._id.toString());
        
        if (itemExists) {
            return res.status(400).json({ message: "This item already exists in the nonprofit's needs" });
        }
        nonprofit.needs.push({
            itemId: item._id, 
            quantity: need.quantity,
            urgency: need.urgency
        });
        // if (item) {
        //     nonprofit.needs.push({
        //     itemId: item._id, 
        //     quantity: need.quantity,
        //     urgency: need.urgency
        // }); 
        // }

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
        const nonprofit = await Nonprofit.findById(nonprofitId)
            .populate("needs.itemId", "name");

        if (!nonprofit) {
            return res.status(404).json({ message: "Nonprofit not found" });
        }
        const formattedNeeds = nonprofit.needs.map(need => ({
            itemName: need.itemId.name, // Get the item name from populated data
            quantity: need.quantity,
            urgency: need.urgency
        }));
        res.json(formattedNeeds); // Return the array of needs for the nonprofit
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

//WORKS
router.delete("/needs/:id", async (req, res) => {
    try {
        const { itemName } = req.body;  // Get the item name from the body
        const nonprofitId = req.params.id;  // Get nonprofit ID from the request parameters
        
        const nonprofit = await Nonprofit.findById(nonprofitId);
        
        if (!nonprofit) {
            return res.status(404).json({ message: "Nonprofit not found" });
        }

        // Find the index of the need in the nonprofit's needs array by item name
        const item = await Item.findOne({ name: itemName });
        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }
        const needIndex = nonprofit.needs.findIndex(need => need.itemId.equals(item._id));
        
        if (needIndex === -1) {
            return res.status(404).json({ message: "Item not in the nonprofit's needs" });
        }

        // Remove the item from the needs array
        nonprofit.needs.splice(needIndex, 1);

        // Save the updated nonprofit
        await nonprofit.save();
        
        res.json({ message: "Item removed successfully", nonprofit });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Update need for a nonprofit
router.put("/needs/:id", async (req, res) => {
    try {
        const { need } = req.body;  // Get the item name, quantity, and urgency from the body
        const nonprofitId = req.params.id;  // Get nonprofit ID from the request parameters
        
        const nonprofit = await Nonprofit.findById(nonprofitId);
        
        if (!nonprofit) {
            return res.status(404).json({ message: "Nonprofit not found" });
        }

        // Find the item in the Items collection based on item name
        const item = await Item.findOne({ name: need.itemName });
        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }

        // Find the index of the need in the nonprofit's needs array by comparing ObjectIds
        const needIndex = nonprofit.needs.findIndex(need => need.itemId.equals(item._id));

        if (needIndex === -1) {
            return res.status(404).json({ message: "Item not in the nonprofit's needs" });
        }

        // Update the quantity and urgency for the found need
        nonprofit.needs[needIndex].quantity = need.quantity;
        nonprofit.needs[needIndex].urgency = need.urgency;

        // Save the updated nonprofit
        await nonprofit.save();
        
        res.json({ message: "Need updated successfully", nonprofit });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Should work
router.post("/donations/:id", async (req, res) => {
    try {
        const { delivery } = req.body;
        const nonprofit = await Nonprofit.findById(req.params.id);
        if (!nonprofit) {
            return res.status(404).json({ message: "Nonprofit not found" });
        }
        const deliveryID = delivery.deliveryID; // Assuming delivery is an object with an _id property
        const output = await Delivery.findById(deliveryID);
        if (!output) {
            return res.status(404).json({ message: "Delivery not found" });
        }
        nonprofit.upcomingDeliveries.push(output);
        await nonprofit.save();
        res.json(nonprofit);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// DOESNT DO WHAT WE WANT, need to get all the id's in the array and then get the delivery information from the delivery model
// router.get("/donations/:id", async (req, res) => {
//     try {
//         const nonprofit = await Nonprofit.findById(req.params.id);
//         if (!nonprofit) {
//             return res.status(404).json({ message: "Nonprofit not found" });
//         }
//         const deliveredDeliveries = nonprofit.upcomingDeliveries.filter(delivery => delivery.status === "delivered");
//         res.json(deliveredDeliveries);
//     } catch (error) {
//         res.status(500).json({ message: "Server error", error: error.message });
//     }
// });

// Get all donations for a nonprofit sorted by priority
// works
router.get("/priority/:id", async (req, res) => {
    try {
        const nonprofitId = req.params.id; // Get nonprofit ID from the request parameters
        
        // Find the nonprofit and populate the item details
        const nonprofit = await Nonprofit.findById(nonprofitId)
            .populate("needs.itemId", "name"); // Populate itemName from the Item collection
        
        if (!nonprofit) {
            return res.status(404).json({ message: "Nonprofit not found" });
        }
        
        // Sort the needs array by urgency in descending order
        const sortedNeeds = nonprofit.needs.sort((a, b) => b.urgency - a.urgency);

        // Format the sorted needs to return item name, quantity, and urgency
        const formattedNeeds = sortedNeeds.map(need => ({
            itemName: need.itemId.name, // Get the item name from populated data
            quantity: need.quantity,
            urgency: need.urgency
        }));

        res.json(formattedNeeds); // Return the sorted needs list
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;