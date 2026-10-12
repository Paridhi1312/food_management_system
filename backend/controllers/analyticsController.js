const {
  Donor,
  SurplusFood,
  FoodItem,
  FoodCategory,
  NGO,
  Shelter,
  Beneficiary,
  Volunteer,
  Vehicle,
  FoodRequest,
  Pickup,
  Delivery,
  Location,
  Route,
  Donation,
  Feedback,
} = require('../models');

// GET /api/analytics/dashboard
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalDonors,
      totalSurplusListings,
      totalDonations,
      pendingFoodRequests,
      activePickups,
      completedDeliveries,
      donatedAggregation,
      deliveredAggregation,
      recentDonations,
      donationTrends,
      foodStatusDistribution,
    ] = await Promise.all([
      Donor.countDocuments(),
      SurplusFood.countDocuments(),
      Donation.countDocuments(),
      FoodRequest.countDocuments({ status: { $in: ['Pending', 'Partially Fulfilled'] } }),
      Pickup.countDocuments({ status: { $in: ['Scheduled', 'In Progress'] } }),
      Delivery.countDocuments({ status: 'Delivered' }),

      // Total quantity donated
      Donation.aggregate([
        { $group: { _id: null, totalQuantity: { $sum: '$quantityDonated' } } },
      ]),

      // Total quantity delivered
      Delivery.aggregate([
        { $match: { status: 'Delivered' } },
        { $group: { _id: null, totalDelivered: { $sum: '$quantityDelivered' } } },
      ]),

      // Recent donations (populated)
      Donation.find()
        .sort({ donationDate: -1 })
        .limit(6)
        .populate('donorId', 'name type phone email')
        .populate({
          path: 'surplusFoodId',
          populate: { path: 'foodItemId', select: 'name' },
        }),

      // Donation trends by month
      Donation.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$donationDate' },
              month: { $month: '$donationDate' },
            },
            count: { $sum: 1 },
            totalQuantity: { $sum: '$quantityDonated' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        {
          $project: {
            _id: 0,
            month: {
              $concat: [
                { $toString: '$_id.month' },
                '/',
                { $toString: '$_id.year' },
              ],
            },
            count: 1,
            totalQuantity: 1,
          },
        },
      ]),

      // Surplus Food Status Distribution
      SurplusFood.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalQuantity: { $sum: '$quantity' },
          },
        },
        { $project: { _id: 0, status: '$_id', count: 1, totalQuantity: 1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalDonors,
        totalSurplusListings,
        totalDonations,
        pendingFoodRequests,
        activePickups,
        completedDeliveries,
        totalQuantityDonated: donatedAggregation[0]?.totalQuantity || 0,
        totalQuantityDelivered: deliveredAggregation[0]?.totalDelivered || 0,
        recentDonations,
        donationTrends,
        foodStatusDistribution,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/analytics/aggregations
// 7 required Aggregation Pipelines demonstrating $match, $group, $sort, $project, $lookup, $unwind
const getAggregations = async (req, res) => {
  const { pipelineId } = req.query;

  try {
    const pipelines = {};

    // 1. Total quantity donated by each donor
    const pipeline1 = [
      {
        $lookup: {
          from: 'donors',
          localField: 'donorId',
          foreignField: '_id',
          as: 'donor',
        },
      },
      { $unwind: { path: '$donor', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$donorId',
          donorName: { $first: { $ifNull: ['$donor.name', '$donorSnapshot.name'] } },
          donorType: { $first: { $ifNull: ['$donor.type', '$donorSnapshot.type'] } },
          totalDonationsCount: { $sum: 1 },
          totalQuantityDonated: { $sum: '$quantityDonated' },
        },
      },
      { $sort: { totalQuantityDonated: -1 } },
      {
        $project: {
          _id: 1,
          donorName: { $ifNull: ['$donorName', 'Anonymous/Historical Donor'] },
          donorType: { $ifNull: ['$donorType', 'General'] },
          totalDonationsCount: 1,
          totalQuantityDonated: 1,
        },
      },
    ];

    // 2. Total quantity delivered to each shelter
    const pipeline2 = [
      { $match: { status: 'Delivered' } },
      {
        $lookup: {
          from: 'shelters',
          localField: 'shelterId',
          foreignField: '_id',
          as: 'shelter',
        },
      },
      { $unwind: '$shelter' },
      {
        $group: {
          _id: '$shelterId',
          shelterName: { $first: '$shelter.name' },
          capacity: { $first: '$shelter.capacity' },
          deliveryCount: { $sum: 1 },
          totalQuantityDelivered: { $sum: '$quantityDelivered' },
        },
      },
      { $sort: { totalQuantityDelivered: -1 } },
    ];

    // 3. Number of donations by food category
    const pipeline3 = [
      {
        $lookup: {
          from: 'surplusfoods',
          localField: 'surplusFoodId',
          foreignField: '_id',
          as: 'surplus',
        },
      },
      { $unwind: '$surplus' },
      {
        $lookup: {
          from: 'fooditems',
          localField: 'surplus.foodItemId',
          foreignField: '_id',
          as: 'foodItem',
        },
      },
      { $unwind: '$foodItem' },
      {
        $lookup: {
          from: 'foodcategories',
          localField: 'foodItem.categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$category._id',
          categoryName: { $first: '$category.name' },
          donationCount: { $sum: 1 },
          totalQuantity: { $sum: '$quantityDonated' },
        },
      },
      { $sort: { totalQuantity: -1 } },
    ];

    // 4. Monthly donation totals
    const pipeline4 = [
      {
        $group: {
          _id: {
            year: { $year: '$donationDate' },
            month: { $month: '$donationDate' },
          },
          donationCount: { $sum: 1 },
          totalQuantity: { $sum: '$quantityDonated' },
          avgQuantity: { $avg: '$quantityDonated' },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      {
        $project: {
          _id: 0,
          period: {
            $concat: [
              { $toString: '$_id.month' },
              '-',
              { $toString: '$_id.year' },
            ],
          },
          donationCount: 1,
          totalQuantity: { $round: ['$totalQuantity', 2] },
          avgQuantity: { $round: ['$avgQuantity', 2] },
        },
      },
    ];

    // 5. Food request counts grouped by status
    const pipeline5 = [
      {
        $group: {
          _id: '$status',
          requestCount: { $sum: 1 },
          totalQuantityRequired: { $sum: '$quantityRequired' },
          totalFulfilledQuantity: { $sum: '$fulfilledQuantity' },
        },
      },
      { $sort: { requestCount: -1 } },
      {
        $project: {
          _id: 0,
          status: '$_id',
          requestCount: 1,
          totalQuantityRequired: 1,
          totalFulfilledQuantity: 1,
        },
      },
    ];

    // 6. Average feedback rating
    const pipeline6 = [
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          minRating: { $min: '$rating' },
          maxRating: { $max: '$rating' },
        },
      },
      {
        $project: {
          _id: 0,
          totalReviews: 1,
          averageRating: { $round: ['$averageRating', 2] },
          minRating: 1,
          maxRating: 1,
        },
      },
    ];

    // 7. Top donors ranked by total donated quantity
    const pipeline7 = [
      {
        $group: {
          _id: '$donorId',
          totalQuantity: { $sum: '$quantityDonated' },
          donationsCount: { $sum: 1 },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'donors',
          localField: '_id',
          foreignField: '_id',
          as: 'donorDetails',
        },
      },
      { $unwind: { path: '$donorDetails', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          donorName: { $ifNull: ['$donorDetails.name', 'Historical Donor'] },
          donorType: { $ifNull: ['$donorDetails.type', 'Unknown'] },
          totalQuantity: 1,
          donationsCount: 1,
        },
      },
    ];

    const runPipeline = async (name, model, pipe, description) => {
      const data = await model.aggregate(pipe);
      return {
        name,
        description,
        pipelineSyntax: pipe,
        count: data.length,
        result: data,
      };
    };

    if (pipelineId === '1') {
      const resData = await runPipeline('Quantity Donated by Donor', Donation, pipeline1, 'Calculates sum of donated food quantities grouped by Donor with $lookup and $unwind');
      return res.json({ success: true, data: resData });
    }
    if (pipelineId === '2') {
      const resData = await runPipeline('Delivered to Each Shelter', Delivery, pipeline2, 'Summarizes quantities delivered grouped by destination Shelter');
      return res.json({ success: true, data: resData });
    }
    if (pipelineId === '3') {
      const resData = await runPipeline('Donations by Category', Donation, pipeline3, 'Multi-stage $lookup through SurplusFood -> FoodItem -> FoodCategory');
      return res.json({ success: true, data: resData });
    }
    if (pipelineId === '4') {
      const resData = await runPipeline('Monthly Donation Totals', Donation, pipeline4, 'Aggregates donation metrics bucketed by year and month');
      return res.json({ success: true, data: resData });
    }
    if (pipelineId === '5') {
      const resData = await runPipeline('Requests by Status', FoodRequest, pipeline5, 'Groups food requests by status and computes fulfillment metrics');
      return res.json({ success: true, data: resData });
    }
    if (pipelineId === '6') {
      const resData = await runPipeline('Average Feedback Rating', Feedback, pipeline6, 'Computes system-wide rating averages, min, max, and count');
      return res.json({ success: true, data: resData });
    }
    if (pipelineId === '7') {
      const resData = await runPipeline('Top Donors Ranked', Donation, pipeline7, 'Ranks top 10 donors using $group, $sort, and $limit');
      return res.json({ success: true, data: resData });
    }

    // Return all pipelines summary
    const all = await Promise.all([
      runPipeline('Quantity Donated by Donor', Donation, pipeline1, 'Aggregates total food quantity donated by each registered donor.'),
      runPipeline('Delivered to Each Shelter', Delivery, pipeline2, 'Summarizes total food received across destination shelters.'),
      runPipeline('Donations by Category', Donation, pipeline3, 'Categorical redistribution analysis via multi-table $lookups.'),
      runPipeline('Monthly Donation Totals', Donation, pipeline4, 'Monthly distribution trends and volume over time.'),
      runPipeline('Requests Grouped by Status', FoodRequest, pipeline5, 'Distribution and fulfillment progress of food requests.'),
      runPipeline('Average Feedback Rating', Feedback, pipeline6, 'Aggregate satisfaction and rating scores from delivered packages.'),
      runPipeline('Top Donors Ranked', Donation, pipeline7, 'Top donor leaderboard ranked by total donated units.'),
    ]);

    res.json({ success: true, data: all });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getDashboardStats, getAggregations };
