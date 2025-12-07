// Settings Service for managing shop settings
class SettingsService {
  constructor() {
    this.baseURL = 'http://localhost:8080';
  }

  // Get shop settings
  async getSettings() {
    try {
      const response = await fetch(`${this.baseURL}/api/admin/settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.success ? data.data : null;
      }
      return null;
    } catch (error) {
      console.error('Get settings error:', error);
      return null;
    }
  }

  // Get public settings (for client side)
  async getPublicSettings() {
    try {
      const response = await fetch(`${this.baseURL}/settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.success ? data.data : null;
      }
      return null;
    } catch (error) {
      console.error('Get public settings error:', error);
      return null;
    }
  }

  // Update settings
  async updateSettings(settings) {
    try {
      const response = await fetch(`${this.baseURL}/api/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.success ? data.data : null;
      }
      return null;
    } catch (error) {
      console.error('Update settings error:', error);
      return null;
    }
  }

  // Upload logo
  async uploadLogo(file) {
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch(`${this.baseURL}/api/admin/settings/upload-logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.success ? data.data : null;
      }
      return null;
    } catch (error) {
      console.error('Upload logo error:', error);
      return null;
    }
  }

  // Upload banner images
  async uploadBanners(files) {
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('banners', file);
      });

      const response = await fetch(`${this.baseURL}/api/admin/settings/upload-banners`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.success ? data.data : null;
      }
      return null;
    } catch (error) {
      console.error('Upload banners error:', error);
      return null;
    }
  }

  // Delete logo
  async deleteLogo() {
    try {
      const response = await fetch(`${this.baseURL}/api/admin/settings/logo`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.success;
      }
      return false;
    } catch (error) {
      console.error('Delete logo error:', error);
      return false;
    }
  }

  // Delete banner
  async deleteBanner(bannerName) {
    try {
      const response = await fetch(`${this.baseURL}/api/admin/settings/banner/${bannerName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.success;
      }
      return false;
    } catch (error) {
      console.error('Delete banner error:', error);
      return false;
    }
  }

  // Get image URL
  getImageUrl(filename) {
    if (!filename) return null;
    return `${this.baseURL}/uploads/${filename}`;
  }

  // Get logo URL
  getLogoUrl(logo) {
    return this.getImageUrl(logo);
  }

  // Get banner URLs
  getBannerUrls(banners) {
    if (!banners || !Array.isArray(banners)) return [];
    return banners.map(banner => this.getImageUrl(banner));
  }
}

export default SettingsService;
