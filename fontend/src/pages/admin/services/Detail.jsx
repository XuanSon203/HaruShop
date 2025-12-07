import React from "react";
import { Modal, Button, Table,Image } from "react-bootstrap";
import TrackingInfo from "../../../components/tracking/TrackingInfo";

function DetailService({ show, handleClose, service }) {
const API_BASE = `http://${window.location.hostname}:8080`;

  if (!service) return null;

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Chi tiết dịch vụ</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Table striped bordered>
          <tbody>
            <tr>
              <td>Tên dịch vụ</td>
              <td>{service.serviceName}</td>
            </tr>{" "}
            <tr>
              <td>Hình ảnh</td>
              <td>
                {service.image ? (
                  <Image
                    src={`${API_BASE}${service.image}`}
                    alt={service.serviceName}
                    fluid
                    rounded
                    style={{ maxWidth: "200px" }}
                  />
                ) : (
                  "Chưa có hình"
                )}
              </td>
            </tr>
            <tr>
              <td>Mô tả</td>
              <td>{service.description}</td>
            </tr>
            <tr>
              <td>Giá</td>
              <td>{service.price?.toLocaleString()} VNĐ</td>
            </tr>
            <tr>
              <td>Trạng thái</td>
              <td>{service.status || "Chưa rõ"}</td>
            </tr>
            <tr>
              <td>Ngày tạo </td>
              <td>{service.createAt || "Chưa rõ"}</td>
            </tr>
          </tbody>
        </Table>

        {/* Thông tin tracking */}
        <div className="mt-4">
          <TrackingInfo 
            createdBy={service.createdBy}
            updatedBy={service.updatedBy}
            deletedBy={service.deletedBy}
            showDeleted={service.deleted}
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

export default DetailService;
