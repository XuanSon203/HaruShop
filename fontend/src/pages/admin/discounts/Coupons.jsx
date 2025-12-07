import React, { useState, useEffect } from "react";
import Table from "react-bootstrap/Table";
import { Badge, Button, Spinner, Form } from "react-bootstrap";
import { FaTrash, FaEdit, FaEye } from "react-icons/fa";
import Search from "../../../components/search/Search";
import Sort from "../../../components/sort/Sort";
import CreateDiscount from "./Create";
import EditDiscount from "./Edit";
import ListDiscountDeleted from "./ListDiscountDelted";
import { useNotification } from "../../../components/nofication/Nofication";
function ManagerDiscount() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [discounts, setDiscounts] = useState([]);
  const [filteredDiscounts, setFilteredDiscounts] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeletedModal, setShowDeletedModal] = useState(false);
  const [discountDeleted, setDiscountDeleted] = useState(0);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
const { addNotification } = useNotification();
  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8080/admin/discounts", {
        credentials: "include",
      });

      if (!res.ok) addNotification("Lỗi khi lấy danh sách discount");
      const data = await res.json();
      setDiscounts(data.discounts);
      setDiscountDeleted(data.countDiscountDeleted);
      setFilteredDiscounts(data.discounts);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchDiscounts();
  }, []);
  // Filter + sort + date
  useEffect(() => {
    let updated = discounts
      // Filter theo tên
      .filter((d) => d.name.toLowerCase().includes(search.toLowerCase()))
      // Filter theo ngày
      .filter((d) => {
        if (!startDate && !endDate) return true;
        if (!d.timeSlots || d.timeSlots.length === 0) return false;
        const firstDate = new Date(d.timeSlots[0].date);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        if (start && end) return firstDate >= start && firstDate <= end;
        if (start) return firstDate >= start;
        if (end) return firstDate <= end;
        return true;
      })
      // Sort
      .sort((a, b) => {
        switch (sortBy) {
          case "nameAsc":
            return a.name.localeCompare(b.name);
          case "nameDesc":
            return b.name.localeCompare(a.name);
          case "statusActive":
            return a.status === "active" ? -1 : 1;
          case "statusInactive":
            return a.status === "inactive" ? -1 : 1;
          default:
            return 0;
        }
      });
    setFilteredDiscounts(updated);
  }, [discounts, search, sortBy, startDate, endDate]);

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn ơ' discount này?")) return;
    try {
      const res = await fetch(
        `http://localhost:8080/admin/discounts/deleted/${id}`,
        { method: "DELETE", credentials: "include" }
      );
      if (!res.ok) addNotification("Xóa thất bại","danger");

      setDiscounts((prev) => prev.filter((d) => d._id !== id));
      setDiscountDeleted((prev) => prev + 1); 
      addNotification("Đã chuyển vào thùng rác")
    } catch (error) {
      console.error("Error:", error);
      addNotification("Xóa thất bại");
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const res = await fetch(
        `http://localhost:8080/admin/discounts/changeStatus/${id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: currentStatus === "active" ? "inactive" : "active",
          }),
        }
      );
      if (!res.ok) throw new Error("Cập nhật trạng thái thất bại");
      setDiscounts((prev) =>
        prev.map((d) =>
          d._id === id
            ? {
                ...d,
                status: currentStatus === "active" ? "inactive" : "active",
              }
            : d
        )
      );
    } catch (error) {
      console.error("Error:", error);
      alert("Cập nhật trạng thái thất bại");
    }
  };

  const formatDate = (dateStr) =>
    !dateStr ? "-" : new Date(dateStr).toLocaleDateString("vi-VN");

  const formatTimeSlots = (timeSlots) =>
    !timeSlots || timeSlots.length === 0
      ? "-"
      : timeSlots
          .map(
            (slot) =>
              `${slot.date ? formatDate(slot.date) : "-"} | ${
                slot.startTime || "-"
              } - ${slot.endTime || "-"}`
          )
          .join("; ");

  return (
    <div>
      <h1 className="text-center mb-4">Quản lý Giảm giá</h1>

      <div className="d-flex justify-content-around align-items-center px-4 mb-3">
        <Search search={search} onSearchChange={setSearch} />
        <Sort
          options={[
            { value: "nameAsc", label: "Tên A-Z" },
            { value: "nameDesc", label: "Tên Z-A" },
            { value: "statusActive", label: "Trạng thái Active trước" },
            { value: "statusInactive", label: "Trạng thái Inactive trước" },
          ]}
          onSortChange={setSortBy}
        />
        <Form.Group className="d-flex align-items-center">
          <Form.Label className="me-2 mb-0">Từ:</Form.Label>
          <Form.Control
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Form.Label className="mx-2 mb-0">Đến:</Form.Label>
          <Form.Control
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </Form.Group>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3 px-4">
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          + Thêm Discount
        </Button>
        <Button variant="danger" onClick={() => setShowDeletedModal(true)}>
          <FaTrash style={{ marginRight: "6px" }} />
          Xóa đã chọn ({discountDeleted})
        </Button>
      </div>

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" />
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : (
        <Table striped bordered hover responsive className="px-4">
          <thead>
            <tr>
              <th>#</th>
              <th>Tên phiếu</th>
              <th>Mã</th>
              <th>Mô tả</th>
              <th>Loại</th>
              <th>Giá trị</th>
              <th>Khung giờ áp dụng</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredDiscounts.length > 0 ? (
              filteredDiscounts.map((d, index) => (
                <tr key={d._id}>
                  <td>{index + 1}</td>
                  <td>{d.name}</td>
                  <td>{d.code || "-"}</td>
                  <td>{d.description || "-"}</td>
                  <td>
                    <Badge bg={d.type === "percent" ? "info" : "warning"}>
                      {d.type === "percent" ? "Phần trăm" : "Số tiền"}
                    </Badge>
                  </td>
                  <td>
                    {d.type === "percent" ? `${d.value}%` : `${d.value} VND`}
                  </td>
                  <td>{formatTimeSlots(d.timeSlots)}</td>
                  <td>
                    <Badge
                      bg={d.status === "active" ? "success" : "secondary"}
                      style={{ cursor: "pointer" }}
                      onClick={() => toggleStatus(d._id, d.status)}
                    >
                      {d.status === "active" ? "Hoạt động" : "Không hoạt động"}
                    </Badge>
                  </td>
                  <td>
                    <Button
                      size="sm"
                      variant="info"
                      className="me-2"
                      onClick={() => alert("Xem chi tiết: " + d.code)}
                    >
                      <FaEye />
                    </Button>
                    <Button
                      size="sm"
                      variant="warning"
                      className="me-2"
                      onClick={() => {
                        setSelectedDiscount(d);
                        setShowEditModal(true);
                      }}
                    >
                      <FaEdit />
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(d._id)}
                    >
                      <FaTrash />
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="text-center">
                  Chưa có discount nào
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      )}

      <CreateDiscount
        show={showCreateModal}
        handleClose={() => {
          setShowCreateModal(false);
          fetchDiscounts();
        }}
      />

      <EditDiscount
        show={showEditModal}
        handleClose={() => {
          setShowEditModal(false);
          fetchDiscounts();
        }}
        discount={selectedDiscount}
      />
      <ListDiscountDeleted
        show={showDeletedModal}
        handleClose={() => {
          setShowDeletedModal(false);
          fetchDiscounts();
        }}
      />
    </div>
  );
}

export default ManagerDiscount;
