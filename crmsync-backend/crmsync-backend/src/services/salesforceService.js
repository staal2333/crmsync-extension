/**
 * Salesforce Service - Helper methods for Salesforce CRM operations
 */

const axios = require('axios');

class SalesforceService {
  /**
   * Find contact by email
   */
  async findContactByEmail(accessToken, instanceUrl, email) {
    try {
      const query = `SELECT Id, FirstName, LastName, Email, Phone FROM Contact WHERE Email = '${email}' LIMIT 1`;
      
      const response = await axios.get(
        `${instanceUrl}/services/data/v57.0/query`,
        {
          params: { q: query },
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.records && response.data.records.length > 0) {
        return response.data.records[0];
      }

      return null;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Create contact
   */
  async createContact(accessToken, instanceUrl, fields) {
    const response = await axios.post(
      `${instanceUrl}/services/data/v57.0/sobjects/Contact`,
      this.cleanFields(fields),
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  }

  /**
   * Update contact
   */
  async updateContact(accessToken, instanceUrl, contactId, fields) {
    const response = await axios.patch(
      `${instanceUrl}/services/data/v57.0/sobjects/Contact/${contactId}`,
      this.cleanFields(fields),
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  }

  /**
   * Clean fields (remove undefined values)
   */
  cleanFields(fields) {
    const cleaned = {};
    
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined && value !== null) {
        cleaned[key] = value;
      }
    }
    
    return cleaned;
  }
}

module.exports = new SalesforceService();
