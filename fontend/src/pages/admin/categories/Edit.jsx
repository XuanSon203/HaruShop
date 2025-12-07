import { Button, Spinner, Modal, Form } from "react-bootstrap";
import React, { useEffect, useState } from "react";
function EditCategoryModal({ show, onHide, category, categories, onUpdated }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    parentId: "",
    sortOrder: 0,
    image: null, // file mới (nếu chọn)
  });
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (category) {
      setForm({
        name: category.name || "",
        description: category.description || "",
        parentId: category.parentId || "",
        sortOrder: category.sortOrder || 0,
        image: null,
      });
      setPreview(category.image ? `http://localhost:8080${category.image}` : null);
    }
  }, [category, show]);

  const onChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image" && files?.length) {
      const file = files[0];
      setForm((p) => ({ ...p, image: file }));
      setPreview(URL.createObjectURL(file));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!category?._id) return;

    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("description", form.description);
    fd.append("parentId", form.parentId);
    fd.append("sortOrder", form.sortOrder);
    if (form.image) fd.append("image", form.image); 

    try {
      const res = await fetch(
        `http://localhost:8080/admin/category/update/${category._id}`,
        { method: "PUT", body: fd, credentials: "include"}
      );
      const data = await res.json();
      if (res.ok) {
        onUpdated?.(data);
      } else {
        alert(data.message || "Cập nhật thất bại");
      }
    } catch (err) {
      console.error(err);
      alert("Không thể kết nối server");
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={onSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Sửa danh mục</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Tên</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={form.name}
              onChange={onChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Mô tả</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={form.description}
              onChange={onChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Danh mục cha</Form.Label>
            <Form.Select
              name="parentId"
              value={form.parentId || ""}
              onChange={onChange}
            >
              <option value="">-- Không chọn --</option>
              {categories
                .filter((c) => c._id !== category?._id) // tránh chọn chính nó
                .map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Thứ tự</Form.Label>
            <Form.Control
              type="number"
              name="sortOrder"
              value={form.sortOrder}
              onChange={onChange}
            />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Ảnh (chọn để thay ảnh)</Form.Label>
            <Form.Control type="file" name="image" onChange={onChange} />
          </Form.Group>

          {preview && (
            <div className="text-center">
              <img
                src={preview}
                alt="preview"
                style={{ maxWidth: 240, maxHeight: 180, objectFit: "cover" }}
                onError={(e) => {
                  e.currentTarget.src =
                    "https://via.placeholder.com/240x180?text=No+Img";
                }}
              />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Hủy
          </Button>
          <Button variant="primary" type="submit">
            Lưu
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
export default EditCategoryModal