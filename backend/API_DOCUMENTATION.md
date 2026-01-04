# FoodXpress AI - API Documentation

Complete API documentation for the FoodXpress AI backend service.

**Base URL**: `http://localhost:5000/api`

---

## Table of Contents
1. [Authentication APIs](#authentication-apis)
2. [Restaurant APIs](#restaurant-apis)
3. [Menu Item APIs](#menu-item-apis)
4. [Cart APIs](#cart-apis)
5. [Order APIs](#order-apis)
6. [Review APIs](#review-apis)
7. [AI APIs](#ai-apis)
8. [User APIs](#user-apis)

---

## Authentication APIs

### 1. Register User
**POST** `/api/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "role": "customer",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001"
  }
}
```

**Response (201):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "role": "customer",
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001"
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 2. Login User
**POST** `/api/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "role": "customer",
      "address": {...}
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 3. Get Current User
**GET** `/api/auth/me`

Get currently authenticated user's information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "role": "customer"
    }
  }
}
```

---

## Restaurant APIs

### 1. Get All Restaurants
**GET** `/api/restaurants`

Retrieve all active restaurants with optional filters.

**Query Parameters:**
- `cuisine` (string): Filter by cuisine type
- `search` (string): Search in name or description
- `priceRange` (string): $, $$, $$$, $$$$
- `rating` (number): Minimum rating
- `isOpen` (boolean): Filter by open status

**Example Request:**
```
GET /api/restaurants?cuisine=Italian&rating=4&isOpen=true
```

**Response (200):**
```json
{
  "status": "success",
  "results": 10,
  "data": {
    "restaurants": [
      {
        "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
        "name": "Pizza Palace",
        "description": "Authentic Italian pizza",
        "cuisine": ["Italian", "Pizza"],
        "rating": 4.5,
        "totalReviews": 120,
        "priceRange": "$$",
        "deliveryTime": {
          "min": 20,
          "max": 30
        },
        "deliveryFee": 5.99,
        "isOpen": true,
        "address": {
          "street": "456 Food Ave",
          "city": "New York",
          "state": "NY",
          "zipCode": "10002"
        },
        "logo": "https://example.com/logo.jpg",
        "images": ["https://example.com/image1.jpg"]
      }
    ]
  }
}
```

---

### 2. Get Single Restaurant
**GET** `/api/restaurants/:id`

Get detailed information about a specific restaurant including menu items.

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "restaurant": {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
      "name": "Pizza Palace",
      "description": "Authentic Italian pizza",
      "cuisine": ["Italian", "Pizza"],
      "rating": 4.5,
      "totalReviews": 120,
      "owner": {
        "_id": "64a1b2c3d4e5f6g7h8i9j0k2",
        "name": "Restaurant Owner",
        "email": "owner@example.com"
      },
      "menuItems": [
        {
          "_id": "64a1b2c3d4e5f6g7h8i9j0k3",
          "name": "Margherita Pizza",
          "price": 12.99,
          "category": "Main Course"
        }
      ]
    }
  }
}
```

---

### 3. Create Restaurant
**POST** `/api/restaurants`

Create a new restaurant (Restaurant Owner/Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Pizza Palace",
  "description": "Authentic Italian pizza and pasta",
  "cuisine": ["Italian", "Pizza"],
  "address": {
    "street": "456 Food Ave",
    "city": "New York",
    "state": "NY",
    "zipCode": "10002"
  },
  "phone": "+1234567890",
  "email": "info@pizzapalace.com",
  "priceRange": "$$",
  "deliveryFee": 5.99,
  "minimumOrder": 15,
  "deliveryTime": {
    "min": 20,
    "max": 30
  }
}
```

**Response (201):**
```json
{
  "status": "success",
  "data": {
    "restaurant": {...}
  }
}
```

---

### 4. Update Restaurant
**PUT** `/api/restaurants/:id`

Update restaurant information (Owner/Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:** (Fields to update)
```json
{
  "isOpen": false,
  "deliveryFee": 6.99
}
```

---

### 5. Delete Restaurant
**DELETE** `/api/restaurants/:id`

Delete a restaurant (Owner/Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

---

## Menu Item APIs

### 1. Get Menu Items
**GET** `/api/menu/:restaurantId`

Get all menu items for a specific restaurant.

**Query Parameters:**
- `category` (string): Filter by category
- `search` (string): Search in name/description
- `isVegetarian` (boolean)
- `isVegan` (boolean)
- `isGlutenFree` (boolean)

**Example:**
```
GET /api/menu/64a1b2c3d4e5f6g7h8i9j0k1?category=Main%20Course&isVegetarian=true
```

**Response (200):**
```json
{
  "status": "success",
  "results": 15,
  "data": {
    "menuItems": [
      {
        "_id": "64a1b2c3d4e5f6g7h8i9j0k3",
        "name": "Margherita Pizza",
        "description": "Classic pizza with tomato, mozzarella, and basil",
        "price": 12.99,
        "category": "Main Course",
        "image": "https://example.com/margherita.jpg",
        "isVegetarian": true,
        "isVegan": false,
        "isGlutenFree": false,
        "spiceLevel": "None",
        "calories": 850,
        "prepTime": 15,
        "isAvailable": true,
        "restaurant": {
          "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
          "name": "Pizza Palace"
        }
      }
    ]
  }
}
```

---

### 2. Get Single Menu Item
**GET** `/api/menu/item/:id`

Get detailed information about a specific menu item.

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "menuItem": {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k3",
      "name": "Margherita Pizza",
      "description": "Classic pizza with tomato, mozzarella, and basil",
      "price": 12.99,
      "category": "Main Course",
      "customizations": [
        {
          "name": "Size",
          "options": [
            { "name": "Small", "price": 0 },
            { "name": "Large", "price": 3 }
          ]
        }
      ]
    }
  }
}
```

---

### 3. Create Menu Item
**POST** `/api/menu`

Add a new menu item (Restaurant Owner/Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "restaurant": "64a1b2c3d4e5f6g7h8i9j0k1",
  "name": "Pepperoni Pizza",
  "description": "Classic pepperoni pizza",
  "price": 14.99,
  "category": "Main Course",
  "image": "https://example.com/pepperoni.jpg",
  "isVegetarian": false,
  "isVegan": false,
  "spiceLevel": "None",
  "calories": 950,
  "prepTime": 15
}
```

---

### 4. Update Menu Item
**PUT** `/api/menu/item/:id`

Update menu item (Owner/Admin only).

---

### 5. Delete Menu Item
**DELETE** `/api/menu/item/:id`

Delete menu item (Owner/Admin only).

---

## Cart APIs

### 1. Get Cart
**GET** `/api/cart/:userId`

Get user's shopping cart.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "cart": {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k4",
      "user": "64a1b2c3d4e5f6g7h8i9j0k1",
      "restaurant": {
        "_id": "64a1b2c3d4e5f6g7h8i9j0k2",
        "name": "Pizza Palace",
        "logo": "https://example.com/logo.jpg",
        "deliveryFee": 5.99
      },
      "items": [
        {
          "_id": "64a1b2c3d4e5f6g7h8i9j0k5",
          "menuItem": {
            "_id": "64a1b2c3d4e5f6g7h8i9j0k3",
            "name": "Margherita Pizza",
            "image": "https://example.com/margherita.jpg",
            "price": 12.99
          },
          "name": "Margherita Pizza",
          "price": 12.99,
          "quantity": 2,
          "customizations": [
            {
              "name": "Size",
              "option": "Large",
              "price": 3
            }
          ],
          "specialInstructions": "Extra cheese please"
        }
      ],
      "subtotal": 31.98,
      "deliveryFee": 5.99,
      "tax": 2.56,
      "total": 40.53
    }
  }
}
```

---

### 2. Add to Cart
**POST** `/api/cart/add`

Add item to cart.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "menuItemId": "64a1b2c3d4e5f6g7h8i9j0k3",
  "quantity": 2,
  "customizations": [
    {
      "name": "Size",
      "option": "Large",
      "price": 3
    }
  ],
  "specialInstructions": "Extra cheese please"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Item added to cart",
  "data": {
    "cart": {...}
  }
}
```

---

### 3. Update Cart Item
**PUT** `/api/cart/item/:itemId`

Update quantity of cart item.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "quantity": 3
}
```

---

### 4. Remove from Cart
**DELETE** `/api/cart/item/:itemId`

Remove specific item from cart.

**Headers:**
```
Authorization: Bearer <token>
```

---

### 5. Clear Cart
**DELETE** `/api/cart/:userId`

Clear all items from cart.

**Headers:**
```
Authorization: Bearer <token>
```

---

## Order APIs

### 1. Create Order
**POST** `/api/orders`

Place a new order.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "restaurant": "64a1b2c3d4e5f6g7h8i9j0k1",
  "items": [
    {
      "menuItem": "64a1b2c3d4e5f6g7h8i9j0k3",
      "quantity": 2,
      "customizations": [
        {
          "name": "Size",
          "option": "Large",
          "price": 3
        }
      ],
      "specialInstructions": "Extra cheese"
    }
  ],
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "instructions": "Ring doorbell"
  },
  "paymentMethod": "credit_card",
  "specialInstructions": "Please deliver quickly"
}
```

**Response (201):**
```json
{
  "status": "success",
  "data": {
    "order": {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k6",
      "orderNumber": "FX12345678901",
      "user": {...},
      "restaurant": {...},
      "items": [...],
      "status": "pending",
      "pricing": {
        "subtotal": 31.98,
        "deliveryFee": 5.99,
        "tax": 2.56,
        "total": 40.53
      },
      "payment": {
        "method": "credit_card",
        "status": "completed",
        "paidAt": "2024-01-15T10:30:00.000Z"
      },
      "estimatedDeliveryTime": "2024-01-15T11:00:00.000Z"
    }
  }
}
```

---

### 2. Get User Orders
**GET** `/api/orders/user`

Get all orders for authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "status": "success",
  "results": 5,
  "data": {
    "orders": [
      {
        "_id": "64a1b2c3d4e5f6g7h8i9j0k6",
        "orderNumber": "FX12345678901",
        "restaurant": {
          "name": "Pizza Palace",
          "logo": "https://example.com/logo.jpg"
        },
        "status": "delivered",
        "pricing": {
          "total": 40.53
        },
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

---

### 3. Get Order by ID
**GET** `/api/orders/:id`

Get detailed information about a specific order.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "order": {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k6",
      "orderNumber": "FX12345678901",
      "status": "out_for_delivery",
      "statusHistory": [
        {
          "status": "pending",
          "timestamp": "2024-01-15T10:30:00.000Z"
        },
        {
          "status": "confirmed",
          "timestamp": "2024-01-15T10:32:00.000Z"
        }
      ],
      "estimatedDeliveryTime": "2024-01-15T11:00:00.000Z"
    }
  }
}
```

---

### 4. Update Order Status
**PUT** `/api/orders/:id/status`

Update order status (Restaurant Owner/Delivery Driver/Admin).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "preparing",
  "note": "Chef is working on your order"
}
```

**Valid Status Values:**
- `pending`
- `confirmed`
- `preparing`
- `ready`
- `out_for_delivery`
- `delivered`
- `cancelled`

---

### 5. Cancel Order
**PUT** `/api/orders/:id/cancel`

Cancel an order (Customer/Admin).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "reason": "Changed my mind"
}
```

---

## Review APIs

### 1. Create Review
**POST** `/api/reviews`

Create a review for a delivered order.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "restaurant": "64a1b2c3d4e5f6g7h8i9j0k1",
  "order": "64a1b2c3d4e5f6g7h8i9j0k6",
  "rating": 5,
  "foodRating": 5,
  "deliveryRating": 4,
  "comment": "Excellent pizza! Fresh ingredients and fast delivery.",
  "images": ["https://example.com/review1.jpg"]
}
```

**Response (201):**
```json
{
  "status": "success",
  "data": {
    "review": {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k7",
      "user": {
        "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
        "name": "John Doe",
        "profileImage": "https://example.com/profile.jpg"
      },
      "restaurant": "64a1b2c3d4e5f6g7h8i9j0k1",
      "order": "64a1b2c3d4e5f6g7h8i9j0k6",
      "rating": 5,
      "foodRating": 5,
      "deliveryRating": 4,
      "comment": "Excellent pizza! Fresh ingredients and fast delivery.",
      "isVerifiedPurchase": true,
      "helpful": 0,
      "createdAt": "2024-01-15T12:00:00.000Z"
    }
  }
}
```

---

### 2. Get Restaurant Reviews
**GET** `/api/reviews/restaurant/:restaurantId`

Get all reviews for a restaurant.

**Query Parameters:**
- `rating` (number): Filter by rating
- `sort` (string): `helpful`, `rating_high`, `rating_low`

**Example:**
```
GET /api/reviews/restaurant/64a1b2c3d4e5f6g7h8i9j0k1?sort=helpful
```

**Response (200):**
```json
{
  "status": "success",
  "results": 50,
  "data": {
    "reviews": [
      {
        "_id": "64a1b2c3d4e5f6g7h8i9j0k7",
        "user": {
          "name": "John Doe",
          "profileImage": "https://example.com/profile.jpg"
        },
        "rating": 5,
        "comment": "Excellent pizza!",
        "helpful": 15,
        "createdAt": "2024-01-15T12:00:00.000Z"
      }
    ]
  }
}
```

---

### 3. Get User Reviews
**GET** `/api/reviews/user`

Get all reviews by authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

---

### 4. Update Review
**PUT** `/api/reviews/:id`

Update a review (Own review only).

**Headers:**
```
Authorization: Bearer <token>
```

---

### 5. Delete Review
**DELETE** `/api/reviews/:id`

Delete a review (Own review/Admin).

**Headers:**
```
Authorization: Bearer <token>
```

---

### 6. Mark Review as Helpful
**PUT** `/api/reviews/:id/helpful`

Mark a review as helpful.

**Headers:**
```
Authorization: Bearer <token>
```

---

## AI APIs

### 1. AI Chatbot
**POST** `/api/ai/chat` or `/api/ai/chatbot`

Interact with AI chatbot for assistance.

**Request Body:**
```json
{
  "message": "I want something spicy",
  "context": {
    "userId": "64a1b2c3d4e5f6g7h8i9j0k1"
  }
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "response": "Try these spicy dishes: Spicy Chicken Wings, Hot Buffalo Pizza, Thai Curry",
    "timestamp": "2024-01-15T12:00:00.000Z"
  }
}
```

**Supported Queries:**
- Restaurant recommendations
- Dietary preferences (vegetarian, vegan)
- Spice level preferences
- Budget-friendly options
- Order tracking assistance

---

### 2. AI Recommendations
**POST** `/api/ai/recommendations`

Get personalized restaurant recommendations based on user preferences and history.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "preferences": ["Italian", "Pizza"],
  "dietary": ["vegetarian"]
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "recommendations": [
      {
        "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
        "name": "Pizza Palace",
        "rating": 4.5,
        "cuisine": ["Italian", "Pizza"],
        "tags": ["vegetarian-friendly"]
      }
    ],
    "reason": "Based on your preferences and order history"
  }
}
```

---

### 3. AI Review Summary
**POST** `/api/ai/reviews`

Get AI-powered summary of restaurant reviews.

**Request Body:**
```json
{
  "restaurantId": "64a1b2c3d4e5f6g7h8i9j0k1"
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "summary": "Highly rated restaurant with 120 reviews. Customers consistently praise the quality and service. Excellent food quality. Fast and reliable delivery.",
    "totalReviews": 120,
    "averageRating": 4.5,
    "averageFoodRating": 4.6,
    "averageDeliveryRating": 4.4,
    "sentiment": "positive",
    "themes": [
      "Excellent food quality",
      "Fast and reliable delivery"
    ],
    "recentReviews": [
      {
        "rating": 5,
        "comment": "Best pizza in town!",
        "userName": "John Doe",
        "createdAt": "2024-01-15T12:00:00.000Z"
      }
    ]
  }
}
```

---

### 4. AI ETA Prediction
**POST** `/api/ai/eta`

Predict estimated time of arrival for order delivery.

**Request Body:**
```json
{
  "restaurantId": "64a1b2c3d4e5f6g7h8i9j0k1",
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "New York",
    "zipCode": "10001"
  },
  "orderItems": [
    {
      "menuItemId": "64a1b2c3d4e5f6g7h8i9j0k3",
      "quantity": 2
    }
  ]
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "prepTime": 20,
    "deliveryTime": 30,
    "totalMinutes": 50,
    "estimatedDeliveryTime": "2024-01-15T13:00:00.000Z",
    "isPeakHour": false,
    "confidence": "high",
    "message": "Estimated delivery: 50 minutes"
  }
}
```

---

## User APIs

### 1. Get User Profile
**GET** `/api/users/profile`

Get authenticated user's profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001"
      },
      "profileImage": "https://example.com/profile.jpg"
    }
  }
}
```

---

### 2. Update User Profile
**PUT** `/api/users/profile`

Update user profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "John Smith",
  "phone": "+1234567899",
  "address": {
    "street": "456 New St",
    "city": "Brooklyn",
    "state": "NY",
    "zipCode": "11201"
  }
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "status": "error",
  "message": "Error description here",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (Validation Error)
- `401` - Unauthorized (No/Invalid Token)
- `403` - Forbidden (Insufficient Permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Tokens are obtained from `/api/auth/register` or `/api/auth/login` endpoints and are valid for 30 days.

---

## Rate Limiting

Consider implementing rate limiting in production:
- Authentication endpoints: 5 requests per minute
- General API endpoints: 100 requests per minute
- AI endpoints: 20 requests per minute

---

## Development Setup

1. Create `.env` file in backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/foodxpress
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=development
```

2. Install dependencies:
```bash
cd backend
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Test API health:
```bash
curl http://localhost:5000/api/health
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Prices are in USD
- Coordinates use latitude/longitude format
- Images should be URLs (file upload endpoints can be added separately)
- In production, integrate with real payment gateways
- Consider adding WebSocket support for real-time order tracking

---

**Last Updated:** January 2024  
**Version:** 1.0.0
