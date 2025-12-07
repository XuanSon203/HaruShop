import React, { useState, useEffect } from "react";
import Table from "react-bootstrap/Table";
import { Button, Spinner } from "react-bootstrap";
import { FaTrash, FaEdit, FaEye } from "react-icons/fa";
import Filter from "../../../components/Filter/Filter";
import Search from "../../../components/search/Search";
import Sort from "../../../components/sort/Sort";
import TrackingBadge from "../../../components/tracking/TrackingBadge";
import CreateService from "./Create";
import EditService from "./Edit";
import DetailService from "./Detail";
import Pagination from "../../../components/paginartion/Pagination";
import ListServiceDeleted from "./ListServicesDeleted";
import { useNotification } from "../../../components/nofication/Nofication";
function ManagerServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [servicesDeleted, setServiceDeleted] = useState(null);
  const { addNotification } = useNotification();
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalService: 0,
    limit: 10,
  });
  // Search & Sort
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("");
const API_BASE = `http://${window.location.hostname}:8080`;
  // Fetch services từ API
  const fetchServices = async (page = 1) => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API_BASE}/admin/services?page=${page}&limit=5`,
        { method: "GET", credentials: "include" }
      );
      const data = await res.json();

      if (res.ok) {
        setServices(data.services);
        setPagination(data.pagination);
        setServiceDeleted(data.countServiceDeleted);
      }
    } catch (error) {
      console.error("Lỗi fetch services:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);
  // Xóa dịch vụ
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa dịch vụ này?")) return;

    try {
      const res = await fetch(
        `${API_BASE}/admin/services/deleted/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (res.ok) addNotification("Xóa thành công ", "success");
      fetchServices();
    } catch (error) {
      console.error(error);
      addNotification("Xóa thất bại!", "danger");
    }
  };
  const handleStatusClick = async (id, newStatus) => {
    try {
      const res = await fetch(
        `${API_BASE}/admin/services/changeStatus/${id}/${newStatus}`,
        { method: "PUT", credentials: "include" }
      );

      if (!res.ok) addNotification("Cập nhật trạng thái thất bại", "danger");

      const updatedService = await res.json();
      // Cập nhật 1 user trong state
      setServices((prev) =>
        prev.map((u) => (u._id === updatedService._id ? updatedService : u))
      );
      addNotification("Cập nhật trạng thái thành công ", "success");
    } catch (err) {
      addNotification("Lỗi khi đổi trạng thái:", "danger");
    }
  };

  // Lọc & Sắp xếp
  const filteredServices = services
    .filter((s) =>
      (s.name || s.description || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "nameAsc":
          return (a.name || "").localeCompare(b.name || "");
        case "nameDesc":
          return (b.name || "").localeCompare(a.name || "");
        case "priceAsc":
          return Number(a.price || 0) - Number(b.price || 0);
        case "priceDesc":
          return Number(b.price || 0) - Number(a.price || 0);
        default:
          return 0;
      }
    });

  return (
    <div>
      <h1 className="text-center mb-4">Dịch vụ trên hệ thống</h1>

      <div className="d-flex justify-content-around align-items-center px-4 mb-3">
        <Search search={searchQuery} onSearchChange={setSearchQuery} />
        <Sort
          options={[
            { value: "nameAsc", label: "Tên A-Z" },
            { value: "nameDesc", label: "Tên Z-A" },
            { value: "priceAsc", label: "Giá tăng dần" },
            { value: "priceDesc", label: "Giá giảm dần" },
          ]}
          onSortChange={setSortBy}
        />
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3 px-4">
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          + Thêm dịch vụ
        </Button>

        <Button variant="danger" onClick={() => setShowDeleted(true)}>
          <FaTrash style={{ marginRight: "6px" }} />
          Xóa {servicesDeleted}
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" />
        </div>
      ) : (
        <Table striped bordered hover style={{ tableLayout: 'auto', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ width: 'auto', minWidth: '50px', textAlign: 'center' }}>#</th>
              <th style={{ width: 'auto', minWidth: '150px' }}>Tên dịch vụ</th>
              <th style={{ width: 'auto', minWidth: '80px', textAlign: 'center' }}>Hình ảnh</th>
              <th className="wrap" style={{ width: 'auto', minWidth: '200px' }}>Mô tả</th>
              <th style={{ width: 'auto', minWidth: '100px', textAlign: 'right' }}>Giá</th>
              <th style={{ width: 'auto', minWidth: '100px', textAlign: 'center' }}>Trạng thái</th>
              <th style={{ width: 'auto', minWidth: '150px' }}>Thông tin tracking</th>
              <th style={{ width: 'auto', minWidth: '180px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredServices.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center">
                  Không có dịch vụ
                </td>
              </tr>
            )}

            {filteredServices.map((service, index) => (
              <tr key={service._id}>
                <td>
                  {(pagination.currentPage - 1) * pagination.limit + index + 1}
                </td>

                <td>{service.serviceName || "-"}</td>
                <td>
                  {service.image ? (
                    <img
                      src={`${API_BASE}${service.image}`}
                      alt={service.serviceName}
                      style={{
                        width: "60px",
                        height: "60px",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    "Không có ảnh"
                  )}
                </td>

                <td>{service.description || "-"}</td>
                <td>{service.price || "-"}</td>
              
                <td>
                  <button
                    onClick={() =>
                      handleStatusClick(
                        service._id,
                        service.status === "active" ? "inactive" : "active"
                      )
                    }
                    className={`btn btn-sm text-white ${
                      service.status === "active" ? "btn-success" : "btn-danger"
                    }`}
                  >
                    {service.status === "active"
                      ? "Hoạt động"
                      : "Ngưng hoạt động"}
                  </button>
                </td>

                <td>
                  <TrackingBadge 
                    createdBy={service.createdBy}
                    updatedBy={service.updatedBy}
                    deletedBy={service.deletedBy}
                    showDeleted={false}
                  />
                </td>

                <td>
                  <Button
                    variant="info"
                    size="sm"
                    className="me-2"
                    onClick={() => {
                      setSelectedService(service);
                      setShowViewModal(true);
                    }}
                  >
                    <FaEye className="me-1"/>
                    Chi tiết
                  </Button>
                  <Button
                    variant="warning"
                    size="sm"
                    className="me-2"
                    onClick={() => {
                      setSelectedService(service);
                      setShowEditModal(true);
                    }}
                  >
                    <FaEdit className="me-1"/>
                    Sửa
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(service._id)}
                  >
                    <FaTrash className="me-1"/>
                    Xóa
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Modal tạo dịch vụ */}
      <CreateService
        show={showCreateModal}
        handleClose={() => {
          setShowCreateModal(false);
          fetchServices();
        }}
      />

      {/* TODO: Modal Edit & View */}

      <EditService
        show={showEditModal}
        handleClose={() => setShowEditModal(false)}
        service={selectedService}
        onSuccess={fetchServices}
      />
      <DetailService
        show={showViewModal}
        service={selectedService}
        handleClose={() => {
          setShowViewModal(false);
          fetchServices();
        }}
      />
      <ListServiceDeleted
        show={showDeleted}
        onHide={() => setShowDeleted(false)}
        onUpdate={fetchServices}
      />

      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={(page) => fetchServices(page)}
      />
    </div>
  );
}

export default ManagerServices;
