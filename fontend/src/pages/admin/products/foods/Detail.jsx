import React, { useState, useEffect } from "react";
import { Modal, Button, Table, Badge } from "react-bootstrap";
import TrackingInfo from "../../../../components/tracking/TrackingInfo";

function DetailFood({ show, handleClose, food }) {
  const [categories, setCategories] = useState([]);
const API_BASE = `http://${window.location.hostname}:8080`;
  useEffect(() => {
    // chỉ fetch categories khi modal mở
    if (show) {
      fetch(`${API_BASE}/admin/category`)
        .then((res) => res.json())
        .then((data) => setCategories(data.categories || []))
        .catch((err) => console.error("Lỗi fetch category:", err));
    }
  }, [show]);

  if (!food) return null;

  // Tìm tên danh mục dựa vào id
  const getCategoryName = (id) => {
    const category = categories.find((c) => c._id === id);
    return category ? category.name : "-";
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Chi tiết món ăn</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Table striped bordered>
          <tbody>
            <tr>
              <td>Ảnh</td>
              <td>
                {food.thumbnail ? (
                  <img
                    src={`${API_BASE}/uploads/products/foods/${food.thumbnail}`}
                    alt={food.name}
                    style={{
                      width: "120px",
                      height: "120px",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  "Không có ảnh"
                )}
              </td>
            </tr>
            <tr>
              <td>Ảnh phụ</td>
              <td>
                {Array.isArray(food.images) && food.images.length > 0 ? (
                  <div className="d-flex flex-wrap gap-2">
                    {food.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={`${API_BASE}/uploads/products/foods/${img}`}
                        alt={`sub-${idx}`}
                        style={{ width: "80px", height: "80px", objectFit: "cover" }}
                      />
                    ))}
                  </div>
                ) : (
                  <span>Không có ảnh phụ</span>
                )}
              </td>
            </tr>
            <tr>
              <td>Tên món ăn</td>
              <td>
                {food.name}
                {food.is_featured && (
                  <Badge bg="warning" text="dark" className="ms-2">
                    Nổi bật
                  </Badge>
                )}
              </td>
            </tr>
            <tr>
              <td>Danh mục</td>
              <td>{getCategoryName(food.category_id)}</td>
            </tr>
            <tr>
              <td>Mô tả</td>
              <td>{food.description || "-"}</td>
            </tr>
            <tr>
              <td>Giá</td>
              <td>{food.price?.toLocaleString()} VNĐ</td>
            </tr>
            <tr>
              <td>Số lượng</td>
              <td>{food.quantity}</td>
            </tr>
            <tr>
              <td>Đã bán</td>
              <td>{typeof food.sold_count === "number" ? food.sold_count : 0}</td>
            </tr>
            <tr>
              <td>Trọng lượng</td>
              <td>{food.weight ? `${food.weight} ${food.unit || ""}` : "-"}</td>
            </tr>
            <tr>
              <td>Đơn vị</td>
              <td>{food.unit}</td>
            </tr>
            <tr>
              <td>Thành phần</td>
              <td>{food.ingredients || "-"}</td>
            </tr>
            <tr>
              <td>Ngày sản xuất</td>
              <td>
                {food.manufacture_date
                  ? new Date(food.manufacture_date).toLocaleDateString()
                  : "-"}
              </td>
            </tr>
            <tr>
              <td>Hạn sử dụng</td>
              <td>
                {food.expiry_date
                  ? new Date(food.expiry_date).toLocaleDateString()
                  : "-"}
              </td>
            </tr>
            <tr>
              <td>Trạng thái</td>
              <td>
                <Badge bg={food.status === "active" ? "success" : "secondary"}>
                  {food.status === "active" ? "Hoạt động" : "Ngưng hoạt động"}
                </Badge>
              </td>
            </tr>
            <tr>
              <td>Nổi bật</td>
              <td>{food.is_featured ? "Có" : "Không"}</td>
            </tr>
          </tbody>
        </Table>

        {/* Thông tin tracking */}
        <div className="mt-4">
          <TrackingInfo 
            createdBy={food.createdBy}
            updatedBy={food.updatedBy}
            deletedBy={food.deletedBy}
            showDeleted={food.deleted}
          />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Đóng
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default DetailFood;
