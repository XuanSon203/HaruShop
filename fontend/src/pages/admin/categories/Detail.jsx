import { Button, Spinner, Modal, Form } from "react-bootstrap";
import TrackingInfo from "../../../components/tracking/TrackingInfo";

function ViewCategoryModal({ show, onHide, category }) {
  if (!category) return null;
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Chi tiết danh mục</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3 text-center">
          {category.image ? (
            <img
              src={`http://localhost:8080${category.image}`}
              alt={category.name}
              style={{ maxWidth: 240, maxHeight: 180, objectFit: "cover" }}
              onError={(e) => {
                e.currentTarget.src =
                  "https://via.placeholder.com/240x180?text=No+Img";
              }}
            />
          ) : (
            <em>Không có ảnh</em>
          )}
        </div>
        <p><strong>Tên:</strong> {category.name}</p>
        <p><strong>Mô tả:</strong> {category.description || "-"}</p>
        <p><strong>Danh mục cha:</strong> {category.parentName || "Không"}</p>
        <p><strong>Thứ tự:</strong> {category.sortOrder}</p>
        <p><strong>Slug:</strong> {category.slug}</p>
        <p><strong>Trạng thái:</strong> {category.status}</p>
        <p><strong>Tạo lúc:</strong> {new Date(category.createdAt).toLocaleString()}</p>
        <p><strong>Cập nhật lúc:</strong> {new Date(category.updatedAt).toLocaleString()}</p>
        
        {/* Thông tin tracking */}
        <div className="mt-4">
          <TrackingInfo 
            createdBy={category.createdBy}
            updatedBy={category.updatedBy}
            deletedBy={category.deletedBy}
            showDeleted={category.deleted}
          />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Đóng</Button>
      </Modal.Footer>
    </Modal>
  );
}
export default ViewCategoryModal 