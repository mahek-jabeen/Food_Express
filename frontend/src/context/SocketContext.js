import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();
  const socketRef = useRef(null);
  const connectionAttempted = useRef(false);

  useEffect(() => {
    // Only connect if user is logged in and connection hasn't been attempted
    if (!user || connectionAttempted.current) {
      if (socketRef.current && !user) {
        // User logged out, disconnect socket
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setConnected(false);
        connectionAttempted.current = false;
      }
      return;
    }

    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (!token) return;

    // Mark connection attempt to prevent duplicates
    connectionAttempted.current = true;

    // Initialize Socket.IO connection only once
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: {
        token: token
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      setConnected(true);

      // Auto-join restaurant room if user is restaurant
      if (user.role === 'restaurant' && user.restaurantId) {
        console.log('🏪 Joining restaurant room:', user.restaurantId);
        newSocket.emit('join-restaurant', user.restaurantId);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      setConnected(false);
    });

    // Store socket reference and state
    socketRef.current = newSocket;
    setSocket(newSocket);

    // Cleanup on unmount or user change
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setConnected(false);
        connectionAttempted.current = false;
      }
    };
  }, [user?._id, user?.role, user?.restaurantId]);

  const joinOrderRoom = (orderId) => {
    if (socketRef.current) {
      socketRef.current.emit('join-order', orderId);
      console.log(`📦 Joined order room: ${orderId}`);
    }
  };

  const leaveOrderRoom = (orderId) => {
    if (socketRef.current) {
      socketRef.current.emit('leave-order', orderId);
      console.log(`📦 Left order room: ${orderId}`);
    }
  };

  const cleanup = () => {
    if (socketRef.current) {
      // Leave all order rooms before disconnecting
      socketRef.current.emit('leave-all-orders');
      socketRef.current.disconnect();
      console.log('🧹 Socket cleanup completed');
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
      connectionAttempted.current = false;
    }
  };

  const value = {
    socket: socketRef.current,
    connected,
    joinOrderRoom,
    leaveOrderRoom,
    cleanup
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
