import { useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';

function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = location.state?.email || '';
  const otpFromState = location.state?.otp || '';

  const [email, setEmail] = useState(emailFromState);
  const [otp, setOtp] = useState(otpFromState);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
const API_BASE = `http://${window.location.hostname}:8080`;
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      setLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/user/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage('Đặt lại mật khẩu thành công. Bạn có thể đăng nhập.');
        setTimeout(() => navigate('/login'), 800);
      } else {
        setError(data.message || 'Không thể đặt lại mật khẩu.');
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
                <h3 className="fw-bold text-primary" style={{ fontSize: "clamp(1.25rem, 4vw, 1.5rem)" }}>Đặt lại mật khẩu</h3>
                <p className="text-muted" style={{ fontSize: "clamp(0.875rem, 3vw, 1rem)" }}>Nhập email, OTP và mật khẩu mới</p>
              </div>

              {message && <Alert variant="success" className="text-center">{message}</Alert>}
              {error && <Alert variant="danger" className="text-center">{error}</Alert>}

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

                <Form.Group className="mb-3">
                  <Form.Label>Mật khẩu mới</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Nhập mật khẩu mới"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Xác nhận mật khẩu mới</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </Form.Group>

                <Button type="submit" variant="primary" className="w-100 mb-3" disabled={loading}>
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Đang đặt lại...
                    </>
                  ) : (
                    'Đặt lại mật khẩu'
                  )}
                </Button>
              </Form>

              <div className="text-center">
                <Link to="/login" className="text-decoration-none">← Quay lại đăng nhập</Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default ResetPassword;


