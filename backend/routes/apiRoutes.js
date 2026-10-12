const express = require('express');
const { createCrudController } = require('../controllers/crudController');
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

const router = express.Router();

// Helper to register standard routes
const registerCrudRoutes = (path, Model, name, populates = []) => {
  const ctrl = createCrudController(Model, name, populates);
  router.get(`/${path}`, ctrl.getAll);
  router.get(`/${path}/:id`, ctrl.getById);
  router.post(`/${path}`, ctrl.create);
  router.put(`/${path}/:id`, ctrl.update);
  router.delete(`/${path}/:id`, ctrl.delete);
};

// 1. Donors
registerCrudRoutes('donors', Donor, 'Donor', ['locationId']);

// 2. Surplus Food
registerCrudRoutes('surplus-food', SurplusFood, 'SurplusFood', [
  'donorId',
  'foodItemId',
  'locationId',
]);

// 3. Food Items
registerCrudRoutes('food-items', FoodItem, 'FoodItem', ['categoryId']);

// 4. Food Categories
registerCrudRoutes('categories', FoodCategory, 'FoodCategory');

// 5. NGOs
registerCrudRoutes('ngos', NGO, 'NGO');

// 6. Shelters
registerCrudRoutes('shelters', Shelter, 'Shelter', ['ngoId', 'locationId']);

// 7. Beneficiaries
registerCrudRoutes('beneficiaries', Beneficiary, 'Beneficiary', ['shelterId']);

// 8. Volunteers
registerCrudRoutes('volunteers', Volunteer, 'Volunteer', ['currentVehicleId']);

// 9. Vehicles
registerCrudRoutes('vehicles', Vehicle, 'Vehicle');

// 10. Food Requests
registerCrudRoutes('food-requests', FoodRequest, 'FoodRequest', [
  'ngoId',
  'shelterId',
  'matchedSurplusId',
]);

// 11. Pickups
registerCrudRoutes('pickups', Pickup, 'Pickup', [
  'volunteerId',
  'vehicleId',
  'surplusId',
]);

// 12. Deliveries
registerCrudRoutes('deliveries', Delivery, 'Delivery', [
  'routeId',
  'pickupId',
  'surplusId',
  'shelterId',
  'beneficiaryId',
]);

// 13. Locations
registerCrudRoutes('locations', Location, 'Location');

// 14. Routes
registerCrudRoutes('routes', Route, 'Route', [
  'sourceLocationId',
  'destinationLocationId',
]);

// 15. Donations
registerCrudRoutes('donations', Donation, 'Donation', [
  'donorId',
  'surplusFoodId',
]);

// 16. Feedback
registerCrudRoutes('feedback', Feedback, 'Feedback', ['deliveryId']);

module.exports = router;
