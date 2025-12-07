import React, { useState } from "react";
import { Container, Form, Button, Row, Col, InputGroup } from "react-bootstrap";
import { FaEye, FaEyeSlash, FaGoogle, FaFacebookF } from "react-icons/fa";
import { NavLink, useNavigate } from "react-router-dom";

function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setError] = useState({});
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    agree: false,
  });
const API_BASE = `http://${window.location.hostname}:8080`;
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let newErrors = {};

    // Validate full name
    if (!form.fullName.trim()) {
      newErrors.fullName = "Họ và tên không được để trống";
    } else if (form.fullName.trim().length < 3) {
      newErrors.fullName = "Họ và tên phải có ít nhất 3 ký tự";
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim()) {
      newErrors.email = "Email không được để trống";
    } else if (!emailRegex.test(form.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    // Validate phone
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!form.phone.trim()) {
      newErrors.phone = "Số điện thoại không được để trống";
    } else if (!phoneRegex.test(form.phone)) {
      newErrors.phone = "Số điện thoại phải là 10 hoặc 11 số";
    }

    // Validate password
    if (!form.password.trim()) {
      newErrors.password = "Mật khẩu không được để trống";
    } else if (form.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    // Validate agree
    if (!form.agree) {
      newErrors.agree = "Bạn cần đồng ý với điều khoản";
    }

    // Nếu có lỗi thì không gửi request
    if (Object.keys(newErrors).length > 0) {
      setError(newErrors);
      return;
    }

    // Clear lỗi
    setError({});

    // Gửi form lên server
    try {
      const res = await fetch(`${API_BASE}/user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      // Nếu đăng ký thành công thì reset form
      if (res.ok) {
        alert(data.message);
        setForm({
          fullName: "",
          email: "",
          phone: "",
          password: "",
          agree: false,
          
        });
        navigate("/login")
      } else {
      setError((prev) => ({ ...prev, ...data.error }));

      }
    } catch (error) {
      console.error("Lỗi khi gửi form:", error);
    }
  };

  return (
    <>
      {/* Fullscreen gradient background */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #f2760a 0%, #0ea5e9 50%, #d946ef 100%)',
          zIndex: -1
        }}
      />
      <Container 
        fluid
        className="d-flex justify-content-center align-items-center min-vh-100 px-3"
        style={{
          position: 'relative',
          zIndex: 1,
          paddingTop: "80px",
          paddingBottom: "20px",
          background: 'transparent'
        }}
      >
      {/* Background decoration */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.3
        }}
      />

      <div
        className="p-3 p-md-4 shadow-lg rounded-4 bg-white w-100"
        style={{ 
          maxWidth: "420px",
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        <div className="text-center mb-3">
          <h3 className="fw-bold mb-1" style={{ color: '#1f2937', fontSize: 'clamp(1.2rem, 4vw, 1.4rem)' }}>Đăng Ký</h3>
          <p className="text-muted mb-0" style={{ fontSize: 'clamp(0.875rem, 3vw, 0.95rem)' }}>
            Tạo tài khoản tại đây 
          </p>
        </div>

        <Form onSubmit={handleSubmit}>
          {/* Error summary */}
          {Object.keys(errors).length > 0 && (
            <div 
              className="mb-2 p-2 rounded-3"
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626'
              }}
            >
              <small className="fw-medium">Vui lòng kiểm tra lại các trường được đánh dấu.</small>
            </div>
          )}

          {/* Full name */}
          <Form.Group className="mb-2">
            <Form.Label className="fw-semibold" style={{ color: '#374151', fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>Họ và tên *</Form.Label>
            <Form.Control
              type="text"
              name="fullName"
              placeholder="Nhập họ và tên đầy đủ"
              value={form.fullName}
              onChange={handleChange}
              style={{
                border: `2px solid ${errors.fullName ? '#dc2626' : '#e5e7eb'}`,
                borderRadius: '10px',
                padding: '0.65rem 0.85rem',
                fontSize: 'clamp(0.875rem, 3vw, 0.95rem)',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#f2760a';
                e.target.style.boxShadow = '0 0 0 3px rgba(242, 118, 10, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
            {errors.fullName && (
              <div className="mt-1"><small className="text-danger">{errors.fullName}</small></div>
            )}
          </Form.Group>

          {/* Email */}
          <Form.Group className="mb-2">
            <Form.Label className="fw-semibold" style={{ color: '#374151', fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>Email *</Form.Label>
            <Form.Control
              type="email"
              name="email"
              placeholder="Nhập địa chỉ email"
              value={form.email}
              onChange={handleChange}
              style={{
                border: `2px solid ${errors.email ? '#dc2626' : '#e5e7eb'}`,
                borderRadius: '10px',
                padding: '0.65rem 0.85rem',
                fontSize: 'clamp(0.875rem, 3vw, 0.95rem)',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#f2760a';
                e.target.style.boxShadow = '0 0 0 3px rgba(242, 118, 10, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
            {errors.email && (
              <div className="mt-1"><small className="text-danger">{errors.email}</small></div>
            )}
          </Form.Group>

          {/* Phone */}
          <Form.Group className="mb-2">
            <Form.Label className="fw-semibold" style={{ color: '#374151', fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>Số điện thoại *</Form.Label>
            <Form.Control
              type="tel"
              name="phone"
              placeholder="Nhập số điện thoại"
              value={form.phone}
              onChange={handleChange}
              style={{
                border: `2px solid ${errors.phone ? '#dc2626' : '#e5e7eb'}`,
                borderRadius: '10px',
                padding: '0.65rem 0.85rem',
                fontSize: 'clamp(0.875rem, 3vw, 0.95rem)',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#f2760a';
                e.target.style.boxShadow = '0 0 0 3px rgba(242, 118, 10, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
            <div className="mt-1"><small className="text-muted">Số điện thoại gồm 10-11 chữ số.</small></div>
            {errors.phone && (
              <div className="mt-1"><small className="text-danger">{errors.phone}</small></div>
            )}
          </Form.Group>

          {/* Password */}
          <Form.Group className="mb-2">
            <Form.Label className="fw-semibold" style={{ color: '#374151', fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>Mật khẩu *</Form.Label>
            <InputGroup>
              <Form.Control
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                value={form.password}
                onChange={handleChange}
                style={{
                  border: `2px solid ${errors.password ? '#dc2626' : '#e5e7eb'}`,
                  borderRadius: '10px 0 0 10px',
                  padding: '0.65rem 0.85rem',
                  fontSize: 'clamp(0.875rem, 3vw, 0.95rem)',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#f2760a';
                  e.target.style.boxShadow = '0 0 0 3px rgba(242, 118, 10, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <InputGroup.Text
                onClick={() => setShowPassword(!showPassword)}
                style={{ 
                  cursor: "pointer",
                  border: '2px solid #e5e7eb',
                  borderLeft: 'none',
                  borderRadius: '0 10px 10px 0',
                  backgroundColor: '#f9fafb',
                  color: '#6b7280',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f2760a';
                  e.target.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#f9fafb';
                  e.target.style.color = '#6b7280';
                }}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </InputGroup.Text>
            </InputGroup>
            {errors.password && (
              <div className="mt-1"><small className="text-danger">{errors.password}</small></div>
            )}
          </Form.Group>

          {/* Agree */}
          <Form.Group className="d-flex align-items-start mb-2">
            <Form.Check
              type="checkbox"
              name="agree"
              checked={form.agree}
              onChange={handleChange}
              className="me-2"
              style={{ marginTop: '0.25rem' }}
            />
            <div>
              <span style={{ color: '#6b7280' }}>
                Tôi đồng ý với {" "}
                <a href="#" className="text-decoration-none" style={{ color: '#f2760a' }}>Điều khoản dịch vụ</a>
                {" "}và{" "}
                <a href="#" className="text-decoration-none" style={{ color: '#f2760a' }}>Chính sách bảo mật</a>
                {" "}của HaruShop
              </span>
              {errors.agree && (
                <div className="mt-1"><small className="text-danger">{errors.agree}</small></div>
              )}
            </div>
          </Form.Group>

          <Button
            type="submit"
            className="w-100 mb-3 fw-bold"
            style={{
              background: 'linear-gradient(135deg, #f2760a 0%, #e35d05 100%)',
              border: 'none',
              borderRadius: '10px',
              fontSize: 'clamp(0.95rem, 3vw, 1rem)',
              padding: '0.75rem 1rem',
              boxShadow: '0 4px 14px 0 rgba(242, 118, 10, 0.4)',
              transition: 'all 0.3s ease'
            }}
            disabled={!form.agree}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px 0 rgba(242, 118, 10, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 14px 0 rgba(242, 118, 10, 0.4)';
            }}
          >
            Tạo Tài Khoản
          </Button>
        </Form>

        <hr style={{ borderColor: '#e5e7eb', margin: '1rem 0' }} />

        <div className="text-center mb-3">
          <span style={{ color: '#6b7280', fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>Đã có tài khoản? </span>
          <NavLink to="/login" className="fw-bold text-decoration-none" style={{ color: '#f2760a', fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>
            Đăng nhập ngay
          </NavLink>
        </div>
      </div>
      </Container>
    </>
  );
}

export default Register;
