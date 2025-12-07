import { useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
const API_BASE = `http://${window.location.hostname}:8080`;
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${API_BASE}/user/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.');
        setTimeout(() => {
          navigate('/verify-otp', { state: { email } });
        }, 600);
      } else {
        setError(data.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } catch (err) {
      setError('Không thể kết nối đến server. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5 px-3" style={{ paddingTop: "100px", paddingBottom: "40px" }}>
      <Row className="justify-content-center">
        <Col xs={12} sm={10} md={6} lg={4}>
          <Card className="shadow">
            <Card.Body className="p-3 p-md-4">
              <div className="text-center mb-4">
                <h3 className="fw-bold text-primary" style={{ fontSize: "clamp(1.25rem, 4vw, 1.5rem)" }}>Quên mật khẩu</h3>
                <p className="text-muted" style={{ fontSize: "clamp(0.875rem, 3vw, 1rem)" }}>Nhập email để nhận mã OTP</p>
              </div>

              {message && (
                <Alert variant="success" className="text-center">
                  {message}
                </Alert>
              )}

              {error && (
                <Alert variant="danger" className="text-center">
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Nhập email của bạn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </Form.Group>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-100 mb-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Đang gửi...
                    </>
                  ) : (
                    'Gửi mã OTP'
                  )}
                </Button>
              </Form>

              <div className="text-center">
                <Link to="/login" className="text-decoration-none">
                  ← Quay lại đăng nhập
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default ForgotPassword;
