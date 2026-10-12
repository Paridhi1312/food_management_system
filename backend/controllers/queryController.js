const mongoose = require('mongoose');
const {
  SurplusFood,
  FoodRequest,
  Donor,
  Delivery,
  Volunteer,
  Vehicle,
  Shelter,
} = require('../models');

// GET /api/queries/all
// Executes predefined queries demonstrating MongoDB query operators
const executeAdvancedQueries = async (req, res) => {
  const { queryType, shelterId, maxHours } = req.query;

  try {
    let result = null;
    let description = '';
    let filterUsed = {};

    switch (queryType) {
      // 1. Find available surplus food (not expired and status Available)
      case 'availableSurplus': {
        const now = new Date();
        filterUsed = { status: 'Available', expiryTime: { $gt: now } };
        result = await SurplusFood.find(filterUsed)
          .populate('donorId', 'name type phone')
          .populate({
            path: 'foodItemId',
            populate: { path: 'categoryId', select: 'name' },
          })
          .sort({ expiryTime: 1 });
        description = 'Active surplus food records that have not yet expired and have status Available';
        break;
      }

      // 2. Find food expiring within 24 hours (or specified hours)
      case 'expiringSoon': {
        const hours = parseInt(maxHours) || 24;
        const now = new Date();
        const futureLimit = new Date(now.getTime() + hours * 60 * 60 * 1000);
        filterUsed = {
          expiryTime: { $gt: now, $lte: futureLimit },
          status: { $in: ['Available', 'Reserved'] },
        };
        result = await SurplusFood.find(filterUsed)
          .populate('donorId', 'name phone email')
          .populate('foodItemId', 'name vegetarian')
          .sort({ expiryTime: 1 });
        description = `Food expiring within the next ${hours} hours that requires immediate dispatch`;
        break;
      }

      // 3. Find pending food requests
      case 'pendingRequests': {
        filterUsed = { status: { $in: ['Pending', 'Partially Fulfilled'] } };
        result = await FoodRequest.find(filterUsed)
          .populate('ngoId', 'name phone email')
          .populate('shelterId', 'name capacity')
          .sort({ priority: -1, requiredBefore: 1 });
        description = 'Pending and partially fulfilled requests sorted by priority and urgency';
        break;
      }

      // 4. Find donors with multiple donations
      case 'multipleDonations': {
        const donorsWithMultiple = await Donor.aggregate([
          {
            $lookup: {
              from: 'donations',
              localField: '_id',
              foreignField: 'donorId',
              as: 'donations',
            },
          },
          {
            $project: {
              donorId: 1,
              name: 1,
              type: 1,
              email: 1,
              phone: 1,
              donationCount: { $size: '$donations' },
            },
          },
          { $match: { donationCount: { $gt: 1 } } },
          { $sort: { donationCount: -1 } },
        ]);
        result = donorsWithMultiple;
        description = 'Donors who have contributed 2 or more separate food donations';
        filterUsed = { donationCount: { $gt: 1 } };
        break;
      }

      // 5. Find deliveries for a selected shelter
      case 'shelterDeliveries': {
        let filter = {};
        if (shelterId && mongoose.Types.ObjectId.isValid(shelterId)) {
          filter.shelterId = shelterId;
        }
        filterUsed = filter;
        result = await Delivery.find(filter)
          .populate('shelterId', 'name capacity address')
          .populate('beneficiaryId', 'name contact')
          .populate('routeId')
          .populate({
            path: 'surplusId',
            populate: { path: 'foodItemId', select: 'name' },
          })
          .sort({ deliveryTime: -1 });
        description = 'Delivery history and dispatches associated with specified shelter';
        break;
      }

      // 6. Find available volunteers and vehicles
      case 'availableVolunteersAndVehicles': {
        const [volunteers, vehicles] = await Promise.all([
          Volunteer.find({ status: 'Available' }),
          Vehicle.find({ status: 'Available' }),
        ]);
        result = { volunteers, vehicles };
        description = 'Currently available logistics personnel and vehicles ready for dispatch';
        filterUsed = { status: 'Available' };
        break;
      }

      // 7. Sort food by expiry time (ascending - most urgent first)
      case 'sortByExpiry': {
        filterUsed = {};
        result = await SurplusFood.find(filterUsed)
          .populate('donorId', 'name')
          .populate('foodItemId', 'name')
          .sort({ expiryTime: 1 });
        description = 'All surplus food listings ordered chronologically by closest expiration date';
        break;
      }

      // 8. Filter requests by priority and deadline
      case 'filterRequests': {
        const { priority, maxDate } = req.query;
        let query = {};
        if (priority) query.priority = priority;
        if (maxDate) query.requiredBefore = { $lte: new Date(maxDate) };
        filterUsed = query;
        result = await FoodRequest.find(query)
          .populate('ngoId', 'name')
          .populate('shelterId', 'name')
          .sort({ requiredBefore: 1 });
        description = 'Food requests filtered by specific priority level and target deadline';
        break;
      }

      default:
        return res.status(400).json({
          success: false,
          error: 'Please specify a valid queryType parameter',
          validOptions: [
            'availableSurplus',
            'expiringSoon',
            'pendingRequests',
            'multipleDonations',
            'shelterDeliveries',
            'availableVolunteersAndVehicles',
            'sortByExpiry',
            'filterRequests',
          ],
        });
    }

    res.json({
      success: true,
      queryType,
      description,
      filterUsed,
      count: Array.isArray(result) ? result.length : (result?.volunteers?.length || 0),
      data: result,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Intelligent Request-to-Surplus Matching Engine
// Matches pending food requests with available surplus food using quantity, category, expiry, and deadline
const matchFoodRequests = async (req, res) => {
  try {
    const { requestId } = req.params;
    let request;

    if (mongoose.Types.ObjectId.isValid(requestId)) {
      request = await FoodRequest.findById(requestId).populate('ngoId').populate('shelterId');
    } else {
      request = await FoodRequest.findOne({ requestId }).populate('ngoId').populate('shelterId');
    }

    if (!request) {
      return res.status(404).json({ success: false, error: 'Food request not found' });
    }

    const remainingRequired = request.quantityRequired - (request.fulfilledQuantity || 0);

    // Find surplus food that:
    // 1. Is not expired (expiryTime > now)
    // 2. Is before the request's deadline or adequate for redistribution
    // 3. Has available unallocated quantity > 0
    // 4. Status is 'Available' or 'Reserved'
    const now = new Date();
    const candidates = await SurplusFood.find({
      status: { $in: ['Available', 'Reserved'] },
      expiryTime: { $gt: now },
    })
      .populate('donorId')
      .populate({
        path: 'foodItemId',
        populate: { path: 'categoryId' },
      })
      .populate('locationId');

    const matches = candidates.map((surplus) => {
      const availableQty = surplus.quantity - (surplus.allocatedQuantity || 0);
      if (availableQty <= 0) return null;

      // Evaluation criteria
      let matchScore = 0;
      let reasons = [];

      // 1. Expiration check
      const hoursToExpiry = Math.max(0, (new Date(surplus.expiryTime) - now) / (1000 * 60 * 60));
      const hoursToDeadline = (new Date(request.requiredBefore) - now) / (1000 * 60 * 60);

      if (new Date(surplus.expiryTime) >= new Date(request.requiredBefore)) {
        matchScore += 40;
        reasons.push(`Shelf life expires AFTER target deadline (${hoursToExpiry.toFixed(1)} hrs shelf-life remaining)`);
      } else if (hoursToExpiry > 6) {
        matchScore += 20;
        reasons.push(`Can be delivered before early expiration (${hoursToExpiry.toFixed(1)} hrs shelf-life remaining)`);
      } else {
        reasons.push(`Critical shelf life warning: only ${hoursToExpiry.toFixed(1)} hrs left`);
      }

      // 2. Quantity capability
      if (availableQty >= remainingRequired) {
        matchScore += 40;
        reasons.push(`Fully satisfies remaining requirement (${availableQty} ${surplus.unit} available >= ${remainingRequired} requested)`);
      } else {
        const percent = Math.round((availableQty / remainingRequired) * 100);
        matchScore += Math.min(35, Math.round(percent * 0.35));
        reasons.push(`Partially satisfies requirement (${availableQty} ${surplus.unit} available, covering ${percent}%)`);
      }

      // 3. Packaging & status
      if (surplus.packagingType === 'Sealed Container' || surplus.packagingType === 'Insulated Crate') {
        matchScore += 10;
        reasons.push(`High durability packaging (${surplus.packagingType})`);
      }

      if (surplus.status === 'Available') {
        matchScore += 10;
        reasons.push('Immediately ready for dispatch (Status: Available)');
      }

      return {
        surplus,
        matchScore: Math.min(100, matchScore),
        availableQuantity: availableQty,
        matchReasons: reasons,
        isFullMatch: availableQty >= remainingRequired,
      };
    }).filter(Boolean);

    // Sort by highest match score
    matches.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      success: true,
      request: {
        id: request._id,
        requestId: request.requestId,
        quantityRequired: request.quantityRequired,
        fulfilledQuantity: request.fulfilledQuantity,
        remainingRequired,
        requiredBefore: request.requiredBefore,
        priority: request.priority,
        status: request.status,
        ngo: request.ngoId?.name,
      },
      matchCount: matches.length,
      matches,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Allocate food from Surplus to Request
const allocateFood = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { requestId, surplusId, allocateQuantity } = req.body;

    const qty = parseFloat(allocateQuantity);
    if (!qty || qty <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, error: 'Allocation quantity must be greater than 0' });
    }

    const surplus = await SurplusFood.findById(surplusId).session(session);
    if (!surplus) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, error: 'Surplus food record not found' });
    }

    // Expiry check
    if (new Date(surplus.expiryTime) < new Date()) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, error: 'Cannot allocate expired food!' });
    }

    const availableQty = surplus.quantity - (surplus.allocatedQuantity || 0);
    if (qty > availableQty) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: `Requested allocation (${qty}) exceeds available quantity (${availableQty})`,
      });
    }

    const request = await FoodRequest.findById(requestId).session(session);
    if (!request) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, error: 'Food request not found' });
    }

    const remainingRequired = request.quantityRequired - (request.fulfilledQuantity || 0);
    if (qty > remainingRequired) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: `Cannot allocate more than needed (${remainingRequired} remaining required)`,
      });
    }

    // Update surplus
    surplus.allocatedQuantity = (surplus.allocatedQuantity || 0) + qty;
    if (surplus.allocatedQuantity >= surplus.quantity) {
      surplus.status = 'Allocated';
    } else {
      surplus.status = 'Reserved';
    }
    await surplus.save({ session });

    // Update request
    request.fulfilledQuantity = (request.fulfilledQuantity || 0) + qty;
    request.matchedSurplusId = surplus._id;
    if (request.fulfilledQuantity >= request.quantityRequired) {
      request.status = 'Fulfilled';
    } else {
      request.status = 'Partially Fulfilled';
    }
    await request.save({ session });

    await session.commitTransaction();

    res.json({
      success: true,
      message: `Successfully allocated ${qty} units of food.`,
      data: {
        surplus: { id: surplus._id, status: surplus.status, allocatedQuantity: surplus.allocatedQuantity },
        request: { id: request._id, status: request.status, fulfilledQuantity: request.fulfilledQuantity },
      },
    });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ success: false, error: err.message });
  } finally {
    session.endSession();
  }
};

module.exports = {
  executeAdvancedQueries,
  matchFoodRequests,
  allocateFood,
};
