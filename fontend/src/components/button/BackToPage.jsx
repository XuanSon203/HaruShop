import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import { BsArrowLeft } from 'react-icons/bs';

function BackToPage({ label  ,variant}) {
  const navigate = useNavigate();

  const handleBacktoPage = () => {
    navigate(-1); // Quay lại trang trước
  };

  return (
    <Button variant={variant} onClick={handleBacktoPage} className='m-4'>
      <BsArrowLeft className="me-2" />
      {label}
    </Button>
  );
}

export default BackToPage;
