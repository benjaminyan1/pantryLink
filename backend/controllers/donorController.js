const Donor = require('../models/Donor');
const Item = require('../models/item');
const Nonprofit = require('../models/Nonprofit');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');

// Initialize the Google Generative AI API with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Creates a new donation (subdocument) for an existing Donor.
 * Expects:
 * {
 *   donorId: "abc123...",
 *   items: [
 *     { name: "Item Name", quantity: 1, expirationDate: "2025-12-31", ... },
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

    // Find the donor first to avoid multiple database calls
    const donor = await Donor.findById(donorId);
    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    // Process each item, creating new ones if needed
    const newItems = [];
    const updatedItems = [];

    for (let donationItem of items) {
      let itemId;
      
      // If item has an ID, check if it exists
      if (donationItem.item) {
        const itemExists = await Item.findById(donationItem.item);
        if (!itemExists) {
          // Create new item if ID doesn't exist but name is provided
          if (donationItem.name) {
            const newItem = await Item.create({ name: donationItem.name });
            itemId = newItem._id;
          } else {
            return res.status(400).json({
              error: `Item with ID ${donationItem.item} not found and no name provided to create it`
            });
          }
        } else {
          itemId = donationItem.item;
        }
      } 
      // If item has a name but no ID, check if it exists or create it
      else if (donationItem.name) {
        // Check if item with same name already exists (case insensitive)
        const existingItem = await Item.findOne({ 
          name: { $regex: new RegExp(`^${donationItem.name}$`, 'i') } 
        });
        
        if (existingItem) {
          // Use existing item
          itemId = existingItem._id;
        } else {
          // Create new item
          const newItem = await Item.create({ name: donationItem.name });
          itemId = newItem._id;
        }
      } else {
        return res.status(400).json({
          error: 'Each item must have either an item ID or a name'
        });
      }
      
      // Check if donor already has this item in their donations
      const existingDonationIndex = donor.donations.findIndex(
        donation => donation.item.toString() === itemId.toString() && 
                   donation.status === 'available' &&
                   (donationItem.expirationDate ? 
                     donation.expirationDate && 
                     new Date(donation.expirationDate).toDateString() === 
                     new Date(donationItem.expirationDate).toDateString() : 
                     !donation.expirationDate)
      );

      if (existingDonationIndex !== -1) {
        // Increase quantity of existing donation
        donor.donations[existingDonationIndex].quantity += donationItem.quantity || 1;
        updatedItems.push(donor.donations[existingDonationIndex]);
      } else {
        // Add as new donation
        const newDonation = {
          item: itemId,
          quantity: donationItem.quantity || 1,
          expirationDate: donationItem.expirationDate,
          imageUrl: donationItem.imageUrl,
          status: donationItem.status || 'available'
        };
        newItems.push(newDonation);
      }
    }

    // Add any new items to the donations array
    if (newItems.length > 0) {
      donor.donations.push(...newItems);
    }

    await donor.save();

    return res.status(201).json({
      message: 'Donation processed successfully',
      newItems: newItems.length,
      updatedItems: updatedItems.length,
      donor
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Upload and process donation image
 */
const uploadDonationImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    // Here you would add image processing, analysis, storage logic
    // For now, we'll just return a mock success response
    
    return res.status(200).json({ 
      message: 'Image processed successfully',
      imageUrl: 'https://example.com/placeholder-image.jpg' // This would be your actual uploaded image URL
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Retrieve a specific Donor by ID, including all donation subdocs.
 */
const getDonor = async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id)
      .populate('donations.item');
    
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
 */
const updateDonation = async (req, res) => {
  try {
    const donationId = req.params.id; // subdocument _id
    const { donorId, quantity, expirationDate, status, imageUrl } = req.body;

    if (!donorId) {
      return res.status(400).json({ error: 'donorId is required' });
    }

    // Find the donor
    const donor = await Donor.findById(donorId);
    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    // Find donation by its ID
    const donationIndex = donor.donations.findIndex(d => d._id.toString() === donationId);
    
    if (donationIndex === -1) {
      return res.status(404).json({ error: 'Donation not found' });
    }
    
    // Update fields if provided
    if (quantity !== undefined) donor.donations[donationIndex].quantity = quantity;
    if (expirationDate !== undefined) donor.donations[donationIndex].expirationDate = expirationDate;
    if (status !== undefined) donor.donations[donationIndex].status = status;
    if (imageUrl !== undefined) donor.donations[donationIndex].imageUrl = imageUrl;

    await donor.save();
    return res.status(200).json({
      message: 'Donation updated successfully',
      donation: donor.donations[donationIndex]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete a donation from a donor's donations array
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

    // Find donation index by ID
    const donationIndex = donor.donations.findIndex(d => d._id.toString() === donationId);
    
    if (donationIndex === -1) {
      return res.status(404).json({ error: 'Donation not found' });
    }
    
    // Remove the donation using array splice method
    donor.donations.splice(donationIndex, 1);
    await donor.save();
    
    return res.status(200).json({
      message: 'Donation deleted successfully',
      donorId: donor._id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get nonprofits that have needs matching the donor's available items
 */
const getDonationMatches = async (req, res) => {
  try {
    const { donorId } = req.query;
    
    if (!donorId) {
      return res.status(400).json({ error: 'donorId query parameter is required' });
    }
    
    // Get donor with available donations
    const donor = await Donor.findById(donorId)
      .populate('donations.item')
      .lean();
    
    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }
    
    // Get available donations
    const availableDonations = donor.donations.filter(d => d.status === 'available');
    
    if (availableDonations.length === 0) {
      return res.status(200).json({ 
        message: 'No available donations to match', 
        matches: [] 
      });
    }
    
    // Get item IDs from available donations
    const itemIds = availableDonations.map(d => d.item._id);
    
    // Find nonprofits with matching needs
    const nonprofits = await Nonprofit.find({
      "needs.itemName": { $in: itemIds }
    }).lean();
    
    // Create matches
    const matches = nonprofits.map(nonprofit => {
      const matchingNeeds = nonprofit.needs.filter(need => 
        itemIds.some(id => id.equals(need.itemName))
      );
      
      return {
        nonprofitId: nonprofit._id,
        organizationName: nonprofit.organizationName,
        address: nonprofit.address,
        contactPerson: nonprofit.contactPerson,
        matchingNeeds: matchingNeeds
      };
    });
    
    return res.status(200).json({
      message: 'Matching nonprofits found',
      matches: matches
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get nearby nonprofits based on donor location
 */
const getNearbyNonprofits = async (req, res) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query; // radius in kilometers
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'latitude and longitude are required query parameters' });
    }
    
    // For now, without proper geolocation in the schema, we'll just return all nonprofits
    // In a real implementation, you would use MongoDB's geospatial queries
    const nonprofits = await Nonprofit.find().lean();
    
    return res.status(200).json({
      message: 'Nearby nonprofits found',
      nonprofits: nonprofits.map(np => ({
        id: np._id,
        organizationName: np.organizationName,
        address: np.address,
        contactPerson: np.contactPerson?.name
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Process an image with Gemini Vision and create a donation from detected items
 */
const processImageAndCreateDonation = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const donorId = req.body.donorId;
    if (!donorId) {
      return res.status(400).json({ error: 'donorId is required' });
    }

    // Find the donor first to avoid multiple database calls
    const donor = await Donor.findById(donorId);
    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    // Read the uploaded image file
    const imagePath = req.file.path;
    const imageData = await fs.readFile(imagePath);
    const imageBase64 = imageData.toString('base64');

    // Configure Gemini model for multimodal input
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

    // Prepare the prompt for Gemini
    const prompt = `Analyze this image of food/pantry items and identify all items visible. 
    Return a JSON array in the following format:
    [
      {
        "name": "item name",
        "quantity": estimated quantity (numeric only),
        "expirationDate": null (or date if visible in YYYY-MM-DD format)
      }
    ]
    Be specific about item names (e.g. "Canned Tomatoes" instead of just "Cans"). 
    Make reasonable guesses for quantities based on what you can see.`;

    // Send the image to Gemini API for analysis
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: req.file.mimetype,
          data: imageBase64
        }
      }
    ]);

    // Parse the response to extract items
    const responseText = result.response.text();
    
    // Extract JSON array from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Failed to parse items from image analysis' });
    }

    // Parse the extracted JSON
    const detectedItems = JSON.parse(jsonMatch[0]);

    // Process each detected item, creating new ones if needed
    const newItems = [];
    const updatedItems = [];

    for (let detectedItem of detectedItems) {
      let itemId;

      // Check if item with same name already exists (case insensitive)
      const existingItem = await Item.findOne({ 
        name: { $regex: new RegExp(`^${detectedItem.name}$`, 'i') } 
      });
      
      if (existingItem) {
        // Use existing item
        itemId = existingItem._id;
      } else {
        // Create new item
        const newItem = await Item.create({ name: detectedItem.name });
        itemId = newItem._id;
      }
      
      // Check if donor already has this item in their donations
      const existingDonationIndex = donor.donations.findIndex(
        donation => donation.item.toString() === itemId.toString() && 
                   donation.status === 'available' &&
                   (detectedItem.expirationDate ? 
                     donation.expirationDate && 
                     new Date(donation.expirationDate).toDateString() === 
                     new Date(detectedItem.expirationDate).toDateString() : 
                     !donation.expirationDate)
      );

      if (existingDonationIndex !== -1) {
        // Increase quantity of existing donation
        donor.donations[existingDonationIndex].quantity += detectedItem.quantity || 1;
        updatedItems.push(donor.donations[existingDonationIndex]);
      } else {
        // Add as new donation
        const newDonation = {
          item: itemId,
          quantity: detectedItem.quantity || 1,
          expirationDate: detectedItem.expirationDate || undefined,
          imageUrl: `/uploads/${path.basename(imagePath)}`, // Store the image path
          status: 'available'
        };
        newItems.push(newDonation);
      }
    }

    // Add any new items to the donations array
    if (newItems.length > 0) {
      donor.donations.push(...newItems);
    }

    await donor.save();

    // Clean up the temporary image file
    await fs.unlink(imagePath).catch(err => console.error("File cleanup error:", err));

    return res.status(201).json({
      message: 'Image processed and donation created successfully',
      detectedItems,
      newItems: newItems.length,
      updatedItems: updatedItems.length,
      donor
    });
  } catch (error) {
    console.error('Error processing donation image:', error);
    res.status(500).json({ error: error.message });
  }
};

// Add the new function to module exports
module.exports = {
  createDonation,
  uploadDonationImage,
  getDonor,
  updateDonation,
  deleteDonation,
  getDonationMatches,
  getNearbyNonprofits,
  processImageAndCreateDonation
};
