import React from "react";
import "../styles/sort_dropdown.css";

function SortDropdown({ sortOption, setSortOption }) {
  return (
    <div className="sort-dropdown-container">
      <label htmlFor="sort-select" className="sort-dropdown-label">
        Sort by
      </label>
      <select
        id="sort-select"
        className="sort-dropdown-select"
        value={sortOption}
        onChange={(e) => setSortOption(e.target.value)}
        style={{
          borderColor: "var(--wood-accent)",
        }}
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
