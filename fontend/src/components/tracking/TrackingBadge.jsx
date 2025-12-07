import React from 'react';
import { Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaUser, FaEdit, FaTrash } from 'react-icons/fa';
import './TrackingInfo.css';

const TrackingBadge = ({ 
  createdBy, 
  updatedBy = [], 
  deletedBy, 
  showDeleted = false,
  size = "sm" 
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN') + ' ' + 
           date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const getUserDisplayName = (user) => {
    if (!user) return 'Không xác định';
    return user.fullName || user.userName || user.email || 'Không xác định';
  };

  const getLastUpdate = () => {
    if (!updatedBy || updatedBy.length === 0) return null;
    return updatedBy[updatedBy.length - 1];
  };

  const lastUpdate = getLastUpdate();

  return (
    <div className="tracking-badge">
      {/* Người tạo */}
      <OverlayTrigger
        placement="top"
        overlay={
          <Tooltip>
            <div>
              <strong>Tạo bởi:</strong> {getUserDisplayName(createdBy?.user)}<br/>
              <strong>Ngày:</strong> {formatDate(createdBy?.createdAt)}
            </div>
          </Tooltip>
        }
      >
        <Badge bg="success" className="d-flex align-items-center">
          <FaUser className="me-1" />
          {createdBy?.user?.fullName?.charAt(0) || '?'}
        </Badge>
      </OverlayTrigger>

      {/* Người cập nhật cuối */}
      {lastUpdate && (
        <OverlayTrigger
          placement="top"
          overlay={
            <Tooltip>
              <div>
                <strong>Cập nhật bởi:</strong> {getUserDisplayName(lastUpdate?.user)}<br/>
                <strong>Ngày:</strong> {formatDate(lastUpdate?.updatedAt)}
                {updatedBy.length > 1 && (
                  <>
                    <br/>
                    <strong>Số lần cập nhật:</strong> {updatedBy.length}
                  </>
                )}
              </div>
            </Tooltip>
          }
        >
          <Badge bg="warning" className="d-flex align-items-center">
            <FaEdit className="me-1" />
            {lastUpdate?.user?.fullName?.charAt(0) || '?'}
            {updatedBy.length > 1 && ` (${updatedBy.length})`}
          </Badge>
        </OverlayTrigger>
      )}

      {/* Người xóa (nếu có) */}
      {showDeleted && deletedBy && (
        <OverlayTrigger
          placement="top"
          overlay={
            <Tooltip>
              <div>
                <strong>Xóa bởi:</strong> {getUserDisplayName(deletedBy?.user)}<br/>
                <strong>Ngày:</strong> {formatDate(deletedBy?.deletedAt)}
              </div>
            </Tooltip>
          }
        >
          <Badge bg="danger" className="d-flex align-items-center">
            <FaTrash className="me-1" />
            {deletedBy?.user?.fullName?.charAt(0) || '?'}
          </Badge>
        </OverlayTrigger>
      )}
    </div>
  );
};

export default TrackingBadge;
