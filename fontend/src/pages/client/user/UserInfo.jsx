import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  Image,
  Row,
  Spinner,
  Tab,
  Tabs
} from "react-bootstrap";
import { BsFillPersonLinesFill, BsRecordBtn, BsShieldLock } from "react-icons/bs";
import { useNotification } from "../../../components/nofication/Nofication";

function UserInfo() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
const API_BASE = `http://${window.location.hostname}:8080`;
  // Form states
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    phone: "",
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef(null);
  const { addNotification } = useNotification();

  // Load user info
  const loadUserInfo = async () => {
    try {
      setLoading(true);
      setError("");
      
      const res = await fetch(`${API_BASE}/user`, {
        method: "GET",
        credentials: "include",
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setUser(data);
        setProfileForm({
          fullName: data.fullName || "",
          email: data.email || "",
          phone: data.phone || "",
        });
        setAvatarPreview(data.avatar || "");
      } else {
        throw new Error(data.message || "Không thể tải thông tin user");
      }
    } catch (err) {
      console.error("Load user info error:", err);
      setError(err.message || "Lỗi khi tải thông tin user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserInfo();
  }, []);

  // Handle avatar upload
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        addNotification("Vui lòng chọn file hình ảnh", "danger");
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        addNotification("Kích thước file không được vượt quá 5MB", "danger");
        return;
      }
      
      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload avatar
  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      addNotification("Vui lòng chọn hình ảnh", "danger");
      return;
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      
      const res = await fetch(`${API_BASE}/user/avatar`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setUser(prev => ({ ...prev, avatar: data.avatar }));
        setAvatarFile(null);
        addNotification("Cập nhật avatar thành công!", "success");
      } else {
        throw new Error(data.message || "Không thể cập nhật avatar");
      }
    } catch (err) {
      console.error("Avatar upload error:", err);
      addNotification(err.message || "Lỗi khi cập nhật avatar", "danger");
    } finally {
      setUploading(false);
    }
  };

  // Update profile
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError("");
      
      const res = await fetch(`${API_BASE}/user/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(profileForm),
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setUser(prev => ({ ...prev, ...profileForm }));
        addNotification("Cập nhật thông tin thành công!", "success");
      } else {
        throw new Error(data.message || "Không thể cập nhật thông tin");
      }
    } catch (err) {
      console.error("Profile update error:", err);
      addNotification(err.message || "Lỗi khi cập nhật thông tin", "danger");
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addNotification("Mật khẩu mới và xác nhận mật khẩu không khớp", "danger");
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      addNotification("Mật khẩu mới phải có ít nhất 6 ký tự", "danger");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      
      const res = await fetch(`${API_BASE}/user/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        addNotification("Đổi mật khẩu thành công!", "success");
      } else {
        throw new Error(data.message || "Không thể đổi mật khẩu");
      }
    } catch (err) {
      console.error("Password change error:", err);
      addNotification(err.message || "Lỗi khi đổi mật khẩu", "danger");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Đang tải thông tin...</p>
      </Container>
    );
  }

  if (error && !user) {
    return (
      <Container className="my-5">
        <Alert variant="danger">
          <Alert.Heading>Lỗi!</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={loadUserInfo}>
            Thử lại
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      {/* Header */}
      <div className="text-center mb-5">
        <h2 
          className="mb-3"
          style={{
            background: 'linear-gradient(135deg, #f2760a 0%, #0ea5e9 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 'bold',
            fontSize: '2.5rem'
          }}
        >
          Thông tin tài khoản
        </h2>
        <p className="text-muted">Quản lý thông tin cá nhân và bảo mật tài khoản</p>
      </div>

      <Row>
        <Col lg={4} className="mb-4">
          {/* Avatar Card */}
          <Card 
            className="h-100"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
            }}
          >
            <Card.Body className="text-center">
              <div className="position-relative d-inline-block mb-3">
                <Image
                  src={`${API_BASE}/uploads/avatars/${user.avatar}`}
               roundedCircle
                  style={{
                    width: '120px',
                    height: '120px',
                    objectFit: 'cover',
                    border: '4px solid #e2e8f0',
                    cursor: 'pointer'
                  }}
                  onClick={() => fileInputRef.current?.click()}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '0',
                    right: '0',
                    background: '#0ea5e9',
                    color: 'white',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <BsRecordBtn />
                </div>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
              
              <h5 className="mb-1">{user?.fullName}</h5>
              <p className="text-muted mb-3">{user?.email}</p>
              
              {avatarFile && (
                <div className="mb-3">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAvatarUpload}
                    disabled={uploading}
                    style={{
                      background: 'linear-gradient(135deg, #f2760a 0%, #0ea5e9 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px'
                    }}
                  >
                    {uploading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Đang tải...
                      </>
                    ) : (
                      'Cập nhật ảnh'
                    )}
                  </Button>
                </div>
              )}
              
              <div className="text-muted small">
                <p className="mb-1"> Tham gia: {new Date(user?.createdAt).toLocaleDateString('vi-VN')}</p>
                <p className="mb-0"> Trạng thái: <span className="text-success">Hoạt động</span></p>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          {/* Tabs */}
          <Card
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
            }}
          >
            <Card.Body>
              <Tabs
                activeKey={activeTab}
                onSelect={setActiveTab}
                className="mb-4"
                style={{
                  borderBottom: '2px solid #e2e8f0'
                }}
              >
                <Tab
                  eventKey="profile"
                  title={
                    <span style={{ color: activeTab === 'profile' ? '#0ea5e9' : '#6b7280' }}>
                     <BsFillPersonLinesFill /> Thông tin cá nhân
                    </span>
                  }
                >
                  <Form onSubmit={handleProfileUpdate}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label style={{ fontWeight: '600', color: '#374151' }}>
                            Họ và tên
                          </Form.Label>
                          <Form.Control
                            type="text"
                            value={profileForm.fullName}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, fullName: e.target.value }))}
                            placeholder="Nhập họ và tên"
                            style={{
                              border: '2px solid #e5e7eb',
                              borderRadius: '8px',
                              padding: '12px',
                              transition: 'all 0.3s ease'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                          />
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label style={{ fontWeight: '600', color: '#374151' }}>
                            Email
                          </Form.Label>
                          <Form.Control
                            type="email"
                            value={profileForm.email}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="Nhập email"
                            style={{
                              border: '2px solid #e5e7eb',
                              borderRadius: '8px',
                              padding: '12px',
                              transition: 'all 0.3s ease'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-4">
                          <Form.Label style={{ fontWeight: '600', color: '#374151' }}>
                            Số điện thoại
                          </Form.Label>
                          <Form.Control
                            type="tel"
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="Nhập số điện thoại"
                            style={{
                              border: '2px solid #e5e7eb',
                              borderRadius: '8px',
                              padding: '12px',
                              transition: 'all 0.3s ease'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={loading}
                      style={{
                        background: 'linear-gradient(135deg, #f2760a 0%, #0ea5e9 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px 24px',
                        fontWeight: '600',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                      {loading ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Đang cập nhật...
                        </>
                      ) : (
                        ' Cập nhật thông tin'
                      )}
                    </Button>
                  </Form>
                </Tab>

                <Tab
                  eventKey="password"
                  title={
                    <span style={{ color: activeTab === 'password' ? '#0ea5e9' : '#6b7280' }}>
                      <BsShieldLock /> Đổi mật khẩu
                    </span>
                  }
                >
                  <Form onSubmit={handlePasswordChange}>
                    <Form.Group className="mb-3">
                      <Form.Label style={{ fontWeight: '600', color: '#374151' }}>
                        Mật khẩu hiện tại
                      </Form.Label>
                      <Form.Control
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder="Nhập mật khẩu hiện tại"
                        style={{
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '12px',
                          transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label style={{ fontWeight: '600', color: '#374151' }}>
                        Mật khẩu mới
                      </Form.Label>
                      <Form.Control
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Nhập mật khẩu mới"
                        style={{
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '12px',
                          transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-4">
                      <Form.Label style={{ fontWeight: '600', color: '#374151' }}>
                        Xác nhận mật khẩu mới
                      </Form.Label>
                      <Form.Control
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Nhập lại mật khẩu mới"
                        style={{
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '12px',
                          transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </Form.Group>
                    
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={loading}
                      style={{
                        background: 'linear-gradient(135deg, #f2760a 0%, #0ea5e9 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px 24px',
                        fontWeight: '600',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                      {loading ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Đang đổi...
                        </>
                      ) : (
                        '🔒 Đổi mật khẩu'
                      )}
                    </Button>
                  </Form>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default UserInfo;
