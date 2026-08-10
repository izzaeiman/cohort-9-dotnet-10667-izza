import { MdChevronLeft, MdChevronRight } from 'react-icons/md';
import styles from './Pagination.module.css';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize?: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 10,
  itemsPerPage,
  onPageChange,
}: PaginationProps) => {
  if (totalPages <= 1) return null;

  const effectivePageSize = itemsPerPage || pageSize;
  const startItem = (currentPage - 1) * effectivePageSize + 1;
  const endItem = Math.min(currentPage * effectivePageSize, totalItems);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className={styles.container} aria-label="Pagination Navigation">
      <span className={styles.info}>
        Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of <strong>{totalItems}</strong> entries
      </span>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.btn}
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous page"
        >
          <MdChevronLeft size={20} />
        </button>

        {pages.map((page) => (
          <button
            key={page}
            type="button"
            className={`${styles.btn} ${currentPage === page ? styles.btnActive : ''}`}
            onClick={() => onPageChange(page)}
            aria-label={`Page ${page}`}
            aria-current={currentPage === page ? 'page' : undefined}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          className={styles.btn}
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
        >
          <MdChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
