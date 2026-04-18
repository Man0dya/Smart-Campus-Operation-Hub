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
}) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);

  const normalizedOptions = useMemo(
    () => options.map(normalizeOption),
    [options]
  );

  const selectedOption = useMemo(
    () => normalizedOptions.find((option) => String(option.value) === String(value)),
    [normalizedOptions, value]
  );

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
          {normalizedOptions.map((option) => {
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
        </div>
      )}
    </div>
  );
}

export default StyledSelect;
