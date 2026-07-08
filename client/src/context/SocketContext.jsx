import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [nickname, setNickname] = useState(() => localStorage.getItem('dreamora_nickname') || '');
  const [avatar, setAvatar] = useState(() => localStorage.getItem('dreamora_avatar') || '🧑‍💻');
  const [currentRoom, setCurrentRoom] = useState('');
  const [roomUsers, setRoomUsers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [activeCheer, setActiveCheer] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:5000`;
    console.log(`Socket attempting connection to backend: ${backendUrl}`);
    
    const newSocket = io(backendUrl, {
      autoConnect: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Socket client connected 🔌');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket client disconnected 🔌');
    });

    newSocket.on('roomUsers', (users) => {
      setRoomUsers(users);
    });

    newSocket.on('message', (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    newSocket.on('cheer', (cheerData) => {
      setActiveCheer({
        id: Math.random(),
        ...cheerData
      });
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const joinRoom = (name, room, userAvatar) => {
    if (!socket) return;
    
    setNickname(name);
    setAvatar(userAvatar);
    setCurrentRoom(room);
    setChatMessages([]); // Clear chat history for the new space

    localStorage.setItem('dreamora_nickname', name);
    localStorage.setItem('dreamora_avatar', userAvatar);

    if (room) {
      if (!socket.connected) {
        socket.connect();
      }
      
      // Wait until socket is connected before emitting, or emit directly if active
      if (socket.connected) {
        socket.emit('joinRoom', { nickname: name, room, avatar: userAvatar });
      } else {
        socket.once('connect', () => {
          socket.emit('joinRoom', { nickname: name, room, avatar: userAvatar });
        });
      }
    }
  };

  const updateStatus = (status) => {
    if (socket && socket.connected) {
      socket.emit('updateStatus', status);
    }
  };

  const sendMessage = (text) => {
    if (socket && socket.connected) {
      socket.emit('chatMessage', text);
    }
  };

  const sendCheer = (emoji) => {
    if (socket && socket.connected) {
      socket.emit('sendCheer', { emoji });
    }
  };

  const leaveRoom = () => {
    if (socket) {
      socket.disconnect();
      setCurrentRoom('');
      setRoomUsers([]);
      setChatMessages([]);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        nickname,
        avatar,
        currentRoom,
        roomUsers,
        chatMessages,
        activeCheer,
        isConnected,
        joinRoom,
        updateStatus,
        sendMessage,
        sendCheer,
        leaveRoom
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
