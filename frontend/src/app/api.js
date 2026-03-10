const API_URL = import.meta.env.VITE_API_URL || 'http://172.20.10.2:3001/api';

class ApiClient {
  constructor() {
    this.baseURL = API_URL;
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken() {
    return this.token || localStorage.getItem('token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      credentials: 'include', 
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // If unauthorized, clear token
        if (response.status === 401) {
          this.setToken(null);
        }
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Auth endpoints
  async register(username, password) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    
    return data;
  }

  async login(username, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    
    return data;
  }

  async logout() {
    const data = await this.request('/auth/logout', {
      method: 'POST',
    });
    
    this.setToken(null);
    
    return data;
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Time blocks endpoints
  async getTimeBlocks() {
    return this.request('/timeblocks');
  }

  async getTimeBlocksByRange(startDate, endDate) {
    return this.request(`/timeblocks/range?startDate=${startDate}&endDate=${endDate}`);
  }

  async createTimeBlock(data) {
    return this.request('/timeblocks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTimeBlock(id, data) {
    return this.request(`/timeblocks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTimeBlock(id) {
    return this.request(`/timeblocks/${id}`, {
      method: 'DELETE',
    });
  }

  // Personal info endpoints
  async getPersonalInfo() {
    return this.request('/personalinfo');
  }

  async savePersonalInfo(data) {
    return this.request('/personalinfo', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();