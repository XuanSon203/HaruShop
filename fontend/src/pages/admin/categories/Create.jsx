import { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { useNotification } from "../../../components/nofication/Nofication";
function Create({ show, handleClose, onSuccess, categories }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parentId: "",
    sortOrder: "",
    image: null,
  });
  const { addNotification } = useNotification();
  const [preview, setPreview] = useState(null);

  // Reset form khi modal mở lại
  useEffect(() => {
    if (!show) {
      setFormData({
        name: "",
        description: "",
        parentId: "",
        sortOrder: "",
        image: null,
      });
      setPreview(null);
    }
  }, [show]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image" && files.length > 0) {
      const file = files[0];
      setFormData({ ...formData, image: file });
      setPreview(URL.createObjectURL(file));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      addNotification("Tên danh mục không được để trống", "warning");
      return;
    }

    // Tạo FormData để gửi file và các trường khác
    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("parentId", formData.parentId);
    formDataToSend.append("sortOrder", formData.sortOrder);
    if (formData.image) {
      formDataToSend.append("image", formData.image); // file object
    }

    try {
      const res = await fetch("http://localhost:8080/admin/category/add", {
        method: "POST",
        body: formDataToSend,
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok) {
        addNotification("Tạo danh mục thành công!", "success");
        onSuccess();
        handleClose();
      } else {
        addNotification("Có lỗi xảy ra", "danger");
      }
    } catch (error) {
      console.error("Error:", error);
      addNotification("Không thể kết nối server", "danger");
    }
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Tạo Danh Mục</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Tên danh mục</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nhập tên danh mục"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Mô tả</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Nhập mô tả"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Danh mục cha</Form.Label>
            <Form.Select
              name="parentId"
              value={formData.parentId}
              onChange={handleChange}
            >
              <option value="">-- Không chọn --</option>
              {categories &&
                categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3" hidden>
            <Form.Label>Thứ tự hiển thị</Form.Label>
            <Form.Control
              type="number"
              name="sortOrder"
              value={formData.sortOrder}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Ảnh</Form.Label>
            <Form.Control type="file" name="image" onChange={handleChange} />
          </Form.Group>

          {preview && (
            <div className="mb-3 text-center">
              <img
                src={preview}
                alt="Preview"
                style={{
                  maxWidth: "200px",
                  maxHeight: "150px",
                  objectFit: "cover",
                }}
              />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Đóng
          </Button>
          <Button variant="primary" type="submit">
            Tạo
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default Create;
