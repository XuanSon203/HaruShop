import React from "react";
import { Form, InputGroup } from "react-bootstrap";

function Search({ search, onSearchChange }) {
  return (
    <div className="w-50 mx-auto">
      <InputGroup>
        <Form.Control
          placeholder="Nhập tên để tìm kiếm"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </InputGroup>
    </div>
  );
}

export default Search;
