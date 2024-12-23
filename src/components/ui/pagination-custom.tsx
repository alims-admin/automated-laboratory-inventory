import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

interface CustomPaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const CustomPagination: React.FC<CustomPaginationProps> = ({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages === 1 || totalItems === 0) return null;

  const generatePageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, "ellipsis", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "ellipsis", totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(
          1,
          "ellipsis",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "ellipsis",
          totalPages
        );
      }
    }
    return pages;
  };

  const pages = generatePageNumbers();

  return (
    <Pagination className="mt-4 justify-end">
      <PaginationContent>
        <PaginationPrevious
          onClick={
            currentPage > 1 ? () => onPageChange(currentPage - 1) : undefined
          }
          aria-label="Previous Page"
          className={cn(
            `${
              currentPage === 1
                ? "opacity-50 pointer-events-none"
                : "hover:bg-teal-100"
            }`
          )}
        />
        {pages.map((page, index) =>
          page === "ellipsis" ? (
            <PaginationEllipsis key={`ellipsis-${index}`} aria-hidden="true" />
          ) : (
            <PaginationItem key={page}>
              <PaginationLink
                isActive={currentPage === page}
                aria-current={currentPage === page ? "page" : undefined}
                onClick={() => onPageChange(page as number)}
                className={cn(
                  `${
                    currentPage === page
                      ? "bg-teal-900 text-white hover:bg-teal-900 hover:text-white"
                      : "hover:bg-teal-100"
                  }`
                )}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          )
        )}
        <PaginationNext
          onClick={
            currentPage < totalPages
              ? () => onPageChange(currentPage + 1)
              : undefined
          }
          aria-label="Next Page"
          className={cn(
            `${
              currentPage === totalPages
                ? "opacity-50 pointer-events-none "
                : "hover:bg-teal-100"
            }`
          )}
        />
      </PaginationContent>
    </Pagination>
  );
};

export default CustomPagination;
