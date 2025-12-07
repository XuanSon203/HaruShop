import React, { useState, useEffect } from "react";
import { Card, Row, Col, Button, Badge, Table } from "react-bootstrap";
import TrackingInfo from "../../../components/tracking/TrackingInfo";
import TrackingBadge from "../../../components/tracking/TrackingBadge";

const TrackingDemo = () => {
  const [demoData, setDemoData] = useState(null);

  useEffect(() => {
    // Tạo dữ liệu demo
    const mockData = {
      _id: "64f1a2b3c4d5e6f7g8h9i0j1",
      name: "Món ăn demo",
      createdBy: {
        account_id: "64f1a2b3c4d5e6f7g8h9i0j1",
        createdAt: "2024-01-15T10:30:00.000Z",
        user: {
          fullName: "Nguyễn Văn A",
          userName: "admin",
          email: "admin@example.com"
        }
      },
      updatedBy: [
        {
          account_id: "64f1a2b3c4d5e6f7g8h9i0j1",
          updatedAt: "2024-01-15T11:30:00.000Z",
          user: {
            fullName: "Nguyễn Văn A",
            userName: "admin",
            email: "admin@example.com"
          }
        },
        {
          account_id: "64f1a2b3c4d5e6f7g8h9i0j2",
          updatedAt: "2024-01-15T14:30:00.000Z",
          user: {
            fullName: "Trần Thị B",
            userName: "manager",
            email: "manager@example.com"
          }
        }
      ],
      deletedBy: {
        account_id: "64f1a2b3c4d5e6f7g8h9i0j3",
        deletedAt: "2024-01-15T16:30:00.000Z",
        user: {
          fullName: "Lê Văn C",
          userName: "supervisor",
          email: "supervisor@example.com"
        }
      },
      deleted: true
    };

    setDemoData(mockData);
  }, []);

  if (!demoData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container-fluid">
      <h1 className="mb-4">Demo hiển thị thông tin tracking</h1>
      
      <Row>
        <Col md={12}>
          <Card className="mb-4">
            <Card.Header>
              <h5>1. Component TrackingInfo - Hiển thị chi tiết</h5>
            </Card.Header>
            <Card.Body>
              <TrackingInfo 
                createdBy={demoData.createdBy}
                updatedBy={demoData.updatedBy}
                deletedBy={demoData.deletedBy}
                showDeleted={demoData.deleted}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={12}>
          <Card className="mb-4">
            <Card.Header>
              <h5>2. Component TrackingBadge - Hiển thị trong bảng</h5>
            </Card.Header>
            <Card.Body>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Tên</th>
                    <th>Trạng thái</th>
                    <th>Thông tin tracking</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{demoData.name}</td>
                    <td>
                      <Badge bg={demoData.deleted ? "danger" : "success"}>
                        {demoData.deleted ? "Đã xóa" : "Hoạt động"}
                      </Badge>
                    </td>
                    <td>
                      <TrackingBadge 
                        createdBy={demoData.createdBy}
                        updatedBy={demoData.updatedBy}
                        deletedBy={demoData.deletedBy}
                        showDeleted={demoData.deleted}
                      />
                    </td>
                    <td>
                      <Button variant="info" size="sm">Xem</Button>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5>3. TrackingBadge - Không có thông tin xóa</h5>
            </Card.Header>
            <Card.Body>
              <TrackingBadge 
                createdBy={demoData.createdBy}
                updatedBy={demoData.updatedBy}
                deletedBy={null}
                showDeleted={false}
              />
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5>4. TrackingBadge - Chỉ có thông tin tạo</h5>
            </Card.Header>
            <Card.Body>
              <TrackingBadge 
                createdBy={demoData.createdBy}
                updatedBy={[]}
                deletedBy={null}
                showDeleted={false}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={12}>
          <Card className="mb-4">
            <Card.Header>
              <h5>5. Cách sử dụng trong code</h5>
            </Card.Header>
            <Card.Body>
              <pre className="bg-light p-3">
{`// Import components
import TrackingInfo from "../../../components/tracking/TrackingInfo";
import TrackingBadge from "../../../components/tracking/TrackingBadge";

// Trong bảng danh sách
<td>
  <TrackingBadge 
    createdBy={item.createdBy}
    updatedBy={item.updatedBy}
    deletedBy={item.deletedBy}
    showDeleted={item.deleted}
  />
</td>

// Trong modal chi tiết
<TrackingInfo 
  createdBy={item.createdBy}
  updatedBy={item.updatedBy}
  deletedBy={item.deletedBy}
  showDeleted={item.deleted}
/>`}
              </pre>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TrackingDemo;
