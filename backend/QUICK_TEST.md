# Quick Test Guide

## Start the Server

```bash
cd backend
npm install
npm run dev
```

## Test with cURL

### 1. Health Check
```bash
curl http://localhost:5000/api/health
```

### 2. Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "1234567890"
  }'
```

### 3. Login (NO MORE 500 ERROR!)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 4. Get Restaurants (Proper JSON Response)
```bash
# All restaurants
curl http://localhost:5000/api/restaurants

# With filters
curl "http://localhost:5000/api/restaurants?minRating=4&priceRange=$$&cuisine=Italian"
```

## Test with Postman

Import the `POSTMAN_EXAMPLES.json` file or use these examples:

### Register
- **Method:** POST
- **URL:** `http://localhost:5000/api/auth/register`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "1234567890"
}
```

### Login
- **Method:** POST
- **URL:** `http://localhost:5000/api/auth/login`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Get Restaurants
- **Method:** GET
- **URL:** `http://localhost:5000/api/restaurants?minRating=4&cuisine=Italian`

## Expected Results

✅ **Health Check:** Returns status "success"  
✅ **Register:** Returns user data + JWT token  
✅ **Login:** Returns 200 status + JWT token (NO 500 ERROR!)  
✅ **Restaurants:** Returns JSON array with pagination metadata (NOT 304!)  

## All Issues Fixed!

- ✅ MongoDB deprecation warnings removed
- ✅ Login endpoint working (no 500 error)
- ✅ Restaurants endpoint with filters working
- ✅ Comprehensive error handling
- ✅ Input validation
