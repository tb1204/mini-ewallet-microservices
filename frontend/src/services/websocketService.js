import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let stompClient = null;

export const connectWebSocket = (userId, onNotificationReceived) => {
  if (!userId) return null;

  // Use SockJS fallback pointing to API Gateway endpoint
  const socketUrl = 'http://localhost:8080/ws-notifications';

  stompClient = new Client({
    webSocketFactory: () => new SockJS(socketUrl),
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    onConnect: () => {
      console.log('✅ Connected to WebSocket STOMP Notification Broker');
      const topic = `/topic/notifications/${userId}`;
      stompClient.subscribe(topic, (message) => {
        try {
          const notification = JSON.parse(message.body);
          console.log('🔔 Received live notification via WebSocket:', notification);
          if (onNotificationReceived) {
            onNotificationReceived(notification);
          }
        } catch (err) {
          console.warn('Failed to parse websocket message payload:', err);
        }
      });
    },
    onStompError: (frame) => {
      console.warn('STOMP Broker error: ' + frame.headers['message']);
    },
    onWebSocketClose: () => {
      console.log('WebSocket connection closed.');
    },
  });

  stompClient.activate();
  return stompClient;
};

export const disconnectWebSocket = () => {
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
  }
};

