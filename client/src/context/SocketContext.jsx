import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { getSocket, updateSocketAuth, disconnectSocket, joinBookingRoom, leaveBookingRoom } from '../services/socket';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (token) {
      const s = updateSocketAuth(token);
      setSocket(s);

      const onConnect = () => setIsConnected(true);
      const onDisconnect = () => setIsConnected(false);

      s.on('connect', onConnect);
      s.on('disconnect', onDisconnect);

      if (s.connected) setIsConnected(true);

      return () => {
        s.off('connect', onConnect);
        s.off('disconnect', onDisconnect);
      };
    } else {
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
    }
  }, [token, user?._id]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinBooking: joinBookingRoom,
        leaveBooking: leaveBookingRoom,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    // Return safe fallback if outside provider
    return {
      socket: getSocket(),
      isConnected: false,
      joinBooking: joinBookingRoom,
      leaveBooking: leaveBookingRoom,
    };
  }
  return context;
};

export default SocketContext;
