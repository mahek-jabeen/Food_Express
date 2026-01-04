# 🚀 Quick Start Guide - FoodXpress AI Backend

## 5-Minute Setup

### Step 1: Environment Setup (1 min)
```bash
cd backend
cp .env.example .env
```

Edit `.env` and set your `JWT_SECRET`:
```env
JWT_SECRET=your-random-secret-key-at-least-32-characters-long
```

### Step 2: Install Dependencies (1 min)
```bash
npm install
```

### Step 3: Start MongoDB (1 min)
```bash
# Make sure MongoDB is running
# Windows: net start MongoDB
# macOS/Linux: brew services start mongodb-community
# Or just run: mongod
```

### Step 4: Start Server (1 min)
```bash
npm run dev
```

You should see:
```
🚀 Server is running on port 5000
🌍 Environment: development
MongoDB Connected: localhost
```

### Step 5: Test API (1 min)
Open another terminal:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "success",
  "message": "FoodXpress AI API is running"
}
```

---

## Quick API Test Sequence

### 1. Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "phone": "+1234567890"
  }'
```

### 2. Login (Get Token)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Copy the token from the response!**

### 3. Get Restaurants
```bash
curl http://localhost:5000/api/restaurants
```

### 4. Use AI Chatbot
```bash
curl -X POST http://localhost:5000/api/ai/chatbot \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want something spicy"
  }'
```

---

## All Available Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | No | Register user |
| `/api/auth/login` | POST | No | Login user |
| `/api/auth/me` | GET | Yes | Get current user |
| `/api/restaurants` | GET | No | Get all restaurants |
| `/api/restaurants/:id` | GET | No | Get restaurant |
| `/api/menu/:restaurantId` | GET | No | Get menu items |
| `/api/cart/:userId` | GET | Yes | Get cart |
| `/api/cart/add` | POST | Yes | Add to cart |
| `/api/orders` | POST | Yes | Create order |
| `/api/orders/user` | GET | Yes | Get user orders |
| `/api/reviews` | POST | Yes | Create review |
| `/api/reviews/restaurant/:id` | GET | No | Get reviews |
| `/api/ai/chatbot` | POST | No | AI chatbot |
| `/api/ai/recommendations` | POST | Yes | AI recommendations |
| `/api/ai/reviews` | POST | No | Review summary |
| `/api/ai/eta` | POST | No | ETA prediction |

**For complete list, see:** `API_DOCUMENTATION.md`

---

## Postman Testing

1. Import `POSTMAN_EXAMPLES.json` into Postman
2. All endpoints are pre-configured
3. Update Authorization token after login
4. Test all APIs easily!

---

## Project Structure

```
backend/
├── server.js              # ✅ Entry point
├── package.json           # ✅ Dependencies
├── .env                   # ⚙️ Configuration
│
├── models/                # ✅ 6 Mongoose models
│   ├── User.model.js
│   ├── Restaurant.model.js
│   ├── MenuItem.model.js
│   ├── Cart.model.js      ← NEW
│   ├── Order.model.js
│   └── Review.model.js
│
├── controllers/           # ✅ 8 Controllers
│   ├── auth.controller.js
│   ├── restaurant.controller.js
│   ├── menu.controller.js
│   ├── cart.controller.js  ← NEW
│   ├── order.controller.js
│   ├── review.controller.js
│   ├── ai.controller.js    ← ENHANCED
│   └── user.controller.js
│
├── routes/                # ✅ 8 Route files
│   ├── auth.routes.js
│   ├── restaurant.routes.js
│   ├── menu.routes.js
│   ├── cart.routes.js      ← NEW
│   ├── order.routes.js
│   ├── review.routes.js
│   ├── ai.routes.js        ← ENHANCED
│   └── user.routes.js
│
└── middleware/            # ✅ Security & Validation
    ├── auth.middleware.js
    └── validation.middleware.js
```

---

## Common Commands

```bash
# Start development server (auto-reload)
npm run dev

# Start production server
npm start

# Check if MongoDB is running
mongo --eval "db.version()"

# Stop server
Ctrl + C
```

---

## Authentication

Most endpoints require JWT token in header:
```
Authorization: Bearer <your-token>
```

Get token from `/api/auth/register` or `/api/auth/login`

---

## Key Features

✅ **40+ API Endpoints**
✅ **Complete CRUD Operations**
✅ **JWT Authentication**
✅ **Server-Side Cart**
✅ **Order Management**
✅ **Review System**
✅ **4 AI Features**
✅ **Role-Based Access**
✅ **Input Validation**
✅ **Error Handling**

---

## Need Help?

📖 **Complete API Docs:** `API_DOCUMENTATION.md`
📘 **Backend Guide:** `README_BACKEND.md`
📦 **Postman Collection:** `POSTMAN_EXAMPLES.json`
📄 **Summary:** `../BACKEND_COMPLETE_SUMMARY.md`

---

## Troubleshooting

❌ **MongoDB Connection Error**
```bash
# Start MongoDB
mongod
```

❌ **Port Already in Use**
```bash
# Change PORT in .env file
PORT=5001
```

❌ **JWT Error**
```bash
# Set JWT_SECRET in .env
JWT_SECRET=your-secret-key-min-32-chars
```

---

**You're all set! 🎉**

Your FoodXpress AI backend is ready for development!
