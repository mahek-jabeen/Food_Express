import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;

// Initialize Socket.IO
export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Socket.IO authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      socket.restaurantId = decoded.restaurantId;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ Socket connected: ${socket.id} | User: ${socket.userId} | Role: ${socket.userRole}`);

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Join role-based rooms
    if (socket.userRole === 'restaurant') {
      if (socket.restaurantId) {
        socket.join(`restaurant:${socket.restaurantId}`);
        console.log(`🏪 Restaurant ${socket.userId} joined restaurant room: ${socket.restaurantId}`);
      }
    } else if (socket.userRole === 'delivery') {
      socket.join('delivery');
      console.log(`🚚 Delivery ${socket.userId} joined delivery room`);
    }

    // Handle joining specific order room
    socket.on('join-order', (orderId) => {
      socket.join(`order:${orderId}`);
      console.log(`📦 User ${socket.userId} joined order room: ${orderId}`);
    });

    // Handle leaving order room
    socket.on('leave-order', (orderId) => {
      socket.leave(`order:${orderId}`);
      console.log(`📦 User ${socket.userId} left order room: ${orderId}`);
    });

    // Handle joining restaurant room (for restaurant owners)
    socket.on('join-restaurant', (restaurantId) => {
      if (socket.userRole === 'restaurant') {
        socket.join(`restaurant:${restaurantId}`);
        console.log(`🏪 Restaurant ${socket.userId} joined restaurant room: ${restaurantId}`);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.id} | User: ${socket.userId}`);
    });
  });

  console.log('🔌 Socket.IO initialized');
  return io;
};

// Get Socket.IO instance
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

// Emit order status update to all relevant parties
export const emitOrderUpdate = (order) => {
  if (!io) return;

  console.log(`🔔 Order changed: ${order._id} | Status: ${order.status} | Restaurant: ${order.restaurantId}`);

  // 🔥 RESTAURANT-SPECIFIC ROOMS: Emit only to the correct restaurant
  const restaurantRoom = `restaurant_${order.restaurantId}`;
  const userRoom = `user_${order.user._id || order.user}`;
  const orderRoom = `order_${order._id}`;

  // Emit specific events based on order status
  switch (order.status) {
    case 'paid':
      // New order for specific restaurant only (when payment is completed)
      io.to(restaurantRoom).emit('new-order', order);
      console.log(`📤 Emitted new-order to room: ${restaurantRoom}`);
      break;
    
    case 'preparing':
      // Order is being prepared
      io.to(restaurantRoom).emit('order-updated', order);
      io.to(userRoom).emit('order-updated', order);
      io.to(orderRoom).emit('order-updated', order);
      console.log(`📤 Emitted order-updated to rooms: ${restaurantRoom}, ${userRoom}, ${orderRoom}`);
      break;
    
    case 'ready':
      // Order ready for delivery pickup
      io.to('delivery').emit('order-ready', order);
      io.to(restaurantRoom).emit('order-updated', order);
      io.to(userRoom).emit('order-updated', order);
      io.to(orderRoom).emit('order-updated', order);
      console.log(`📤 Emitted order-ready to delivery and order-updated to: ${restaurantRoom}, ${userRoom}, ${orderRoom}`);
      break;
    
    case 'picked_up':
      // Order picked up by delivery partner
      io.to(userRoom).emit('order-picked', order);
      io.to(orderRoom).emit('order-picked', order);
      console.log(`📤 Emitted order-picked to rooms: ${userRoom}, ${orderRoom}`);
      break;
    
    case 'delivered':
      // Order delivered
      io.to(userRoom).emit('order-delivered', order);
      io.to(orderRoom).emit('order-delivered', order);
      console.log(`📤 Emitted order-delivered to rooms: ${userRoom}, ${orderRoom}`);
      break;
  }
};


