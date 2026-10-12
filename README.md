# Food Management System (MongoDB Atlas Cloud Database)

A complete, full-stack web application built for the **Third-Year BTech Computer Science and Engineering (Data Science) Advanced Database Laboratory Mini Project I**.

This system connects surplus food donors (restaurants, caterers, bakeries) with non-profit organizations (NGOs, shelters, and beneficiaries) using intelligent matching algorithms, logistics tracking, delivery confirmation, and post-delivery feedback.

The application connects **directly to a persistent MongoDB Atlas cloud database deployment** without requiring any local MongoDB installation or MongoDB Compass.

---

## 🌟 Key Features

1. **Live MongoDB Atlas Connection**: Node.js/Express backend communicating with MongoDB Atlas using Mongoose ODM with connection pooling and state detection.
2. **Dashboard with Real-Time Analytics**:
   - Total Donors, Surplus batches, Donations, Active Pickups, and Deliveries.
   - Live KPI aggregation for quantities donated and delivered.
   - Donation monthly trends and surplus status distributions.
3. **Donors Management**: Full CRUD operations, unique constraints, and historical record preservation when deleting donors.
4. **Surplus Food Tracking**: Inventory of surplus food with shelf-life validation, preparation vs expiry timestamp constraints, packaging types, and vegetarian classification.
5. **Intelligent Food Request Matching Engine**: Multi-criteria matching algorithm that pairs requests with available food by shelf-life, remaining requirement, priority, and packaging.
6. **Logistics & Fleet Coordination**: Pickups, volunteer shift scheduling, and vehicle capacity allocation.
7. **Redistribution & Feedback**: Record deliveries, transit route metrics (distance, duration), beneficiary assignments, and 1–5 star ratings.
8. **Dedicated "Database Operations" Page for Lab Practical**:
   - Collection inspector with live document counters.
   - Paginated document browser displaying MongoDB `_id` ObjectIds.
   - Raw JSON document insertion, update, and deletion.
   - Filter and sort queries using MQL JSON syntax.
   - Execution of 8 Advanced MongoDB Queries.
   - Execution and visualization of 7 Aggregation Pipelines (`$match`, `$group`, `$sort`, `$project`, `$lookup`, `$unwind`).
   - Atlas B-Tree Index Inspector.
9. **Visual Graph Schema Page**: Interactive visual diagram showing entities, directional references, and relationship labels.

---

## 🏗️ Architecture & Entities (16 Collections)

- **Donor**: `donorId`, `name`, `type`, `phone`, `email`, `address`, `locationId`
- **SurplusFood**: `surplusId`, `quantity`, `allocatedQuantity`, `unit`, `preparedTime`, `expiryTime`, `status`, `packagingType`, `donorId`, `foodItemId`, `locationId`
- **FoodItem**: `foodId`, `name`, `description`, `vegetarian`, `categoryId`
- **FoodCategory**: `categoryId`, `name`, `description`
- **NGO**: `ngoId`, `name`, `registrationNumber`, `phone`, `email`
- **Shelter**: `shelterId`, `name`, `capacity`, `phone`, `address`, `ngoId`, `locationId`
- **Beneficiary**: `beneficiaryId`, `name`, `contact`, `shelterId`
- **Volunteer**: `volunteerId`, `name`, `phone`, `email`, `availability`, `status`, `currentVehicleId`
- **Vehicle**: `vehicleId`, `vehicleNumber`, `vehicleType`, `capacity`, `refrigerated`, `status`
- **FoodRequest**: `requestId`, `quantityRequired`, `fulfilledQuantity`, `requiredBefore`, `priority`, `status`, `ngoId`, `shelterId`, `matchedSurplusId`
- **Pickup**: `pickupId`, `scheduledTime`, `actualPickupTime`, `status`, `volunteerId`, `vehicleId`, `surplusId`, `notes`
- **Delivery**: `deliveryId`, `deliveryTime`, `status`, `quantityDelivered`, `routeId`, `pickupId`, `surplusId`, `shelterId`, `beneficiaryId`
- **Location**: `locationId`, `address`, `city`, `latitude`, `longitude`
- **Route**: `routeId`, `sourceLocationId`, `destinationLocationId`, `distanceKm`, `estimatedDuration`, `status`
- **Donation**: `donationId`, `donationDate`, `quantityDonated`, `unit`, `status`, `donorId`, `donorSnapshot`, `surplusFoodId`
- **Feedback**: `feedbackId`, `rating`, `comments`, `feedbackDate`, `deliveryId`

---

## 🚀 Quick Setup Instructions

### Step 1: Configure MongoDB Atlas Cloud Database
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign in.
2. Create a free shared cluster (M0 sandbox).
3. Under **Security -> Database Access**, create a user (e.g., username `admin`, strong password). Note down the password.
4. Under **Security -> Network Access**, click **Add IP Address** -> select **Allow Access from Anywhere (`0.0.0.0/0`)** -> Confirm.
5. In your cluster dashboard, click **Connect** -> **Drivers (Node.js)** -> Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@<cluster-url>/?retryWrites=true&w=majority
   ```

### Step 2: Configure Environment Variables
Inside the `backend/` directory, create a `.env` file from `.env.example`:
```env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/food_management_db?retryWrites=true&w=majority
PORT=5000
```
*(Replace `YOUR_USERNAME`, `YOUR_PASSWORD`, and `YOUR_CLUSTER` with your actual Atlas credentials)*.

### Step 3: Seed Realistic Data to Atlas
From the `backend/` directory:
```bash
npm run seed
```
This populates 5 donors, 10 surplus listings, 4 categories, 5 food items, 3 NGOs, 4 shelters, 8 beneficiaries, 6 volunteers, 4 vehicles, 8 requests, and initial pickups/deliveries/feedbacks.

### Step 4: Start Backend and Frontend
In Terminal 1 (Backend):
```bash
cd backend
npm start
```
*Backend runs at `http://localhost:5000`.*

In Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```
*Open `http://localhost:5173` in your browser.*
