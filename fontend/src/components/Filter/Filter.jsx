import React, { useState } from "react";
import Form from "react-bootstrap/Form";
import Dropdown from "react-bootstrap/Dropdown";
import Button from "react-bootstrap/Button";

// Định nghĩa ánh xạ giữa eventKey và văn bản hiển thị
const actionLabels = {
  inactive: "Ngưng hoạt động",
  active: "Hoạt động",
  "change-position": "Thay đổi vị trí",
  delete: "Xóa",
};

function Filter({ onFilter, selectedIds }) {
  const [action, setAction] = useState(""); // Lưu eventKey

  const handleSelect = (eventKey) => {
    setAction(eventKey); // Cập nhật action với eventKey
  };

  const handleApply = () => {
    if (!selectedIds || selectedIds.length === 0) {
      alert("Chọn ít nhất 1 danh mục để áp dụng");
      return;
    }
    if (onFilter) onFilter({ action, ids: selectedIds }); 
  };

  // Lấy văn bản hiển thị dựa trên action
  const displayText = action ? actionLabels[action] || action : "Chọn hành động";

  return (
    <div
      style={{ minWidth: "250px" }}
      className="d-flex align-items-center gap-2"
    >
      <div style={{ flex: 1 }}>
        <Form.Label>Hành động</Form.Label>
        <Dropdown onSelect={handleSelect}>
          <Dropdown.Toggle
            variant="outline-primary"
            id="dropdown-action"
            className="w-100"
          >
            {displayText}
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item eventKey="inactive">Ngưng hoạt động</Dropdown.Item>
            <Dropdown.Item eventKey="active">Hoạt động</Dropdown.Item>
            <Dropdown.Item eventKey="change-position">Thay đổi vị trí</Dropdown.Item>
            <Dropdown.Item eventKey="delete">Xóa</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
      <div style={{ marginTop: "1.7rem" }}>
        <Button variant="outline-primary" onClick={handleApply}>
          Áp dụng
        </Button>
      </div>
    </div>
  );
}
export default Filter;
