import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { MicronetNode } from '../types';
import { sanitizeContent } from '../utils/sanitizer';

export function useChat(userId: string, isMicronetActive: boolean, micronetDevice: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [whisperTo, setWhisperTo] = useState<{userId: string} | null>(null);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('message', (msg: any) => setChatMessages(prev => [...prev, msg]));
    newSocket.on('whisper', (msg: any) => setChatMessages(prev => [...prev, msg]));
    newSocket.on('clear_user_messages', (data: { userId: string }) => {
      setChatMessages(prev => prev.filter(msg => msg.userId !== data.userId && msg.fromUserId !== data.userId));
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const joinRoom = (room: string) => {
    socket?.emit('join', { 
      room, 
      isMicronet: isMicronetActive,
      deviceName: micronetDevice,
      userId: userId || undefined
    });
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() && socket) {
      const sanitizedText = sanitizeContent(chatInput);
      if (whisperTo) {
        socket.emit('whisper', {
          toUserId: whisperTo.userId,
          text: sanitizedText
        });
        setWhisperTo(null);
      } else {
        socket.emit('message', { 
          room: 'lobby', 
          text: sanitizedText,
          isMicronet: isMicronetActive,
          deviceName: micronetDevice
        });
      }
      setChatInput('');
    }
  };

  return {
    socket,
    chatMessages,
    chatInput,
    setChatInput,
    whisperTo,
    setWhisperTo,
    joinRoom,
    sendMessage
  };
}
