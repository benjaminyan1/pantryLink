const { GoogleGenerativeAI } = require('@google/generative-ai'); // For Gemini API
const Donor = require('../models/Donor');
const Item = require('../models/item'); // Add this import

// Initialize Gemini API (you'll need to add your API key in environment variables)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Create a new donation
const createDonation = async (req, res) => {
    try {
        const { items } = req.body;
        
        // Basic validation
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Items array is required' });
        }

        // Verify all items exist in the database
        for (let donationItem of items) {
            const itemExists = await Item.findById(donationItem.item);
            if (!itemExists) {
                return res.status(400).json({ 
                    error: `Item with ID ${donationItem.item} not found` 
                });
            }
        }

        // Rest of your creation logic
        res.status(201).json({ message: 'Donation created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Upload and process donation image
const uploadDonationImage = async (req, res) => {
    try {
        // Implementation for processing image with Gemini API
        res.status(200).json({ message: 'Image processed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a specific donation
const getDonation = async (req, res) => {
    try {
        const donation = await Donor.findById(req.params.id)
            .populate('donations.item'); // Add this populate
        if (!donation) {
            return res.status(404).json({ error: 'Donation not found' });
        }
        res.status(200).json(donation);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a donation
const updateDonation = async (req, res) => {
    try {
        // Implementation for updating a donation
        res.status(200).json({ message: 'Donation updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a donation
const deleteDonation = async (req, res) => {
    try {
        // Implementation for deleting a donation
        res.status(200).json({ message: 'Donation deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get donation matches
const getDonationMatches = async (req, res) => {
    try {
        // Implementation for finding matching nonprofits
        res.status(200).json({ message: 'Matches found successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get nearby nonprofits
const getNearbyNonprofits = async (req, res) => {
    try {
        // Implementation for finding nearby nonprofits
        res.status(200).json({ message: 'Nearby nonprofits found successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createDonation,
    uploadDonationImage,
    getDonation,
    updateDonation,
    deleteDonation,
    getDonationMatches,
    getNearbyNonprofits
}; 