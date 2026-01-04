# FoodXpress AI - Backend

## Overview

Production-ready backend API for FoodXpress AI food delivery marketplace built with Node.js, Express, and MongoDB.

## Features

✅ **Complete Authentication System**
- User registration and login with JWT
- Password hashing with bcrypt
- Role-based access control (customer, restaurant_owner, admin, delivery_driver)

✅ **Restaurant Management**
- CRUD operations for restaurants
- Search and filter functionality
- Rating and review system integration

✅ **Menu Management**
- Menu items with categories
- Dietary preferences (vegetarian, vegan, gluten-free)
- Customization options
- Availability tracking

✅ **Shopping Cart**
- Server-side cart storage
- Multi-item support with customizations
- Automatic price calculation
- Cart validation (single restaurant per cart)

✅ **Order Management**
- Order creation with payment integration
- Order status tracking (7 states)
- Order history
- Cancellation support

✅ **Review System**
- Restaurant and order reviews
- Separate ratings (food, delivery)
- Helpful voting system
- Verified purchase badges

✅ **AI-Powered Features**
- Chatbot for customer assistance
- Personalized recommendations
- Review sentiment analysis
- ETA prediction with peak hour detection

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **Validation:** Express Validator
- **Security:** Bcrypt for password hashing
- **Logging:** Morgan

## Project Structure

```
backend/
├── config/
│   └── db.js                 # MongoDB connection
├── controllers/
│   ├── auth.controller.js    # Authentication logic
│   ├── cart.controller.js    # Cart management
│   ├── menu.controller.js    # Menu operations
│   ├── order.controller.js   # Order processing
│   ├── restaurant.controller.js
│   ├── review.controller.js
│   ├── ai.controller.js      # AI features
│   └── user.controller.js
├── middleware/
│   ├── auth.middleware.js    # JWT verification
│   └── validation.middleware.js
├── models/
│   ├── User.model.js
│   ├── Restaurant.model.js
│   ├── MenuItem.model.js
│   ├── Order.model.js
│   ├── Review.model.js
│   └── Cart.model.js
├── routes/
│   ├── auth.routes.js
│   ├── cart.routes.js
│   ├── menu.routes.js
│   ├── order.routes.js
│   ├── restaurant.routes.js
│   ├── review.routes.js
│   ├── ai.routes.js
│   └── user.routes.js
├── .env.example
├── server.js                 # Entry point
├── package.json
├── API_DOCUMENTATION.md      # Complete API docs
└── POSTMAN_EXAMPLES.json     # Postman collection
```

## Quick Start

### 1. Environment Setup

Create a `.env` file in the backend directory:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/foodxpress
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# Windows (if installed as service)
net start MongoDB

# macOS/Linux
mongod
```

### 4. Run the Server

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

### 5. Verify Installation

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "success",
  "message": "FoodXpress AI API is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## API Endpoints

### Base URL: `http://localhost:5000/api`

| Module | Method | Endpoint | Auth Required |
|--------|--------|----------|---------------|
| **Auth** | POST | `/auth/register` | No |
| | POST | `/auth/login` | No |
| | GET | `/auth/me` | Yes |
| **Restaurants** | GET | `/restaurants` | No |
| | GET | `/restaurants/:id` | No |
| | POST | `/restaurants` | Yes (Owner) |
| | PUT | `/restaurants/:id` | Yes (Owner) |
| | DELETE | `/restaurants/:id` | Yes (Owner) |
| **Menu** | GET | `/menu/:restaurantId` | No |
| | GET | `/menu/item/:id` | No |
| | POST | `/menu` | Yes (Owner) |
| | PUT | `/menu/item/:id` | Yes (Owner) |
| | DELETE | `/menu/item/:id` | Yes (Owner) |
| **Cart** | GET | `/cart/:userId` | Yes |
| | POST | `/cart/add` | Yes |
| | PUT | `/cart/item/:itemId` | Yes |
| | DELETE | `/cart/item/:itemId` | Yes |
| | DELETE | `/cart/:userId` | Yes |
| **Orders** | POST | `/orders` | Yes |
| | GET | `/orders/user` | Yes |
| | GET | `/orders/:orderId` | Yes |
| | PUT | `/orders/:orderId/status` | Yes |
| | PUT | `/orders/:orderId/cancel` | Yes |
| **Reviews** | POST | `/reviews` | Yes |
| | GET | `/reviews/restaurant/:restaurantId` | No |
| | GET | `/reviews/user` | Yes |
| | PUT | `/reviews/:id` | Yes |
| | DELETE | `/reviews/:id` | Yes |
| | PUT | `/reviews/:id/helpful` | Yes |
| **AI** | POST | `/ai/chatbot` | No |
| | POST | `/ai/recommendations` | Yes |
| | POST | `/ai/reviews` | No |
| | POST | `/ai/eta` | No |
| **User** | GET | `/users/profile` | Yes |
| | PUT | `/users/profile` | Yes |

See `API_DOCUMENTATION.md` for detailed request/response examples.

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Get your token from `/auth/register` or `/auth/login` endpoints.

## Database Models

### User
- Authentication and profile information
- Role-based access (customer, restaurant_owner, admin, delivery_driver)
- Address with coordinates support

### Restaurant
- Business information and settings
- Cuisine types and tags
- Operating hours
- Delivery settings
- Rating aggregation

### MenuItem
- Menu item details with categories
- Dietary preferences
- Customization options
- Nutritional information
- Availability status

### Cart
- User-specific shopping cart
- Restaurant validation
- Automatic calculations (subtotal, tax, total)
- Auto-expiration after 24 hours

### Order
- Complete order information
- Status tracking with history
- Payment details
- Delivery information
- Unique order number generation

### Review
- Restaurant reviews with ratings
- Verified purchase system
- Helpful voting
- Restaurant response support

## Testing

You can test the APIs using:

1. **Postman**: Import `POSTMAN_EXAMPLES.json`
2. **cURL**: See examples in `API_DOCUMENTATION.md`
3. **Frontend**: Connect your React frontend

## Error Handling

All errors return in this format:

```json
{
  "status": "error",
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```

## Security Features

- Password hashing with bcrypt (10 salt rounds)
- JWT token expiration (30 days)
- Input validation on all endpoints
- Role-based authorization
- CORS enabled for frontend
- Mongoose schema validation

## Performance Optimizations

- Database indexes on frequently queried fields
- Populated references for reduced queries
- Query parameter filtering
- Efficient aggregation for ratings

## Production Deployment

### Environment Variables

Set these in production:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/foodxpress
JWT_SECRET=your-super-long-random-secret-key
```

### Best Practices

1. Use environment variables for all secrets
2. Enable HTTPS
3. Set up proper CORS origins
4. Implement rate limiting
5. Add request logging
6. Set up monitoring (e.g., PM2, New Relic)
7. Use a process manager (PM2 recommended)
8. Regular database backups

## Future Enhancements

- [ ] Real-time order tracking with WebSockets
- [ ] Payment gateway integration (Stripe, PayPal)
- [ ] Image upload functionality
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Advanced AI recommendations using OpenAI
- [ ] Geolocation-based restaurant search
- [ ] Admin dashboard APIs
- [ ] Analytics and reporting
- [ ] Caching with Redis

## Troubleshooting

### MongoDB Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution**: Make sure MongoDB is running:
```bash
mongod
```

### JWT Secret Error

```
Error: secretOrPrivateKey must have a value
```

**Solution**: Set `JWT_SECRET` in your `.env` file

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution**: Change the PORT in `.env` or kill the process using port 5000

## Contributing

1. Follow existing code structure
2. Add JSDoc comments for new functions
3. Test all endpoints before committing
4. Update API documentation for new endpoints

## License

MIT

## Support

For issues or questions, please contact the development team.

---

**Version:** 1.0.0  
**Last Updated:** January 2024
