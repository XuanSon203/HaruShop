import React, { useState } from "react";
import { Modal, Button, Form, Spinner } from "react-bootstrap";

function CreateDiscount({ show, handleClose }) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    type: "",
    value: "",
  });

  const [timeSlots, setTimeSlots] = useState([{ date: "", startTime: "", endTime: "" }]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTimeSlotChange = (index, field, value) => {
    const updatedSlots = [...timeSlots];
    updatedSlots[index][field] = value;
    setTimeSlots(updatedSlots);
  };

  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, { date: "", startTime: "", endTime: "" }]);
  };

  const removeTimeSlot = (index) => {
    const updatedSlots = [...timeSlots];
    updatedSlots.splice(index, 1);
    setTimeSlots(updatedSlots);
  };

  // Tạo danh sách giờ với label tiếng Việt
  const generateTimeOptions = () => {
    const options = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hour = h.toString().padStart(2, "0");
        const minute = m.toString().padStart(2, "0");
        const value = `${hour}:${minute}`;

        let period = "sáng";
        if (h >= 12 && h < 18) period = "chiều";
        else if (h >= 18) period = "tối";

        const displayHour = h % 12 === 0 ? 12 : h % 12;
        options.push({ value, label: `${displayHour}:${minute} ${period}` });
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  const handleSubmit = async (e) => {
    e.preventDefault();

    let newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Tên phiếu giảm giá không được để trống";
    if (!formData.value || isNaN(formData.value)) newErrors.value = "Giá trị giảm giá phải là số";
    else if (Number(formData.value) <= 0) newErrors.value = "Giá trị giảm giá phải lớn hơn 0";
    if (!formData.type) newErrors.type = "Vui lòng chọn loại giảm giá";

    timeSlots.forEach((slot, i) => {
      if (!slot.date || !slot.startTime || !slot.endTime) {
        newErrors[`timeSlot_${i}`] = "Vui lòng chọn đủ ngày và giờ";
      } else {
        const start = new Date(`${slot.date}T${slot.startTime}`);
        const end = new Date(`${slot.date}T${slot.endTime}`);
        const now = new Date();
        
        // Chỉ kiểm tra nếu endTime đã qua (cho phép chọn timeSlot trong ngày hiện tại nếu endTime chưa qua)
        if (end < now) {
          newErrors[`timeSlot_${i}`] = "Không thể chọn thời gian đã qua";
        }
        if (start >= end) {
          newErrors[`timeSlot_${i}`] = "Giờ kết thúc phải sau giờ bắt đầu";
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("http://localhost:8080/admin/discounts/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, timeSlots }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Có lỗi khi tạo discount");

      alert("Tạo discount thành công");
      setFormData({ name: "", code: "", description: "", type: "", value: "" });
      setTimeSlots([{ date: "", startTime: "", endTime: "" }]);
      setErrors({});
      handleClose();
    } catch (error) {
      console.error("Error:", error);
      alert("Tạo discount thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Thêm Discount</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          {/* Name */}
          <Form.Group className="mb-3">
            <Form.Label>Tên phiếu giảm giá</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nhập tên phiếu giảm giá"
              isInvalid={!!errors.name}
            />
            <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
          </Form.Group>

          {/* Value */}
          <Form.Group className="mb-3">
            <Form.Label>Giá trị</Form.Label>
            <Form.Control
              type="number"
              name="value"
              value={formData.value}
              onChange={handleChange}
              placeholder="Nhập giá trị giảm"
              isInvalid={!!errors.value}
            />
            <Form.Control.Feedback type="invalid">{errors.value}</Form.Control.Feedback>
          </Form.Group>

          {/* Type */}
          <Form.Group className="mb-3">
            <Form.Label>Loại giảm giá</Form.Label>
            <Form.Select
              name="type"
              value={formData.type}
              onChange={handleChange}
              isInvalid={!!errors.type}
            >
              <option value="">-- Chọn loại giảm giá --</option>
              <option value="percent">Phần trăm (%)</option>
              <option value="amount">Số tiền (VND)</option>
            </Form.Select>
            <Form.Control.Feedback type="invalid">{errors.type}</Form.Control.Feedback>
          </Form.Group>

          {/* Description */}
          <Form.Group className="mb-3">
            <Form.Label>Mô tả</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Nhập mô tả khuyến mãi"
            />
          </Form.Group>

          {/* Time slots */}
          <Form.Group className="mb-3">
            <Form.Label>Khung giờ khuyến mãi</Form.Label>
            {timeSlots.map((slot, i) => (
              <div key={i} className="d-flex gap-2 align-items-center mb-2">
                <Form.Control
                  type="date"
                  value={slot.date}
                  onChange={(e) => handleTimeSlotChange(i, "date", e.target.value)}
                  isInvalid={!!errors[`timeSlot_${i}`]}
                />
                <Form.Select
                  value={slot.startTime}
                  onChange={(e) => handleTimeSlotChange(i, "startTime", e.target.value)}
                  isInvalid={!!errors[`timeSlot_${i}`]}
                >
                  <option value="">-- Chọn giờ bắt đầu --</option>
                  {timeOptions.map((t, idx) => (
                    <option key={idx} value={t.value}>{t.label}</option>
                  ))}
                </Form.Select>
                <Form.Select
                  value={slot.endTime}
                  onChange={(e) => handleTimeSlotChange(i, "endTime", e.target.value)}
                  isInvalid={!!errors[`timeSlot_${i}`]}
                >
                  <option value="">-- Chọn giờ kết thúc --</option>
                  {timeOptions.map((t, idx) => (
                    <option key={idx} value={t.value}>{t.label}</option>
                  ))}
                </Form.Select>
                {timeSlots.length > 1 && (
                  <Button variant="danger" size="sm" onClick={() => removeTimeSlot(i)}>X</Button>
                )}
                <Form.Control.Feedback type="invalid">{errors[`timeSlot_${i}`]}</Form.Control.Feedback>
              </div>
            ))}
            <Button variant="secondary" size="sm" className="mt-2" onClick={addTimeSlot}>
              + Thêm khung giờ
            </Button>
          </Form.Group>

          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" /> : "Lưu"}
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default CreateDiscount;
