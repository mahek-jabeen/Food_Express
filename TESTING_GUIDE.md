# 🍕 Food Delivery Marketplace - Multi-Role Testing Guide

## 🚀 QUICK SETUP

### 1. Start Backend & Frontend
```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm install
npm start
```

### 2. Create Test Users (if not exists)

#### Customer Account
- **Email**: `customer@test.com`
- **Password**: `123456`
- **Role**: `customer`
- **Phone**: `9876543210`
- **Address**: Add any address for delivery

#### Restaurant Account  
- **Email**: `restaurant@test.com`
- **Password**: `123456`
- **Role**: `restaurant`
- **Phone**: `9876543211`

#### Delivery Partner Account
- **Email**: `delivery@test.com` 
- **Password**: `123456`
- **Role**: `delivery`
- **Phone**: `9876543212`

## 🧪 MULTI-SESSION TESTING SETUP

### Chrome Normal Window → Customer
1. Open Chrome normally
2. Go to `http://localhost:3000`
3. Login as: `customer@test.com` / `123456`
4. This session maintains Customer JWT

### Chrome Incognito → Restaurant
1. Open Chrome Incognito (Ctrl+Shift+N)
2. Go to `http://localhost:3000`
3. Login as: `restaurant@test.com` / `123456`
4. This session maintains Restaurant JWT independently

### Edge/Firefox → Delivery Partner
1. Open Edge or Firefox browser
2. Go to `http://localhost:3000`
3. Login as: `delivery@test.com` / `123456`
4. This session maintains Delivery JWT independently

## 📋 COMPLETE TESTING SCENARIO

### Step 1: Customer Creates Order (Chrome Normal)
1. **Browse Restaurants** → Select any restaurant
2. **Add Items** → Add 2-3 items to cart
3. **Checkout** → 
   - Select UPI payment
   - Confirm address
   - Place order
4. **Payment Success** → Should see success page instantly
5. **Track Order** → Click "Track Your Order" button

### Step 2: Restaurant Processes Order (Chrome Incognito)
1. **Go to Restaurant Dashboard** → `/restaurant/dashboard`
2. **See New Order** → Order appears with "pending_payment" → "paid" status
3. **Update Status**:
   - Click order → Change to "preparing"
   - Wait 2 minutes → Change to "ready"
4. **Real-time Updates** → Customer should see status changes live

### Step 3: Delivery Partner Accepts (Edge/Firefox)
1. **Go to Delivery Dashboard** → `/delivery/dashboard`
2. **See Available Orders** → Order appears in "Available Orders"
3. **Accept Delivery** → Click "✓ Accept Delivery"
4. **Track on Map** → Click order to see live map
5. **Mark Delivered** → When ready, click "✓ Mark as Delivered"

### Step 4: Customer Tracks Delivery (Chrome Normal)
1. **Live Updates** → Should see:
   - Order accepted by delivery partner
   - Real-time location tracking on map
   - Status changes: picked_up → delivered
2. **Final Confirmation** → Order marked as delivered

## 🔧 WHAT WE FIXED

### ✅ UPI Payment Flow
- **Before**: UPI payments failed with 400 errors
- **After**: Instant mock UPI payment with 201 success
- **Endpoint**: `POST /api/payment/instant-upi`
- **Response**: Immediate success with mock transaction ID

### ✅ Socket Events
- **payment-success**: Emitted to customer, restaurant, delivery rooms
- **order-ready**: Restaurant → Delivery partners
- **order-picked**: Delivery → All parties
- **order-delivered**: Delivery → All parties

### ✅ Role-Based Access
- **Customer**: Can create orders, pay, track
- **Restaurant**: Can update order status (pending → preparing → ready)
- **Delivery**: Can accept orders, mark delivered
- **Cross-role protection**: Each role cannot access other dashboards

## 🧪 TESTING CHECKLIST

### Customer Flow ✅
- [ ] Can browse restaurants
- [ ] Can add items to cart
- [ ] Can checkout with UPI (instant success)
- [ ] Can track order with live updates
- [ ] Cannot access restaurant/delivery dashboards

### Restaurant Flow ✅
- [ ] Can see new orders in dashboard
- [ ] Can update order status: pending → preparing → ready
- [ ] Receives real-time payment notifications
- [ ] Cannot access customer/delivery dashboards

### Delivery Flow ✅
- [ ] Can see available orders
- [ ] Can accept delivery assignments
- [ ] Can view live tracking map
- [ ] Can mark orders as delivered
- [ ] Cannot access customer/restaurant dashboards

### Socket Events ✅
- [ ] Payment success notifications
- [ ] Order status updates
- [ ] Real-time location tracking
- [ ] Independent sessions receive correct events

## 🐛 COMMON ISSUES & SOLUTIONS

### Issue: "Payment failed with 400"
**Solution**: Using new `/api/payment/instant-upi` endpoint

### Issue: "No socket updates"
**Solution**: Check browser console for socket connection, ensure all 3 sessions are connected

### Issue: "Can't access dashboard"
**Solution**: Verify user role in JWT token, check RoleBasedRoute component

### Issue: "Order not appearing"
**Solution**: Check order status flow: pending_payment → paid → preparing → ready → picked_up → delivered

## 🎯 SUCCESS INDICATORS

✅ **UPI Payment**: Returns 201 with mock transaction ID  
✅ **Real-time Updates**: All 3 sessions see changes instantly  
✅ **Role Isolation**: Each role only sees their dashboards  
✅ **Complete Flow**: Order creation → Payment → Restaurant prep → Delivery → Customer tracking  
✅ **Socket Events**: Console shows successful socket connections and events  

## 📝 NOTES

- **No Real Payment Gateway**: All UPI payments are mocked for testing
- **Independent Sessions**: Each browser maintains separate JWT and socket connection
- **Database**: All changes persist across sessions
- **Real-time**: Socket.IO ensures instant updates across all connected clients

---

**🎉 Testing Complete! Your food delivery marketplace now supports full multi-role testing with instant UPI payments and real-time updates.**
