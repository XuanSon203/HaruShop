import React, { useEffect, useState } from "react";
import { Table, Button, Form, Modal } from "react-bootstrap";
import { useNotification } from "../../../components/nofication/Nofication";
function ListServiceDeleted({ show, onHide, onUpdate }) {
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const { addNotification } = useNotification();
  const API_BASE = `http://${window.location.hostname}:8080`;
  const loadDeletedServices = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/admin/services/listServicesDeleted`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      const data = await res.json();
      setServices(data.services || []);
    } catch (err) {
      console.error("Lỗi fetch:", err);
    }
  };

  // Lấy danh sách dịch vụ đã xóa khi modal mở
  useEffect(() => {
    if (show) {
      fetch(`${API_BASE}/admin/services/listServicesDeleted`, {
        method: "GET",
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => setServices(data.services || []))
        .catch((err) => console.error("Lỗi fetch:", err));
    }
  }, [show]);
  // Xử lý khôi phục hoặc xóa vĩnh viễn
const handleAction = async (service, actionType, notify) => {
  try {
    let url = "";
    let method = "PUT";

    if (actionType === "restore") {
      url = `${API_BASE}/admin/services/restore/${service._id}`;
    } else if (actionType === "delete") {
      url = `${API_BASE}/admin/services/forceDelete/${service._id}`;
      method = "DELETE";
    } else {
      throw new Error("Invalid action type");
    }

    const res = await fetch(url, {
      method,
      credentials: "include",
    });

    if (!res.ok) {
      const errorData = await res.json();
      if (actionType === "restore") {
        addNotification(`Khôi phục dịch vụ thất bại: ${errorData.message}`, "danger");
      } else {
        addNotification(`Xóa vĩnh viễn dịch vụ thất bại: ${errorData.message}`, "danger");
      }
      return;
    }

    // ✅ Nếu thành công
    if (actionType === "restore") {
      addNotification("Khôi phục dịch vụ thành công!", "success");
    } else {
      addNotification("Xóa vĩnh viễn dịch vụ thành công!", "success");
    }

    if (typeof onUpdate === "function") {
      onUpdate();
    }
    loadDeletedServices();
  } catch (err) {
    console.error("Error:", err.message);
    if (actionType === "restore") {
      addNotification(`Khôi phục dịch vụ thất bại.`, "danger");
    } else {
      addNotification(`Xóa vĩnh viễn dịch vụ thất bại.`, "danger");
    }
  }
};


  // Tìm kiếm theo tên dịch vụ
  const filteredServices = services.filter((s) =>
    (s.serviceName || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Danh sách dịch vụ đã xóa</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form className="mb-3">
          <Form.Control
            type="text"
            placeholder="Tìm kiếm theo tên dịch vụ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Form>

        <Table striped bordered hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Tên dịch vụ</th>
              <th>Hình ảnh</th>
              <th>Giá</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredServices.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center">
                  Không có dịch vụ phù hợp
                </td>
              </tr>
            ) : (
              filteredServices.map((service, index) => (
                <tr key={service._id}>
                  <td>{index + 1}</td>
                  <td>{service.serviceName}</td>
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
                  <td>{service.price || "-"}</td>
                  <td>
                    <Button
                      variant="success"
                      size="sm"
                      className="me-2"
                      onClick={() => handleAction(service, "restore")}
                    >
                      Khôi phục
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleAction(service, "delete")}
                    >
                      Xoá vĩnh viễn
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Đóng
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ListServiceDeleted;
