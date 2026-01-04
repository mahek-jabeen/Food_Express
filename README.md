# FoodXpress AI

An AI-powered food delivery marketplace built with React, Node.js, Express, and MongoDB.

## Features

- 🍕 Browse restaurants and menus
- 🛒 Shopping cart functionality
- 📦 Real-time order tracking
- ⭐ Reviews and ratings
- 🤖 AI-powered chatbot for recommendations
- 👤 User authentication
- 🏪 Restaurant management

## Tech Stack

### Frontend
- React 18
- React Router
- Tailwind CSS
- Axios

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Bcrypt for password hashing

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies for both frontend and backend:
   ```bash
   npm run install-all
   ```

3. Create a `.env` file in the root directory:
   ```
   MONGODB_URI=mongodb://localhost:27017/foodxpress
   JWT_SECRET=your_jwt_secret_key_here
   PORT=5000
   NODE_ENV=development
   ```

4. Start MongoDB service

5. Run the application:
   ```bash
   # Development mode (both frontend and backend)
   npm run dev-all
   
   # Backend only
   npm run dev
   
   # Frontend only
   npm run client
   ```

6. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## API Endpoints

### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login user

### Users
- GET /api/users/profile - Get user profile
- PUT /api/users/profile - Update user profile

### Restaurants
- GET /api/restaurants - Get all restaurants
- GET /api/restaurants/:id - Get restaurant by ID
- POST /api/restaurants - Create restaurant (admin)

### Menu Items
- GET /api/menu/:restaurantId - Get menu items by restaurant
- POST /api/menu - Create menu item (admin)

### Orders
- POST /api/orders - Create new order
- GET /api/orders/user/:userId - Get user orders
- GET /api/orders/:id - Get order by ID
- PUT /api/orders/:id/status - Update order status

### Reviews
- POST /api/reviews - Create review
- GET /api/reviews/restaurant/:restaurantId - Get restaurant reviews

### AI
- POST /api/ai/chat - AI chatbot interaction
- POST /api/ai/recommendations - Get AI recommendations

## License

MIT
