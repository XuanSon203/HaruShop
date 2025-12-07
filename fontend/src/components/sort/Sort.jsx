import React from "react";
import Dropdown from "react-bootstrap/Dropdown";
import Form from "react-bootstrap/Form";

function Sort({ options = [], onSortChange }) {
  return (
    <div style={{ minWidth: "200px", margin: "40px" }}>
      <Form.Label>Sắp xếp</Form.Label>
      <Dropdown>
        <Dropdown.Toggle
          variant="outline-primary"
          id="dropdown-sort"
          className="w-100"
        >
          Chọn kiểu sắp xếp
        </Dropdown.Toggle>
        <Dropdown.Menu>
          {options.map((opt) => (
            <Dropdown.Item
              key={opt.value}
              onClick={() => onSortChange(opt.value)}
            >
              {opt.label}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
}

export default Sort;
