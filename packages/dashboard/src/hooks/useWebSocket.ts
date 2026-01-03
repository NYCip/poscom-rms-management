import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useIssueStore } from '@/stores/issue.store';
import { useAuthStore } from '@/stores/auth.store';

// Use current origin for WebSocket - works with any host/port
const WS_URL = import.meta.env.VITE_WS_URL || window.location.origin;

export const useWebSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const { setIssues, updateIssue } = useIssueStore();
  const { token, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    // Only connect if authenticated
    if (!isAuthenticated || !token) {
      return;
    }

    socketRef.current = io(WS_URL, {
      transports: ['websocket', 'polling'],
      auth: { token },
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
      // If auth error, logout
      if (error.message.includes('Authentication') || error.message.includes('token')) {
        logout();
      }
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket:', reason);
    });

    socketRef.current.on('issues:init', (issues) => setIssues(issues));
    socketRef.current.on('issue:updated', ({ id, updates }) => updateIssue(id, updates));

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [token, isAuthenticated, setIssues, updateIssue, logout]);

  return socketRef.current;
};
