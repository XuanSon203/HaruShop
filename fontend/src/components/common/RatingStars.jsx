import React from "react";
import { BsStarFill, BsStarHalf, BsStar } from "react-icons/bs";

const RatingStars = ({
  rating = 0,
  size = 14,
  showCount = true,
  reviewCount = 0,
  className = "",
}) => {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
  const stars = [];

  // Sao đầy
  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <BsStarFill key={`full-${i}`} className="text-warning" size={size} />
    );
  }

  // Sao nửa
  if (hasHalf) {
    stars.push(<BsStarHalf key="half" className="text-warning" size={size} />);
  }

  // Sao rỗng
  for (let i = 0; i < emptyStars; i++) {
    stars.push(
      <BsStar key={`empty-${i}`} className="text-muted" size={size} />
    );
  }

  return (
    <div className={`d-flex align-items-center ${className}`}>
      <div className="d-flex align-items-center me-2">{stars}</div>
    </div>
  );
};

export default RatingStars;
