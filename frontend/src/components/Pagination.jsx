import { useEffect } from "react";
import "../styles/pagination.css";

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  onPageSizeChange,
  siblingCount = 1,
  boundaryCount = 1,
  enableHotkeys = true,
}) {
  // Safety
  const safeCurrent = Math.min(
    Math.max(1, currentPage || 1),
    Math.max(1, totalPages || 1)
  );
  const canPrev = safeCurrent > 1;
  const canNext = safeCurrent < totalPages;

  // Keyboard arrows support
  useEffect(() => {
    if (!enableHotkeys) return;
    const handler = (e) => {
      if (e.key === "ArrowLeft" && canPrev) onPageChange(safeCurrent - 1);
      if (e.key === "ArrowRight" && canNext) onPageChange(safeCurrent + 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enableHotkeys, canPrev, canNext, safeCurrent, onPageChange]);

  // Build page model with smart ellipses (inspired by MUI)
  const range = (start, end) => {
    const arr = [];
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  };

  const startPages = range(1, Math.min(boundaryCount, totalPages));
  const endPages = range(
    Math.max(totalPages - boundaryCount + 1, boundaryCount + 1),
    totalPages
  );

  const siblingsStart = Math.max(
    Math.min(
      safeCurrent - siblingCount,
      totalPages - boundaryCount - siblingCount * 2 - 1
    ),
    boundaryCount + 2
  );

  const siblingsEnd = Math.min(
    Math.max(safeCurrent + siblingCount, boundaryCount + siblingCount * 2 + 2),
    endPages.length > 0 ? endPages[0] - 2 : totalPages - 1
  );

  const itemList = [
    ...startPages,
    ...(siblingsStart > boundaryCount + 2
      ? ["ellipsis-start"]
      : boundaryCount + 1 < totalPages - boundaryCount
      ? [boundaryCount + 1]
      : []),
    ...range(siblingsStart, siblingsEnd),
    ...(siblingsEnd < totalPages - boundaryCount - 1
      ? ["ellipsis-end"]
      : totalPages - boundaryCount > boundaryCount
      ? [totalPages - boundaryCount]
      : []),
    ...endPages,
  ].filter(Boolean);

  // Item range text
  const renderRange = () => {
    if (!totalItems || !pageSize) return null;
    const start = (safeCurrent - 1) * pageSize + 1;
    const end = Math.min(safeCurrent * pageSize, totalItems);
    return (
      <div className="pagination-range" aria-live="polite">
        {start}–{end} of {totalItems}
      </div>
    );
  };

  return (
    <nav
      className="pagination-wrapper"
      role="navigation"
      aria-label="Pagination Navigation"
    >
      {/* Left side: range + size selector (if provided) */}
      <div className="pagination-left">
        {renderRange()}
        {typeof onPageSizeChange === "function" && pageSize ? (
          <label className="page-size" aria-label="Items per page">
            <span className="page-size-label">Per page</span>
            <select
              className="page-size-select"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {[10, 15, 20, 30, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {/* Center: full pagination */}
      <div className="pagination">
        <button
          className="page-btn"
          onClick={() => onPageChange(1)}
          disabled={!canPrev}
          aria-label="First Page"
        >
          « First
        </button>

        <button
          className="page-btn"
          onClick={() => onPageChange(safeCurrent - 1)}
          disabled={!canPrev}
          aria-label="Previous Page"
        >
          ‹ Prev
        </button>

        <div className="page-numbers" role="list">
          {itemList.map((item, idx) => {
            if (item === "ellipsis-start" || item === "ellipsis-end") {
              return (
                <span
                  key={`${item}-${idx}`}
                  className="page-ellipsis"
                  aria-hidden="true"
                >
                  …
                </span>
              );
            }
            return (
              <button
                key={item}
                role="listitem"
                className={`page-btn ${item === safeCurrent ? "active" : ""}`}
                onClick={() => onPageChange(item)}
                aria-current={item === safeCurrent ? "page" : undefined}
                aria-label={`Page ${item}`}
              >
                {item}
              </button>
            );
          })}
        </div>

        <button
          className="page-btn"
          onClick={() => onPageChange(safeCurrent + 1)}
          disabled={!canNext}
          aria-label="Next Page"
        >
          Next ›
        </button>

        <button
          className="page-btn"
          onClick={() => onPageChange(totalPages)}
          disabled={!canNext}
          aria-label="Last Page"
        >
          Last »
        </button>
      </div>

      {/* Right: compact summary (visible on small screens) */}
      <div className="pagination-right">
        <div className="pagination-compact" aria-hidden="true">
          Page {safeCurrent} of {totalPages}
        </div>
      </div>
    </nav>
  );
}

export default Pagination;
