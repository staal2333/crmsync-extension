/**
 * HubSpot Service - Helper methods for HubSpot CRM operations
 */

const axios = require('axios');

class HubSpotService {
  constructor() {
    this.baseUrl = 'https://api.hubapi.com';
  }

  /**
   * Find contact by email
   */
  async findContactByEmail(accessToken, email) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/crm/v3/objects/contacts/search`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          data: {
            filterGroups: [{
              filters: [{
                propertyName: 'email',
                operator: 'EQ',
                value: email
              }]
            }]
          }
        }
      );

      if (response.data.results && response.data.results.length > 0) {
        return response.data.results[0];
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
  async createContact(accessToken, properties) {
    const response = await axios.post(
      `${this.baseUrl}/crm/v3/objects/contacts`,
      {
        properties: this.cleanProperties(properties)
      },
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
  async updateContact(accessToken, contactId, properties) {
    const response = await axios.patch(
      `${this.baseUrl}/crm/v3/objects/contacts/${contactId}`,
      {
        properties: this.cleanProperties(properties)
      },
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
   * Clean properties (remove undefined values)
   */
  cleanProperties(properties) {
    const cleaned = {};
    
    for (const [key, value] of Object.entries(properties)) {
      if (value !== undefined && value !== null) {
        cleaned[key] = value;
      }
    }
    
    return cleaned;
  }
}

module.exports = new HubSpotService();
