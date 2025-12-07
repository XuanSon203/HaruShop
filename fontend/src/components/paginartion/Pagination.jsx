import React from "react";
import { Pagination as BSPagination } from "react-bootstrap";

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    let pages = [];

    if (totalPages <= 7) {
      // Nếu số trang ít thì show hết
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Luôn hiển thị trang đầu và cuối
      pages = [1];

      if (currentPage > 3) {
        pages.push("start-ellipsis"); // ...
      }

      // Các trang gần currentPage
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("end-ellipsis"); // ...
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <BSPagination className="justify-content-center mt-3">
      {/* Nút Previous */}
      <BSPagination.Prev
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      />

      {pages.map((page, index) =>
        page === "start-ellipsis" || page === "end-ellipsis" ? (
          <BSPagination.Ellipsis key={index} disabled />
        ) : (
          <BSPagination.Item
            key={page}
            active={page === currentPage}
            onClick={() => onPageChange(page)}
          >
            {page}
          </BSPagination.Item>
        )
      )}

      {/* Nút Next */}
      <BSPagination.Next
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      />
    </BSPagination>
  );
}

export default Pagination;
