const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// Import nonprofit model
const Nonprofit = require("../models/Nonprofit");

// Create nonprofit profile
router.post("/", async (req, res) => {
    try {
        const newNonprofit = new Nonprofit(req.body);
        await newNonprofit.save();
        res.status(201).json(newNonprofit);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Get nonprofit profile
router.get("/:id", async (req, res) => {
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
router.put("/:id", async (req, res) => {
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

router.post("/needs", async (req, res) => {
    try {
        const { nonprofitId, needs } = req.body; // needs should now include item IDs
        const nonprofit = await Nonprofit.findById(nonprofitId);
        if (!nonprofit) {
            return res.status(404).json({ message: "Nonprofit not found" });
        }
        // Update needs to reflect item IDs
        nonprofit.needs = needs.map(need => ({
            itemId: need.itemId, // Assuming needs now contains itemId
            quantity: need.quantity,
            urgency: need.urgency
        }));
        await nonprofit.save();
        res.json(nonprofit);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// View specific item need
router.get("/needs/:id", async (req, res) => {
    try {
        const nonprofit = await Nonprofit.findOne({ "needs._id": req.params.id });
        if (!nonprofit) {
            return res.status(404).json({ message: "Need not found" });
        }
        const need = nonprofit.needs.id(req.params.id);
        res.json(need);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// View matched or upcoming donations
router.get("/donations", async (req, res) => {
    try {
        const nonprofits = await Nonprofit.find({ "upcomingDeliveries.status": { $ne: "delivered" } });
        res.json(nonprofits);
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
        res.json(need);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;
