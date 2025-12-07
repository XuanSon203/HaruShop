import { Modal, Row, Col, Badge } from "react-bootstrap";
import TrackingInfo from "../../../../components/tracking/TrackingInfo";

function DetailAccessory({ show, handleClose, item }) {
  if (!item) return null;
  const isFeatured = item.featured === true || item.featured === "true" || item.featured === 1 || item.featured === "1";
  const API_BASE = `http://${window.location.hostname}:8080`;
  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Chi tiết phụ kiện</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row className="mb-3">
          <Col md={4}>
            {item.thumbnail && (
              <img
                src={`${API_BASE}/uploads/products/accessory/${item.thumbnail}`}
                alt={item.name}
                style={{ width: "100%", objectFit: "cover", borderRadius: 8 }}
              />
            )}
          </Col>
          <Col md={8}>
            <h4 className="d-flex align-items-center gap-2">
              {item.name} {isFeatured && <Badge bg="warning" text="dark">Nổi bật</Badge>}
            </h4>
            <div className="text-muted">Trạng thái: {item.status}</div>
            <div className="mt-2">Giá: {Number(item.price || 0).toLocaleString()} ₫</div>
            {item.discount && (
              <div className="mt-1">
                Giảm giá: {item.discount.name} ({item.discount.value}{item.discount.type === "percent" ? "%" : "₫"})
              </div>
            )}
            <div className="mt-1">Số lượng: {item.quantity}</div>
            <div className="mt-1">Đã bán: {typeof item.sold_count === "number" ? item.sold_count : 0}</div>
            <div className="mt-2">Chất liệu: {item.material || "-"}</div>
            <div>Kích thước: {item.size || "-"}</div>
            <div>Màu sắc: {item.color || "-"}</div>
            <div>Thương hiệu: {item.brand || "-"}</div>
            <div>Bảo hành: {item.warranty || "-"}</div>
            <div className="mt-2">Mô tả: {item.description || "-"}</div>
          </Col>
        </Row>
        {Array.isArray(item.images) && item.images.length > 0 && (
          <Row className="g-2">
            {item.images.map((img, idx) => (
              <Col key={idx} xs={6} md={3}>
                <img
                  src={`${API_BASE}/uploads/products/accessory/${img}`}
                  alt={`img-${idx}`}
                  style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8 }}
                />
              </Col>
            ))}
          </Row>
        )}
        
        {/* Tracking Information */}
        <TrackingInfo 
          createdBy={item.createdBy}
          updatedBy={item.updatedBy}
          deletedBy={item.deletedBy}
          showDeleted={item.deleted}
          className="mt-3"
        />
      </Modal.Body>
    </Modal>
  );
}

export default DetailAccessory;
