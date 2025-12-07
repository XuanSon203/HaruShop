import { useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = location.state?.email || '';

  const [email, setEmail] = useState(emailFromState);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
const API_BASE = `http://${window.location.hostname}:8080`;
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${API_BASE}/user/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage('Xác thực OTP thành công. Vui lòng đặt lại mật khẩu.');
        setTimeout(() => {
          navigate('/reset-password', { state: { email, otp } });
        }, 600);
      } else {
        setError(data.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
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
                <h3 className="fw-bold text-primary" style={{ fontSize: "clamp(1.25rem, 4vw, 1.5rem)" }}>Xác thực OTP</h3>
                <p className="text-muted" style={{ fontSize: "clamp(0.875rem, 3vw, 1rem)" }}>Nhập email và mã OTP đã nhận</p>
              </div>

              {message && (
                <Alert variant="success" className="text-center">{message}</Alert>
              )}
              {error && (
                <Alert variant="danger" className="text-center">{error}</Alert>
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

                <Form.Group className="mb-3">
                  <Form.Label>Mã OTP</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nhập mã OTP 6 số"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    disabled={loading}
                  />
                </Form.Group>

                <Button type="submit" variant="primary" className="w-100 mb-3" disabled={loading}>
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Đang xác thực...
                    </>
                  ) : (
                    'Xác thực OTP'
                  )}
                </Button>
              </Form>

              <div className="text-center">
                <Link to="/forgot-password" className="text-decoration-none">
                  ← Quay lại quên mật khẩu
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default VerifyOtp;


