const Donor = require('../models/Donor');
const Item = require('../models/item');
const Nonprofit = require('../models/Nonprofit');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const createDonation = async (req, res) => {
  try {
    const { donorId, items } = req.body;

    
    if (!donorId) {
      return res.status(400).json({ error: 'donorId is required' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    
    const donor = await Donor.findById(donorId);
    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    
    const newItems = [];
    const updatedItems = [];

    for (let donationItem of items) {
      let itemId;
      
      
      if (donationItem.item) {
        const itemExists = await Item.findById(donationItem.item);
        if (!itemExists) {
          
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
      
      else if (donationItem.name) {
        
        const existingItem = await Item.findOne({ 
          name: { $regex: new RegExp(`^${donationItem.name}$`, 'i') } 
        });
        
        if (existingItem) {
          
          itemId = existingItem._id;
        } else {
          
          const newItem = await Item.create({ name: donationItem.name });
          itemId = newItem._id;
        }
      } else {
        return res.status(400).json({
          error: 'Each item must have either an item ID or a name'
        });
      }
      
      
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
        
        donor.donations[existingDonationIndex].quantity += donationItem.quantity || 1;
        updatedItems.push(donor.donations[existingDonationIndex]);
      } else {
        
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

const uploadDonationImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    
    
    
    return res.status(200).json({ 
      message: 'Image processed successfully',
      imageUrl: 'https://example.com/placeholder-image.jpg'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

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

const updateDonation = async (req, res) => {
  try {
    const donationId = req.params.id; 
    const { donorId, quantity, expirationDate, status, imageUrl } = req.body;

    if (!donorId) {
      return res.status(400).json({ error: 'donorId is required' });
    }

    
    const donor = await Donor.findById(donorId);
    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    
    const donationIndex = donor.donations.findIndex(d => d._id.toString() === donationId);
    
    if (donationIndex === -1) {
      return res.status(404).json({ error: 'Donation not found' });
    }
    
    
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

const deleteDonation = async (req, res) => {
  try {
    const donationId = req.params.id;
    const { donorId } = req.body;

    if (!donorId) {
      return res.status(400).json({ error: 'donorId is required' });
    }

    
    const donor = await Donor.findById(donorId);
    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    
    console.error('Donation ID:', donationId);
    console.error('Donor donations:', donor.donations);
    const donationIndex = donor.donations.findIndex(d => d._id.toString() === donationId);
    
    if (donationIndex === -1) {
      return res.status(404).json({ error: 'Donation not found' });
    }
    
    
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

const getDonationMatches = async (req, res) => {
  try {
    const { donorId } = req.query;
    
    if (!donorId) {
      return res.status(400).json({ error: 'donorId query parameter is required' });
    }
    
    
    const donor = await Donor.findById(donorId)
      .populate('donations.item')
      .lean();
    
    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }
    
    
    const availableDonations = donor.donations.filter(d => d.status === 'available');
    
    if (availableDonations.length === 0) {
      return res.status(200).json({ 
        message: 'No available donations to match', 
        matches: [] 
      });
    }
    
    
    const itemIds = availableDonations.map(d => d.item._id);
    
    
    const nonprofits = await Nonprofit.find({
      "needs.itemName": { $in: itemIds }
    }).lean();
    
    
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
    const { latitude, longitude, radius = 10 } = req.query; 
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'latitude and longitude are required query parameters' });
    }
    
    
    
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

const processImageAndCreateDonation = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const donorId = req.body.donorId;
    if (!donorId) {
      return res.status(400).json({ error: 'donorId is required' });
    }

    
    const donor = await Donor.findById(donorId);
    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    
    const imagePath = req.file.path;
    console.log('Image path:', imagePath);
    const imageData = await fs.readFile(imagePath);
    const imageBase64 = imageData.toString('base64');

    
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    
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
    Don't be too specific though. Don't say things like brand names or "organic". Also, don't say things like "Italian dressing," just say "dressing".
    Make reasonable guesses for quantities based on what you can see.`;

    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: req.file.mimetype,
          data: imageBase64
        }
      }
    ]);

    
    const responseText = result.response.text();
    
    
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Failed to parse items from image analysis' });
    }

    
    const detectedItems = JSON.parse(jsonMatch[0]);

    
    const newItems = [];
    const updatedItems = [];

    for (let detectedItem of detectedItems) {
      let itemId;

      
      const existingItem = await Item.findOne({ 
        name: { $regex: new RegExp(`^${detectedItem.name}$`, 'i') } 
      });
      
      if (existingItem) {
        
        itemId = existingItem._id;
      } else {
        
        const newItem = await Item.create({ name: detectedItem.name });
        itemId = newItem._id;
      }
      
      
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
        
        donor.donations[existingDonationIndex].quantity += detectedItem.quantity || 1;
        updatedItems.push(donor.donations[existingDonationIndex]);
      } else {
        
        const newDonation = {
          item: itemId,
          quantity: detectedItem.quantity || 1,
          expirationDate: detectedItem.expirationDate || undefined,
          imageUrl: `/uploads/${path.basename(imagePath)}`, 
          status: 'available'
        };
        newItems.push(newDonation);
      }
    }

    
    if (newItems.length > 0) {
      donor.donations.push(...newItems);
    }

    await donor.save();

    
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
