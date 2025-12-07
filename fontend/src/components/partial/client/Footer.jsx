import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import {
  BsFillTelephoneFill,
  BsEnvelope,
  BsMap,
} from "react-icons/bs";
import { useSettings } from "../../../context/SettingsContext";
import { Link } from "react-router-dom";
function Footer() {
  const { settings, getLogoUrl } = useSettings();

  return (
    <>
      <footer
        className="footer pt-5 pb-3 position-relative"
        style={{
          backgroundColor: "#ffffff",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <Container>
          <Row className="mb-4">
            <Col xs={12} md={3} className="mb-4 mb-md-0">
              <div className="d-flex align-items-center mb-3">
                {getLogoUrl() && (
                  <img
                    src={getLogoUrl()}
                    alt="Logo"
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      marginRight: "12px",
                      flexShrink: 0,
                    }}
                  />
                )}
                <h4 className="fw-bold mb-0" style={{ color: "#1f2937", fontSize: "1.25rem" }}>
                  🐾 {settings.shopName || 'Haru'}<span style={{ color: "#f2760a" }}>Shop</span>
                </h4>
              </div>
            </Col>

            <Col xs={6} md={3} className="mb-4 mb-md-0">
              <h5 className="fw-semibold mb-3" style={{ color: "#1f2937", fontSize: "1rem" }}>
                Sản Phẩm
              </h5>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <a
                    href="/foods"
                    className="text-decoration-none"
                    style={{ color: "#6b7280", fontSize: "0.9rem" }}
                  >
                    Thức ăn thú cưng
                  </a>
                </li>
                <li className="mb-2">
                  <a
                    href="/accessories"
                    className="text-decoration-none"
                    style={{ color: "#6b7280", fontSize: "0.9rem" }}
                  >
                    Phụ kiện thú cưng
                  </a>
                </li>
                <li className="mb-2">
                  <a
                    href="/services"
                    className="text-decoration-none"
                    style={{ color: "#6b7280", fontSize: "0.9rem" }}
                  >
                    Dịch vụ chăm sóc
                  </a>
                </li>
              </ul>
            </Col>

            <Col xs={6} md={3} className="mb-4 mb-md-0">
              <h5 className="fw-semibold mb-3" style={{ color: "#1f2937", fontSize: "1rem" }}>
                Hỗ Trợ
              </h5>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <a
                    href="#"
                    className="text-decoration-none"
                    style={{ color: "#6b7280", fontSize: "0.9rem" }}
                  >
                    Hướng dẫn mua hàng
                  </a>
                </li>
                <li className="mb-2">
                  <Link
                    to="#"
                    className="text-decoration-none"
                    style={{ color: "#6b7280", fontSize: "0.9rem" }}
                  >
                    Chính sách đổi trả
                  </Link>
                </li>
                <li className="mb-2">
                  <Link
                    to="#"
                    className="text-decoration-none"
                    style={{ color: "#6b7280", fontSize: "0.9rem" }}
                  >
                    Câu hỏi thường gặp
                  </Link>
                </li>
                <li className="mb-2">
                  <Link
                    to="/contact"
                    className="text-decoration-none"
                    style={{ color: "#6b7280", fontSize: "0.9rem" }}
                  >
                    Liên hệ hỗ trợ
                  </Link>
                </li>
              </ul>
            </Col>

            <Col xs={12} md={3}>
              <h5 className="fw-semibold mb-3" style={{ color: "#1f2937", fontSize: "1rem" }}>
                Liên Hệ
              </h5>
              <ul className="list-unstyled">
                {settings.phone && (
                  <li className="mb-2 d-flex align-items-start" style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                    <BsFillTelephoneFill className="me-2 mt-1" style={{ flexShrink: 0 }} />
                    <span style={{ wordBreak: "break-word" }}>{settings.phone}</span>
                  </li>
                )}
                {settings.email && (
                  <li className="mb-2 d-flex align-items-start" style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                    <BsEnvelope className="me-2 mt-1" style={{ flexShrink: 0 }} />
                    <span style={{ wordBreak: "break-word" }}>{settings.email}</span>
                  </li>
                )}
                {settings.address && (
                  <li className="mb-2 d-flex align-items-start" style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                    <BsMap className="me-2 mt-1" style={{ flexShrink: 0 }} />
                    <span style={{ wordBreak: "break-word" }}>{settings.address}</span>
                  </li>
                )}
                {!settings.phone && !settings.email && !settings.address && (
                  <>
                    <li className="mb-2" style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                      <BsFillTelephoneFill className="me-2" /> 0123 456 789
                    </li>
                    <li className="mb-2" style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                      <BsEnvelope className="me-2" /> info@harushop.vn
                    </li>
                    <li className="mb-2" style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                      <BsMap className="me-2" /> 123 Đường ABC, Quận 1, TP.HCM
                    </li>
                  </>
                )}
              </ul>
            </Col>
          </Row>

          <hr style={{ borderColor: "#e5e7eb" }} />
        </Container>
      </footer>
    </>
  );
}

export default Footer;
