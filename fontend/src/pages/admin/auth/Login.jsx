import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, Button, Card, Alert, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function LoginAdmin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(""), 2500);
      return () => clearTimeout(t);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(""), 1500);
      return () => clearTimeout(t);
    }
  }, [success]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ Email và Mật khẩu.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const url = "http://localhost:8080/admin/auth/login";
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Đăng nhập thất bại");
      }
      
      // Kiểm tra response thành công
      if (data.success) {
        if (remember) {
          const key = "admin_email";
          localStorage.setItem(key, email);
        } else {
          localStorage.removeItem("admin_email");
        }
        setSuccess("Đăng nhập thành công");
        // Chuyển trang bằng reload cứng để chắc chắn trình duyệt áp dụng cookie path /admin
        setTimeout(() => {
          window.location.replace("/admin");
        }, 600);
      } else {
        throw new Error(data.message || "Đăng nhập thất bại");
      }
    } catch (err) {
      setError(err.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage:
          "url('https://images.unsplash.com/photo-1590608897129-79da98d1593c?auto=format&fit=crop&w=1350&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Overlay mờ */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        }}
      />

      <Container style={{ position: "relative", zIndex: 1 }}>
        <Row className="justify-content-center">
          <Col xs={12} sm={8} md={5} lg={4}>
            <Card className="p-4 shadow-lg rounded-4 border-0">
              <h3 className="text-center mb-4" style={{ fontWeight: "bold", color: "#0d6efd" }}>
                Đăng nhập trang quản trị
              </h3>

              {error && (
                <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>
              )}
              {success && (
                <Alert variant="success" dismissible onClose={() => setSuccess("")}>{success}</Alert>
              )}

              <Form onSubmit={handleLogin}>
                <Form.Group className="mb-3" controlId="formEmail">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Nhập email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formPassword">
                  <Form.Label>Mật khẩu</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                  />
                </Form.Group>


                <Form.Group
                  className="mb-3 d-flex justify-content-between align-items-center"
                  controlId="formRemember"
                >
                  <Form.Check
                    type="checkbox"
                    label="Nhớ đăng nhập"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <a href="#" className="text-decoration-none" onClick={(e) => e.preventDefault()}>
                    Quên mật khẩu?
                  </a>
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 d-flex align-items-center justify-content-center"
                  style={{ fontWeight: "bold", padding: "10px" }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" animation="border" className="me-2" /> Đang đăng nhập...
                    </>
                  ) : (
                    "Đăng nhập"
                  )}
                </Button>
              </Form>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default LoginAdmin;
