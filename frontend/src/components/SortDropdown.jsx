import React from "react";

function SortDropdown({ sortOption, setSortOption }) {
  return (
    <div className="mb-3 d-flex justify-content-end">
      <label className="me-2 fw-bold" htmlFor="sort-select">
        Sort By:
      </label>
      <select
        id="sort-select"
        className="form-select w-auto"
        value={sortOption}
        onChange={(e) => setSortOption(e.target.value)}
      >
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="priceLowHigh">Price: Low → High</option>
        <option value="priceHighLow">Price: High → Low</option>
      </select>
    </div>
  );
}

export default SortDropdown;
