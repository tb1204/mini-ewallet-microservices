import axiosClient from './axiosClient';

const AUDIT_SERVICE_URL = '/v1/audit/logs';
const CONFIG_SERVICE_URL = '/v1/configs';

/**
 * System audit logs and dynamic configurations API endpoints
 */
export const auditApi = {
  /**
   * Admin/Staff Query: Retrieve paginated audit logs with search keyword and sorting
   * @param {Object} params - { keyword, page, size, sort }
   */
  getAuditLogs: async (params = {}) => {
    return await axiosClient.get(AUDIT_SERVICE_URL, { params });
  },

  /**
   * Admin/Staff Query: Retrieve specific audit log detail by UUID
   * @param {string} id
   */
  getAuditLogById: async (id) => {
    return await axiosClient.get(`${AUDIT_SERVICE_URL}/${id}`);
  },

  /**
   * Retrieve all active system configurations
   */
  getSystemConfigs: async () => {
    return await axiosClient.get(CONFIG_SERVICE_URL);
  },

  /**
   * Retrieve specific system configuration by key
   * @param {string} key
   */
  getSystemConfigByKey: async (key) => {
    return await axiosClient.get(`${CONFIG_SERVICE_URL}/${encodeURIComponent(key)}`);
  },

  /**
   * Admin Action: Update single system configuration item
   * @param {string} key
   * @param {Object} data - { configValue, description }
   */
  updateSystemConfig: async (key, { configValue, description }) => {
    return await axiosClient.put(`${CONFIG_SERVICE_URL}/${encodeURIComponent(key)}`, {
      configValue,
      description,
    });
  },

  /**
   * Admin Action: Batch update multiple system configuration items
   * @param {Object} configs - Map of { [key]: value }
   */
  batchUpdateSystemConfigs: async (configs) => {
    return await axiosClient.put(`${CONFIG_SERVICE_URL}/batch`, { configs });
  },
};

export default auditApi;
