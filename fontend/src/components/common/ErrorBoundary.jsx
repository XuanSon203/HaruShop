import React from 'react';
import { Alert, Button } from 'react-bootstrap';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Cập nhật state để hiển thị UI lỗi
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log lỗi
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // UI lỗi tùy chỉnh
      return (
        <div className="p-4">
          <Alert variant="danger">
            <Alert.Heading>Đã xảy ra lỗi!</Alert.Heading>
            <p>
              Có vẻ như đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.
            </p>
            <hr />
            <div className="d-flex justify-content-end">
              <Button 
                variant="outline-danger" 
                onClick={() => window.location.reload()}
              >
                Tải lại trang
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
                <summary>Chi tiết lỗi (chế độ phát triển)</summary>
                <p><strong>Error:</strong> {this.state.error?.toString() || 'Không xác định'}</p>
                <p><strong>Error Info:</strong> {this.state.errorInfo?.componentStack || 'Không có thông tin chi tiết.'}</p>
              </details>
            )}
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
