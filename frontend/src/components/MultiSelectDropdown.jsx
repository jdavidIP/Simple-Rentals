import { useEffect, useRef, useState } from "react";

function MultiSelectDropdown({ label, options, selected, setSelected }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (value) => {
    if (selected.includes(value)) {
      setSelected(selected.filter((v) => v !== value));
    } else {
      setSelected([...selected, value]);
    }

    console.log(selected);
  };

  const selectedLabels = options
    .filter((opt) => selected.includes(opt.value))
    .map((opt) => opt.label);

  return (
    <div className="dropdown w-100" ref={dropdownRef}>
      <label className="form-label fw-medium d-block">{label}</label>
      <button
        className="form-select text-start rounded-3 shadow-sm"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedLabels.length > 0
          ? selectedLabels.join(", ")
          : `Select ${label.toLowerCase()}...`}
      </button>
      {isOpen && (
        <div
          className="dropdown-menu show w-100 p-2 border rounded shadow-sm"
          style={{ maxHeight: "200px", overflowY: "auto" }}
        >
          {options.map((opt) => (
            <div key={opt.value} className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id={`${label}-${opt.value}`}
                checked={selected.includes(opt.value)}
                onChange={() => toggleOption(opt.value)}
              />
              <label
                className="form-check-label"
                htmlFor={`${label}-${opt.value}`}
              >
                {opt.label}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MultiSelectDropdown;
