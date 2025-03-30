// const { GoogleGenerativeAI } = require('@google/generative-ai'); // For Gemini API
// const Donor = require('../models/Donor');
// const Item = require('../models/item'); // Add this import

// // Initialize Gemini API (you'll need to add your API key in environment variables)
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// // Create a new donation
// const createDonation = async (req, res) => {
//     try {
//         const { items } = req.body;
        
//         // Basic validation
//         if (!items || !Array.isArray(items) || items.length === 0) {
//             return res.status(400).json({ error: 'Items array is required' });
//         }

//         // Verify all items exist in the database
//         for (let donationItem of items) {
//             const itemExists = await Item.findById(donationItem.item);
//             if (!itemExists) {
//                 return res.status(400).json({ 
//                     error: `Item with ID ${donationItem.item} not found` 
//                 });
//             }
//         }

//         // Rest of your creation logic
//         res.status(201).json({ message: 'Donation created successfully' });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// // Upload and process donation image
// const uploadDonationImage = async (req, res) => {
//     try {
//         // Implementation for processing image with Gemini API
//         res.status(200).json({ message: 'Image processed successfully' });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// // Get a specific donation
// const getDonation = async (req, res) => {
//     try {
//         const donation = await Donor.findById(req.params.id)
//             .populate('donations.item'); // Add this populate
//         if (!donation) {
//             return res.status(404).json({ error: 'Donation not found' });
//         }
//         res.status(200).json(donation);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// // Update a donation
// const updateDonation = async (req, res) => {
//     try {
//         // Implementation for updating a donation
//         res.status(200).json({ message: 'Donation updated successfully' });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// // Delete a donation
// const deleteDonation = async (req, res) => {
//     try {
//         // Implementation for deleting a donation
//         res.status(200).json({ message: 'Donation deleted successfully' });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// // Get donation matches
// const getDonationMatches = async (req, res) => {
//     try {
//         // Implementation for finding matching nonprofits
//         res.status(200).json({ message: 'Matches found successfully' });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// // Get nearby nonprofits
// const getNearbyNonprofits = async (req, res) => {
//     try {
//         // Implementation for finding nearby nonprofits
//         res.status(200).json({ message: 'Nearby nonprofits found successfully' });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// module.exports = {
//     createDonation,
//     uploadDonationImage,
//     getDonation,
//     updateDonation,
//     deleteDonation,
//     getDonationMatches,
//     getNearbyNonprofits
// }; 


// const { GoogleGenerativeAI } = require('@google/generative-ai');
const Donor = require('../models/Donor');
const Item = require('../models/item');

// If you actually use the Gemini API, this is fine.
// Otherwise, feel free to remove it.
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Creates a new donation (subdocument) for an existing Donor.
 * Expects:
 * {
 *   donorId: "abc123...",
 *   items: [
 *     { item: "itemId", quantity: 1, expirationDate: "2025-12-31", ... },
 *     ...
 *   ]
 * }
 */
const createDonation = async (req, res) => {
  try {
    const { donorId, items } = req.body;

    // Basic validation
    if (!donorId) {
      return res.status(400).json({ error: 'donorId is required' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    // Verify each item ID exists
    for (let donationItem of items) {
      const itemExists = await Item.findById(donationItem.item);
      if (!itemExists) {
        return res.status(400).json({
          error: `Item with ID ${donationItem.item} not found`
        });
      }
    }

    // Find the donor
    const donor = await Donor.findById(donorId);
    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    // Append new donations to the donor's "donations" array
    // Each element matches the DonationItemSchema in Donor.js
    donor.donations.push(...items);
    await donor.save();

    return res.status(201).json({
      message: 'Donation created successfully',
      donor
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Upload and process donation image
 * (Placeholder for integration with the Gemini API)
 */
const uploadDonationImage = async (req, res) => {
  try {
    // Implementation for your image processing
    // e.g., analyzing, storing to a cloud, etc.
    return res.status(200).json({ message: 'Image processed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Retrieve a specific Donor by ID, including all donation subdocs.
 * GET /api/donors/:id
 */
const getDonor = async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id)
      .populate('donations.item'); // This ensures your item details are loaded
    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }
    return res.status(200).json(donor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update a single donation in the Donor's "donations" array.
 * Expects:
 *   req.params.id => the donation subdocument _id (not the Donor _id)
 *   req.body => { donorId, quantity?, expirationDate?, status?, ... }
 */
const updateDonation = async (req, res) => {
  try {
    const donationId = req.params.id; // subdocument _id
    const { donorId, ...updates } = req.body;

    if (!donorId) {
      return res.status(400).json({ error: 'donorId is required' });
    }

    // Find the donor
    const donor = await Donor.findById(donorId);
    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    // Locate the specific donation subdoc
    const donationSubdoc = donor.donations.id(donationId);
    if (!donationSubdoc) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    // Update the fields on the subdoc
    Object.keys(updates).forEach(field => {
      donationSubdoc[field] = updates[field];
    });

    await donor.save();
    return res.status(200).json({
      message: 'Donation updated successfully',
      donor
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete a donation subdocument from the Donor's "donations" array.
 * Expects:
 *   req.params.id => the donation subdocument _id
 *   req.body => { donorId }
 */
const deleteDonation = async (req, res) => {
  try {
    const donationId = req.params.id;
    const { donorId } = req.body;

    if (!donorId) {
      return res.status(400).json({ error: 'donorId is required' });
    }

    // Find the donor
    const donor = await Donor.findById(donorId);
    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    // Locate and remove the donation subdocument
    const donationSubdoc = donor.donations.id(donationId);
    if (!donationSubdoc) {
      return res.status(404).json({ error: 'Donation not found' });
    }
    donationSubdoc.remove();

    await donor.save();
    return res.status(200).json({
      message: 'Donation deleted successfully',
      donor
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get donation matches
 * (Placeholder logic; adapt as needed for your matching flow)
 */
const getDonationMatches = async (req, res) => {
  try {
    // Implementation for finding matching nonprofits
    return res.status(200).json({ message: 'Matches found successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get nearby nonprofits
 * (Placeholder logic; adapt as needed for your geolocation flow)
 */
const getNearbyNonprofits = async (req, res) => {
  try {
    // Implementation for finding nearby nonprofits
    return res.status(200).json({ message: 'Nearby nonprofits found successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createDonation,
  uploadDonationImage,
  getDonor,
  updateDonation,
  deleteDonation,
  getDonationMatches,
  getNearbyNonprofits
};
