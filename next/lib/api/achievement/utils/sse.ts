// SSE 연결 관리
const connections = new Map<string, ReadableStreamDefaultController>();

export function addSSEConnection(userId: string, controller: ReadableStreamDefaultController) {
  connections.set(userId, controller);
}

export function removeSSEConnection(userId: string) {
  connections.delete(userId);
}

export function sendSSEToUser(userId: string, data: any) {
  if (connections.size === 0) {
      setTimeout(() => sendSSEToUser(userId, data), 1000);
      return;
  }
  const controller = connections.get(userId);
  
  if (controller) {
    const encoder = new TextEncoder();
    const message = `data: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(encoder.encode(message));
  }
}