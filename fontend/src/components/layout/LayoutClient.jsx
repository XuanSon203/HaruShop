import Container from "react-bootstrap/Container";
import Header from "../partial/client/Header";
import { Outlet } from "react-router-dom";
import Footer from "../partial/client/Footer";
import ChatBox from "../chat/ChatBox";
import { SettingsProvider } from "../../context/SettingsContext";
import "../../styles/client/LayoutClient.css";

function LayoutClient() {
  return (
    <SettingsProvider>
      <div className="d-flex flex-column min-vh-100">
        <Header />
        <Container fluid className="flex-grow-1 mt-4 px-4">
          <Outlet />
        </Container>
        <Footer />
        <ChatBox />
      </div>
    </SettingsProvider>
  );
}

export default LayoutClient;
