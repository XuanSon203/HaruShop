import React from 'react';
import { Card, Badge, Row, Col } from 'react-bootstrap';
import { FaUser, FaEdit, FaTrash, FaClock } from 'react-icons/fa';
import './TrackingInfo.css';

const TrackingInfo = ({ 
  createdBy, 
  updatedBy = [], 
  deletedBy, 
  showDeleted = false,
  className = "" 
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserDisplayName = (user) => {
    if (!user) return 'Không xác định';
    return user.fullName || user.userName || user.email || 'Không xác định';
  };

  return (
    <Card className={`tracking-info ${className}`} style={{ fontSize: '0.9rem' }}>
      <Card.Header className="bg-light">
        <h6 className="mb-0">
          <FaClock className="me-2" />
          Thông tin theo dõi
        </h6>
      </Card.Header>
      <Card.Body className="p-3">
        <Row>
          {/* Người tạo */}
          <Col md={4} className="mb-3">
            <div className="d-flex align-items-center mb-2">
              <FaUser className="text-success me-2" />
              <strong>Người tạo:</strong>
            </div>
            <div className="ms-4">
              <div className="text-muted small">
                {getUserDisplayName(createdBy?.user)}
              </div>
              <div className="text-muted small">
                {formatDate(createdBy?.createdAt)}
              </div>
            </div>
          </Col>

          {/* Người cập nhật cuối */}
          <Col md={4} className="mb-3">
            <div className="d-flex align-items-center mb-2">
              <FaEdit className="text-warning me-2" />
              <strong>Cập nhật cuối:</strong>
            </div>
            <div className="ms-4">
              {updatedBy && updatedBy.length > 0 ? (
                <>
                  <div className="text-muted small">
                    {getUserDisplayName(updatedBy[updatedBy.length - 1]?.user)}
                  </div>
                  <div className="text-muted small">
                    {formatDate(updatedBy[updatedBy.length - 1]?.updatedAt)}
                  </div>
                  {updatedBy.length > 1 && (
                    <Badge bg="info" className="mt-1">
                      {updatedBy.length} lần cập nhật
                    </Badge>
                  )}
                </>
              ) : (
                <div className="text-muted small">Chưa có cập nhật</div>
              )}
            </div>
          </Col>

          {/* Người xóa (nếu có) */}
          {showDeleted && deletedBy && (
            <Col md={4} className="mb-3">
              <div className="d-flex align-items-center mb-2">
                <FaTrash className="text-danger me-2" />
                <strong>Người xóa:</strong>
              </div>
              <div className="ms-4">
                <div className="text-muted small">
                  {getUserDisplayName(deletedBy?.user)}
                </div>
                <div className="text-muted small">
                  {formatDate(deletedBy?.deletedAt)}
                </div>
              </div>
            </Col>
          )}
        </Row>

        {/* Lịch sử cập nhật chi tiết */}
        {updatedBy && updatedBy.length > 1 && (
          <div className="mt-3">
            <details>
              <summary className="text-primary cursor-pointer">
                Xem lịch sử cập nhật ({updatedBy.length} lần)
              </summary>
              <div className="mt-2">
                {updatedBy.map((update, index) => (
                  <div key={index} className="border-start border-2 border-light ps-3 mb-2">
                    <div className="d-flex justify-content-between">
                      <span className="small">
                        {getUserDisplayName(update?.user)}
                      </span>
                      <span className="text-muted small">
                        {formatDate(update?.updatedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default TrackingInfo;
