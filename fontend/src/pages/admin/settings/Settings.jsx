import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Tab, Tabs } from 'react-bootstrap';
import { FaUpload, FaTrash, FaSave, FaImage, FaPhone, FaMapMarkerAlt, FaStore, FaClock, FaFacebook, FaInstagram, FaYoutube, FaTiktok, FaCog } from 'react-icons/fa';
import ErrorBoundary from '../../../components/common/ErrorBoundary';

const Settings = () => {
  const [settings, setSettings] = useState({
    shopName: '',
    phone: '',
    email: '',
    address: '',
    description: '',
    logo: '',
    bannerImages: [],
    socialMedia: {
      facebook: '',
      instagram: '',
      youtube: '',
      tiktok: ''
    },
    businessHours: {
      monday: { open: '08:00', close: '22:00', isOpen: true },
      tuesday: { open: '08:00', close: '22:00', isOpen: true },
      wednesday: { open: '08:00', close: '22:00', isOpen: true },
      thursday: { open: '08:00', close: '22:00', isOpen: true },
      friday: { open: '08:00', close: '22:00', isOpen: true },
      saturday: { open: '08:00', close: '22:00', isOpen: true },
      sunday: { open: '08:00', close: '22:00', isOpen: true }
    }
  });
const API_BASE = `http://${window.location.hostname}:8080`;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploading, setUploading] = useState(false);

  // Lấy thông tin cài đặt
  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      // Token được lưu trong cookies, không cần gửi Authorization header
      // Server sẽ tự động đọc token từ cookies
      const response = await fetch(`${API_BASE}/admin/settings`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Quan trọng: gửi cookies
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSettings(data.data);
        } else {
          setMessage({ type: 'danger', text: data.message || 'Lỗi khi tải thông tin cài đặt' });
        }
      } else {
        const errorData = await response.json();
        setMessage({ type: 'danger', text: errorData.message || `Lỗi ${response.status}: ${response.statusText}` });
      }
    } catch (error) {
      console.error('Fetch settings error:', error);
      setMessage({ type: 'danger', text: 'Lỗi kết nối. Vui lòng kiểm tra kết nối mạng.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadSettings = async () => {
      if (isMounted) {
        await fetchSettings();
      }
    };
    
    loadSettings();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Cập nhật thông tin cài đặt
  const handleUpdateSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch(`${API_BASE}/admin/settings`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessage({ type: 'success', text: 'Cập nhật cài đặt thành công!' });
        }
      }
    } catch (error) {
      setMessage({ type: 'danger', text: 'Lỗi khi cập nhật cài đặt' });
    } finally {
      setSaving(false);
    }
  };

  // Upload logo
  const handleUploadLogo = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch(`${API_BASE}/admin/settings/upload-logo`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSettings(prev => ({ ...prev, logo: data.data.logo }));
          setMessage({ type: 'success', text: 'Upload logo thành công!' });
        }
      }
    } catch (error) {
      setMessage({ type: 'danger', text: 'Lỗi khi upload logo' });
    } finally {
      setUploading(false);
    }
  };

  // Upload banner images
  const handleUploadBanners = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('banners', file);
      });

      const response = await fetch(`${API_BASE}/admin/settings/upload-banners`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSettings(prev => ({ ...prev, bannerImages: data.data.bannerImages }));
          setMessage({ type: 'success', text: 'Upload banner thành công!' });
        }
      }
    } catch (error) {
      setMessage({ type: 'danger', text: 'Lỗi khi upload banner' });
    } finally {
      setUploading(false);
    }
  };

  // Xóa logo
  const handleDeleteLogo = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/settings/logo`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSettings(prev => ({ ...prev, logo: '' }));
          setMessage({ type: 'success', text: 'Xóa logo thành công!' });
        }
      }
    } catch (error) {
      setMessage({ type: 'danger', text: 'Lỗi khi xóa logo' });
    }
  };

  // Xóa banner
  const handleDeleteBanner = async (bannerName) => {
    try {
      const response = await fetch(`${API_BASE}/admin/settings/banner/${bannerName}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSettings(prev => ({
            ...prev,
            bannerImages: prev.bannerImages.filter(banner => banner !== bannerName)
          }));
          setMessage({ type: 'success', text: 'Xóa banner thành công!' });
        }
      }
    } catch (error) {
      setMessage({ type: 'danger', text: 'Lỗi khi xóa banner' });
    }
  };

  // Xử lý thay đổi input
  const handleInputChange = useCallback((field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setSettings(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setSettings(prev => ({ ...prev, [field]: value }));
    }
  }, []);

  // Xử lý thay đổi business hours
  const handleBusinessHoursChange = useCallback((day, field, value) => {
    setSettings(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day],
          [field]: value
        }
      }
    }));
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Container fluid className="p-4">
        <Row>
          <Col>
            <Card>
              <Card.Header>
                <h4 className="mb-0">
                  <FaCog className="me-2" />
                  Cài đặt hệ thống
                </h4>
              </Card.Header>
              <Card.Body>
              {message.text && (
                <Alert variant={message.type} dismissible onClose={() => setMessage({ type: '', text: '' })}>
                  {message.text}
                </Alert>
              )}


              <Tabs defaultActiveKey="general" className="mb-3">
                {/* Tab Thông tin chung */}
                <Tab eventKey="general" title="Thông tin chung">
                  <Row className="mt-3">
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <FaStore className="me-2" />
                          Tên cửa hàng
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={settings.shopName}
                          onChange={(e) => handleInputChange('shopName', e.target.value)}
                          placeholder="Nhập tên cửa hàng"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <FaPhone className="me-2" />
                          Số điện thoại
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={settings.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="Nhập số điện thoại"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                          type="email"
                          value={settings.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="Nhập email"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <FaMapMarkerAlt className="me-2" />
                          Địa chỉ
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={settings.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          placeholder="Nhập địa chỉ"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Mô tả cửa hàng</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={settings.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Nhập mô tả cửa hàng"
                    />
                  </Form.Group>
                </Tab>

                {/* Tab Hình ảnh */}
                <Tab eventKey="images" title="Hình ảnh">
                  <Row className="mt-3">
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <FaImage className="me-2" />
                          Logo cửa hàng
                        </Form.Label>
                        <div className="d-flex align-items-center">
                          <Form.Control
                            type="file"
                            accept="image/*"
                            onChange={handleUploadLogo}
                            disabled={uploading}
                            className="me-2"
                          />
                          {settings.logo && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={handleDeleteLogo}
                              disabled={uploading}
                            >
                              <FaTrash />
                            </Button>
                          )}
                        </div>
                        {settings.logo && (
                          <div className="mt-2">
                            <img
                              src={`${API_BASE}/uploads/${settings.logo}`}
                              alt="Logo"
                              style={{ maxWidth: '200px', maxHeight: '100px', objectFit: 'contain' }}
                            />
                          </div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Banner cửa hàng</Form.Label>
                        <Form.Control
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleUploadBanners}
                          disabled={uploading}
                        />
                        <Form.Text className="text-muted">
                          Có thể chọn nhiều ảnh cùng lúc (tối đa 5 ảnh)
                        </Form.Text>
                        {settings.bannerImages && settings.bannerImages.length > 0 && (
                          <div className="mt-2">
                            <Row>
                              {settings.bannerImages.map((banner, index) => (
                                <Col md={4} key={index} className="mb-2">
                                  <div className="position-relative">
                                    <img
                                      src={`${API_BASE}/uploads/${banner}`}
                                      alt={`Banner ${index + 1}`}
                                      style={{ width: '100%', height: '100px', objectFit: 'cover' }}
                                    />
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      className="position-absolute top-0 end-0"
                                      onClick={() => handleDeleteBanner(banner)}
                                      disabled={uploading}
                                    >
                                      <FaTrash />
                                    </Button>
                                  </div>
                                </Col>
                              ))}
                            </Row>
                          </div>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>
                </Tab>

                {/* Tab Mạng xã hội */}
                <Tab eventKey="social" title="Mạng xã hội">
                  <Row className="mt-3">
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <FaFacebook className="me-2 text-primary" />
                          Facebook
                        </Form.Label>
                        <Form.Control
                          type="url"
                          value={settings.socialMedia.facebook}
                          onChange={(e) => handleInputChange('socialMedia.facebook', e.target.value)}
                          placeholder="https://facebook.com/yourpage"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <FaInstagram className="me-2 text-danger" />
                          Instagram
                        </Form.Label>
                        <Form.Control
                          type="url"
                          value={settings.socialMedia.instagram}
                          onChange={(e) => handleInputChange('socialMedia.instagram', e.target.value)}
                          placeholder="https://instagram.com/yourpage"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <FaYoutube className="me-2 text-danger" />
                          YouTube
                        </Form.Label>
                        <Form.Control
                          type="url"
                          value={settings.socialMedia.youtube}
                          onChange={(e) => handleInputChange('socialMedia.youtube', e.target.value)}
                          placeholder="https://youtube.com/yourchannel"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <FaTiktok className="me-2 text-dark" />
                          TikTok
                        </Form.Label>
                        <Form.Control
                          type="url"
                          value={settings.socialMedia.tiktok}
                          onChange={(e) => handleInputChange('socialMedia.tiktok', e.target.value)}
                          placeholder="https://tiktok.com/@yourpage"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Tab>

                {/* Tab Giờ làm việc */}
                <Tab eventKey="hours" title="Giờ làm việc">
                  <Row className="mt-3">
                    {Object.keys(settings.businessHours || {}).map((day, index) => {
                      const dayData = settings.businessHours[day];
                      if (!dayData) return null;
                      
                      return (
                        <Col md={6} key={`${day}-${index}`} className="mb-3">
                          <Card>
                            <Card.Body>
                              <Form.Group>
                                <Form.Label className="text-capitalize">
                                  <FaClock className="me-2" />
                                  {day === 'monday' ? 'Thứ 2' :
                                   day === 'tuesday' ? 'Thứ 3' :
                                   day === 'wednesday' ? 'Thứ 4' :
                                   day === 'thursday' ? 'Thứ 5' :
                                   day === 'friday' ? 'Thứ 6' :
                                   day === 'saturday' ? 'Thứ 7' : 'Chủ nhật'}
                                </Form.Label>
                                <div className="d-flex align-items-center">
                                  <Form.Check
                                    type="checkbox"
                                    checked={dayData.isOpen || false}
                                    onChange={(e) => handleBusinessHoursChange(day, 'isOpen', e.target.checked)}
                                    className="me-3"
                                  />
                                  {dayData.isOpen ? (
                                    <div className="d-flex align-items-center">
                                      <Form.Control
                                        type="time"
                                        value={dayData.open || '08:00'}
                                        onChange={(e) => handleBusinessHoursChange(day, 'open', e.target.value)}
                                        className="me-2"
                                        style={{ width: '120px' }}
                                      />
                                      <span className="me-2">-</span>
                                      <Form.Control
                                        type="time"
                                        value={dayData.close || '22:00'}
                                        onChange={(e) => handleBusinessHoursChange(day, 'close', e.target.value)}
                                        style={{ width: '120px' }}
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-muted">Đóng cửa</span>
                                  )}
                                </div>
                              </Form.Group>
                            </Card.Body>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                </Tab>
              </Tabs>

              <div className="d-flex justify-content-end mt-4">
                <Button
                  variant="primary"
                  onClick={handleUpdateSettings}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <FaSave className="me-2" />
                      Lưu cài đặt
                    </>
                  )}
                </Button>
              </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </ErrorBoundary>
  );
};

export default Settings;
