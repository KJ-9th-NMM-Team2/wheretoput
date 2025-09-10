// SSE 연결 관리
const connections = new Map<string, ReadableStreamDefaultController>();
const maxConnectRequest = 5;

export function addSSEConnection(userId: string, controller: ReadableStreamDefaultController) {
  connections.set(userId, controller);
}

export function removeSSEConnection(userId: string) {
  connections.delete(userId);
}

export function sendSSEToUser(userId: string, data: any, connectRequest: number) {
  // userId가 connections에 포함되지 않은 경우 connect 최대 5번 재시도
  if (connectRequest <= maxConnectRequest && !connections.has(userId)) {
      setTimeout(() => sendSSEToUser(userId, data, connectRequest + 1), 1000);
      return;
  }

  if (connectRequest > maxConnectRequest) {
    console.log("Max Connection 초과로 인해 종료");
    return;
  }
  const controller = connections.get(userId);
  
  if (controller) {
    const encoder = new TextEncoder();
    const message = `data: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(encoder.encode(message));
  }
}