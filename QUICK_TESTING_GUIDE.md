# 🚀 QUICK TESTING GUIDE

## 🎯 OBJECTIVE
Test fake UPI payment flow and live map tracking

## 📋 TESTING STEPS

### 1. Start Servers
```bash
# Backend
cd backend && npm run dev

# Frontend  
cd frontend && npm start
```

### 2. Test UPI Payment Flow
1. **Login as Customer**: `customer@test.com` / `123456`
2. **Add items** to cart from any restaurant
3. **Go to Checkout**
4. **Select UPI Payment** (should show 📱 icon)
5. **Click "Place Order"**
6. **Verify Modal Opens**:
   - Shows fake QR code
   - UPI ID input field
   - UPI App dropdown
7. **Enter UPI ID**: `test@upi` (must contain @)
8. **Select App**: Google Pay
9. **Click "Confirm Payment"**
10. **Verify Success**: 
    - Modal closes
    - "Payment Successful" alert
    - Redirects to track order page

### 3. Test Map Tracking
1. **Track Order Page** should show:
   - Order status timeline
   - Map below (always visible)
   - Markers: 🍕 Restaurant, 🏠 Customer
2. **Login as Restaurant**: `restaurant@test.com` / `123456`
3. **Update Order Status**: pending → preparing → ready
4. **Login as Delivery**: `delivery@test.com` / `123456`
5. **Accept Order** in delivery dashboard
6. **Verify Map Updates**:
   - Delivery partner marker appears (🚚 green)
   - Real-time location tracking
   - Map center updates properly

### 4. Multi-Session Testing
- **Chrome Normal**: Customer session
- **Chrome Incognito**: Restaurant session
- **Edge/Firefox**: Delivery session
- **Verify**: Each maintains independent auth and socket updates

## ✅ SUCCESS CRITERIA

- [ ] UPI modal opens and validates @ in UPI ID
- [ ] Payment returns 201 success (not 400)
- [ ] Map always renders (no white screen)
- [ ] Markers appear with proper icons
- [ ] Real-time updates work across all sessions
- [ ] No JSX syntax errors
- [ ] Role-based access control enforced

## 🐛 COMMON ISSUES

**Issue**: "UPI payment failed with 400"
**Fix**: Check backend controller accepts upiId and upiApp

**Issue**: "White screen on map"
**Fix**: Verify getValidCoordinates() function and fallback coordinates

**Issue**: "No markers visible"
**Fix**: Check coordinate priority: delivery > customer > restaurant

**Issue**: "Socket updates not working"
**Fix**: Verify all 3 sessions are connected (check browser console)

---

**🎉 All tests should pass with the fake UPI payment and live map tracking!**
