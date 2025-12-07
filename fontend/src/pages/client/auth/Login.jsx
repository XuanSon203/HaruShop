import { useState } from "react";
import { Button, Col, Container, Form, InputGroup, Row } from "react-bootstrap";
import { FaEye, FaEyeSlash, FaFacebookF, FaGoogle } from "react-icons/fa";
import { Link, NavLink, useNavigate } from "react-router-dom";

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const togglePassword = () => setShowPassword(!showPassword);
  const API_BASE = `http://${window.location.hostname}:8080`;
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/user/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || data?.message || "Đăng nhập thất bại");
        return;
      }
      // Lưu fullName vào cookie để header hiển thị (ưu tiên lấy từ /user để chắc chắn)
      try {
        let fullNameToSet = data?.user?.fullName;
        if (!fullNameToSet) {
          const profileRes = await fetch(`${API_BASE}/user`, {
            credentials: "include",
          });
          if (profileRes.ok) {
            const profile = await profileRes.json();
            fullNameToSet = profile?.fullName || fullNameToSet;
          }
        }
        if (fullNameToSet) {
          document.cookie = `fullName=${encodeURIComponent(
            fullNameToSet
          )}; path=/; max-age=${7 * 24 * 60 * 60}`;
        }
      } catch {}
      navigate("/");
      // Header có thể đã mount sẵn trong layout, reload để đọc lại cookie
      setTimeout(() => window.location.reload(), 0);
    } catch (err) {
      setError("Lỗi kết nối tới server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Fullscreen gradient background */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "linear-gradient(135deg, #f2760a 0%, #0ea5e9 50%, #d946ef 100%)",
          zIndex: -1,
        }}
      />
      <Container
        fluid
        className="d-flex justify-content-center align-items-center min-vh-100 px-3"
        style={{
          position: "relative",
          paddingTop: "80px",
          paddingBottom: "20px",
          background: "transparent",
        }}
      >
        {/* Background decoration */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.3,
          }}
        />

        <div
          className="p-4 p-md-5 shadow-lg rounded-4 bg-white animate-slide-up w-100"
          style={{
            maxWidth: "500px",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          }}
        >
          <div className="text-center mb-4">
            <div
              className="d-none d-md-flex"
              style={{
                width: "80px",
                height: "80px",
                background: "linear-gradient(135deg, #f2760a 0%, #0ea5e9 100%)",
                borderRadius: "50%",
                margin: "0 auto 1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2rem",
                color: "white",
                boxShadow: "0 10px 25px -5px rgba(242, 118, 10, 0.4)",
              }}
            ></div>
            <h3 className="fw-bold mb-2" style={{ color: "#1f2937", fontSize: "clamp(1.25rem, 4vw, 1.75rem)" }}>
              Đăng Nhập
            </h3>
            <p className="text-muted mb-0" style={{ fontSize: "clamp(0.875rem, 3vw, 1rem)" }}>
              Chào mừng bạn trở lại! Vui lòng nhập thông tin của bạn.
            </p>
          </div>

          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3 mb-md-4">
              <Form.Label className="fw-semibold" style={{ color: "#374151", fontSize: "clamp(0.875rem, 3vw, 1rem)" }}>
                Email
              </Form.Label>
              <Form.Control
                type="email"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  border: "2px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "0.75rem 1rem",
                  fontSize: "clamp(0.875rem, 3vw, 1rem)",
                  transition: "all 0.3s ease",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#f2760a";
                  e.target.style.boxShadow =
                    "0 0 0 3px rgba(242, 118, 10, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e5e7eb";
                  e.target.style.boxShadow = "none";
                }}
              />
            </Form.Group>

            <Form.Group className="mb-3 mb-md-4">
              <Form.Label className="fw-semibold" style={{ color: "#374151", fontSize: "clamp(0.875rem, 3vw, 1rem)" }}>
                Mật khẩu
              </Form.Label>
              <InputGroup>
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    border: "2px solid #e5e7eb",
                    borderRadius: "12px 0 0 12px",
                    padding: "0.75rem 1rem",
                    fontSize: "clamp(0.875rem, 3vw, 1rem)",
                    transition: "all 0.3s ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#f2760a";
                    e.target.style.boxShadow =
                      "0 0 0 3px rgba(242, 118, 10, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <InputGroup.Text
                  onClick={togglePassword}
                  style={{
                    cursor: "pointer",
                    border: "2px solid #e5e7eb",
                    borderLeft: "none",
                    borderRadius: "0 12px 12px 0",
                    backgroundColor: "#f9fafb",
                    color: "#6b7280",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#f2760a";
                    e.target.style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#f9fafb";
                    e.target.style.color = "#6b7280";
                  }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </InputGroup.Text>
              </InputGroup>
            </Form.Group>

            {error && (
              <div
                className="mb-3 p-3 rounded-3"
                style={{
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#dc2626",
                }}
              >
                <small className="fw-medium">{error}</small>
              </div>
            )}

            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3 mb-md-4 gap-2">
              <Form.Check
                label="Ghi nhớ đăng nhập"
                style={{ color: "#6b7280", fontSize: "clamp(0.875rem, 3vw, 1rem)" }}
              />
              <Link
                to={"/forgot-password"}
                className="text-decoration-none fw-medium"
                style={{
                  color: "#f2760a",
                  transition: "color 0.3s ease",
                  fontSize: "clamp(0.875rem, 3vw, 1rem)",
                }}
                onMouseEnter={(e) => (e.target.style.color = "#e35d05")}
                onMouseLeave={(e) => (e.target.style.color = "#f2760a")}
              >
                Quên mật khẩu?
              </Link>
            </div>

            <Button
              className="w-100 mb-3 mb-md-4 fw-bold"
              type="submit"
              disabled={loading}
              style={{
                background: loading
                  ? "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)"
                  : "linear-gradient(135deg, #f2760a 0%, #e35d05 100%)",
                border: "none",
                borderRadius: "12px",
                fontSize: "clamp(0.95rem, 3vw, 1.1rem)",
                padding: "0.75rem 1rem",
                boxShadow: "0 4px 14px 0 rgba(242, 118, 10, 0.4)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow =
                    "0 6px 20px 0 rgba(242, 118, 10, 0.5)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow =
                    "0 4px 14px 0 rgba(242, 118, 10, 0.4)";
                }
              }}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Đang xử lý...
                </>
              ) : (
                "Đăng Nhập"
              )}
            </Button>
          </Form>

          <hr style={{ borderColor: "#e5e7eb", margin: "1.5rem 0" }} />

          <div className="text-center mb-3">
            <span style={{ color: "#6b7280", fontSize: "clamp(0.875rem, 3vw, 1rem)" }}>Chưa có tài khoản? </span>
            <NavLink
              to="/register"
              className="fw-bold text-decoration-none"
              style={{
                color: "#f2760a",
                transition: "color 0.3s ease",
                fontSize: "clamp(0.875rem, 3vw, 1rem)",
              }}
              onMouseEnter={(e) => (e.target.style.color = "#e35d05")}
              onMouseLeave={(e) => (e.target.style.color = "#f2760a")}
            >
              Đăng ký ngay
            </NavLink>
          </div>
        </div>
      </Container>
    </>
  );
}

export default Login;
