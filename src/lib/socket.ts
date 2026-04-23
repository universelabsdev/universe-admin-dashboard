import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    if (this.socket) return this.socket;

    this.socket = io(SOCKET_URL, {
      auth: {
        token,
      },
    });

    this.socket.on('connect', () => {
      console.log('Connected to Socket.io server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from Socket.io server');
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  joinRoom(room: string) {
    if (this.socket) {
      this.socket.emit('join_room', room);
    }
  }

  leaveRoom(room: string) {
    if (this.socket) {
      this.socket.emit('leave_room', room);
    }
  }
}

export const socketService = new SocketService();
