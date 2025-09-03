import 'socket.io';

declare module 'socket.io' {
  interface Handshake {
    auth: {
      token?: string;
    };
    query: {
      token?: string;
    };
  }

  interface Socket {
    data: {
      userId?: string;
      username?: string;
    };
  }
}
