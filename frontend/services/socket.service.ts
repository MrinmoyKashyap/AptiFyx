import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/auth-store';
import { Platform } from 'react-native';

export const SOCKET_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

class SocketService {
  public socket: Socket | null = null;

  connect() {
    const token = useAuthStore.getState().token;
    if (!token) return;

    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Room tracking helpers
  joinChat(roomId: string) {
    this.socket?.emit('chat:join', roomId);
  }

  subscribeTracking(partnerId: string) {
    this.socket?.emit('tracking:subscribe', partnerId);
  }
}

export const socketService = new SocketService();

// Auto-connect/disconnect when auth changes
useAuthStore.subscribe((state, prevState) => {
  if (state.token && !prevState.token) {
    socketService.connect();
  } else if (!state.token && prevState.token) {
    socketService.disconnect();
  }
});
