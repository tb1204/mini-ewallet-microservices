import axiosClient from './axiosClient';

const NOTIFICATION_URL = '/v1/notifications';

export const notificationApi = {
  getUserNotifications: async (userId) => {
    return await axiosClient.get(NOTIFICATION_URL, { params: { userId } });
  },

  getUnreadCount: async (userId) => {
    return await axiosClient.get(`${NOTIFICATION_URL}/unread-count`, { params: { userId } });
  },

  markAsRead: async (id) => {
    return await axiosClient.put(`${NOTIFICATION_URL}/${id}/read`);
  },

  markAllAsRead: async (userId) => {
    return await axiosClient.put(`${NOTIFICATION_URL}/read-all`, null, { params: { userId } });
  },
};

export default notificationApi;

