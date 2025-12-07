import React from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import image1 from "../../assets/Math1.jpg"; // Thay bằng ảnh thực tế

function PopularField() {
  return (
    <Container className="mt-4 bg-light p-4 rounded mb-4">
      {/* Tiêu đề */}
      <Row className="mb-4">
        <Col className="text-center">
          <h3>Các sản phẩm nổi bật </h3>
          <p> Chọn loại sẩn phẩm phù hợp với thú cưng  cầu của bạn</p>
        </Col>
      </Row>
        {/* Sân 7 người */}
        <Col  xs={12} sm={6} md={6} lg={4}>
          <Card>
            <Card.Img variant="top" src={image1} style={{ height: "180px", objectFit: "cover" }} />
            <Card.Body>
              <Card.Title>Cát mèo</Card.Title>
              <Card.Subtitle className="mb-2 text-muted">
                 Cỡ trung
              </Card.Subtitle>
              <Card.Text>
                Phù hợp cho các giải phong trào, tổ chức sự kiện thể thao hoặc giao hữu.
              </Card.Text>
              <Card.Link href="#">Xem thêm</Card.Link>
            </Card.Body>
          </Card>
        </Col>
    </Container>
  );
}

export default PopularField;
