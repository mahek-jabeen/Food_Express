// Simple test to verify real-time functionality
const io = require('socket.io-client');

console.log('🧪 Starting real-time test...');

// Connect to backend
const socket = io('http://localhost:5000', {
  auth: {
    token: 'test-token'
  }
});

socket.on('connect', () => {
  console.log('✅ Connected to socket:', socket.id);
  
  // Join test rooms
  socket.emit('join-restaurant', 'test-restaurant-id');
  socket.emit('join-order', 'test-order-id');
  socket.emit('join-order', 'test-order-id-2');
});

socket.on('order-changed', (data) => {
  console.log('🔔 Received order-changed:', data);
});

socket.on('new-order', (data) => {
  console.log('🆕 Received new-order:', data);
});

socket.on('order-ready', (data) => {
  console.log('📦 Received order-ready:', data);
});

socket.on('order-picked', (data) => {
  console.log('🚚 Received order-picked:', data);
});

socket.on('order-delivered', (data) => {
  console.log('✅ Received order-delivered:', data);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected');
});

console.log('🎯 Test script ready. Monitor console for events...');
