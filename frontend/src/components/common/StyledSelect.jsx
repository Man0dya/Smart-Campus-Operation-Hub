import { useEffect, useMemo, useRef, useState } from "react";
import { HiCheck, HiChevronUpDown } from "react-icons/hi2";

const normalizeOption = (option) => {
  if (typeof option === "object" && option !== null) {
    return {
      value: option.value,
      label: option.label ?? String(option.value),
      disabled: Boolean(option.disabled),
    };
  }

  return {
    value: option,
    label: String(option),
    disabled: false,
  };
};

function StyledSelect({
  id,
  name,
  value,
  onChange,
  options = [],
  className = "",
  placeholder = "Select an option",
  disabled = false,
  menuClassName = "",
  menuPlacement = "bottom",
  searchable = false,
  searchPlaceholder = "Search...",
}) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const normalizedOptions = useMemo(
    () => options.map(normalizeOption),
    [options]
  );

  const selectedOption = useMemo(
    () => normalizedOptions.find((option) => String(option.value) === String(value)),
    [normalizedOptions, value]
  );

  const filteredOptions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!searchable || !query) {
      return normalizedOptions;
    }

    return normalizedOptions.filter((option) =>
      option.label.toLowerCase().includes(query) || String(option.value).toLowerCase().includes(query)
    );
  }, [normalizedOptions, searchTerm, searchable]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleSelect = (nextValue) => {
    setOpen(false);
    setSearchTerm("");

    if (!onChange) {
      return;
    }

    onChange({
      target: {
        name,
        value: nextValue,
        id,
      },
    });
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        id={id}
        type="button"
        className={`dropdown-trigger ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={selectedOption ? "text-slate-800" : "text-slate-500"}>
          {selectedOption?.label || placeholder}
        </span>
        <HiChevronUpDown className="h-4 w-4 text-slate-500" />
      </button>

      {open && !disabled && (
        <div
          className={`dropdown-menu ${
            menuPlacement === "top" ? "bottom-full mb-1" : "mt-1"
          } ${menuClassName}`}
        >
          {searchable && (
            <div className="border-b border-slate-200 p-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={searchPlaceholder}
                className="field h-9"
              />
            </div>
          )}

          {filteredOptions.map((option) => {
            const isSelected = String(option.value) === String(value);

            return (
              <button
                key={`${name || id || "dropdown"}-${String(option.value)}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`dropdown-item ${isSelected ? "dropdown-item-selected" : ""}`}
                onClick={() => handleSelect(option.value)}
                disabled={option.disabled}
              >
                <span>{option.label}</span>
                {isSelected && <HiCheck className="h-4 w-4" />}
              </button>
            );
          })}

          {filteredOptions.length === 0 && (
            <p className="px-3 py-2 text-sm text-slate-500">No options found.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default StyledSelect;
