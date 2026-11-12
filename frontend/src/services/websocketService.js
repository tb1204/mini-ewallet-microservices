import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let stompClient = null;

export const connectWebSocket = (userId, onNotificationReceived) => {
  if (!userId) return null;

  try {
    const host = window.location.hostname || 'localhost';
    const socketUrl = `http://${host}:8085/ws-notifications`;

    stompClient = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log(' Connected to WebSocket STOMP Notification Broker');
        const topic = `/topic/notifications/${userId}`;
        stompClient.subscribe(topic, (message) => {
          try {
            const notification = JSON.parse(message.body);
            console.log(' Received live notification via WebSocket:', notification);
            if (onNotificationReceived) {
              onNotificationReceived(notification);
            }
          } catch (err) {
            console.warn('Failed to parse websocket message payload:', err);
          }
        });
      },
      onStompError: (frame) => {
        console.warn('STOMP Broker error: ' + frame?.headers?.['message']);
      },
      onWebSocketClose: () => {
        console.log('WebSocket connection closed.');
      },
      onWebSocketError: (error) => {
        console.warn('WebSocket connection error (will auto-reconnect):', error);
      },
    });

    stompClient.activate();
    return stompClient;
  } catch (err) {
    console.warn('Could not initialize WebSocket connection:', err);
    return null;
  }
};

export const disconnectWebSocket = () => {
  try {
    if (stompClient) {
      stompClient.deactivate();
      stompClient = null;
    }
  } catch (err) {
    console.warn('Error during WebSocket disconnect:', err);
  }
};

