import { useEffect, useState } from "react";
import { HiOutlineExclamationTriangle } from "react-icons/hi2";

const EXIT_ANIMATION_MS = 180;

function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onCancel,
  onConfirm,
  variant = "danger",
  inputLabel,
  inputPlaceholder,
  inputDefaultValue = "",
  inputRequired = false,
  multilineInput = false,
}) {
  const [inputValue, setInputValue] = useState(inputDefaultValue);
  const [isRendered, setIsRendered] = useState(open);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setIsRendered(true);
      setIsClosing(false);
      return undefined;
    }

    if (!isRendered) {
      return undefined;
    }

    setIsClosing(true);
    const timer = setTimeout(() => {
      setIsRendered(false);
      setIsClosing(false);
    }, EXIT_ANIMATION_MS);

    return () => clearTimeout(timer);
  }, [open, isRendered]);

  useEffect(() => {
    if (open) {
      setInputValue(inputDefaultValue || "");
    }
  }, [open, inputDefaultValue]);

  useEffect(() => {
    if (!isRendered) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onCancel?.();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isRendered, onCancel]);

  if (!isRendered) {
    return null;
  }

  const buttonClass =
    variant === "neutral"
      ? "border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200"
      : "border-rose-300 bg-rose-600 text-white hover:bg-rose-700";

  const handleConfirm = () => {
    if (inputRequired && !inputValue.trim()) {
      return;
    }
    onConfirm?.(inputValue.trim());
  };

  return (
    <div
      className={`fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 px-4 ${
        isClosing ? "confirm-overlay-out" : "confirm-overlay-in"
      }`}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl ${
          isClosing ? "confirm-panel-out" : "confirm-panel-in"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-700">
            <HiOutlineExclamationTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
          </div>
        </div>

        {inputLabel && (
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-slate-700">{inputLabel}</label>
            {multilineInput ? (
              <textarea
                className="field min-h-24"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder={inputPlaceholder}
                required={inputRequired}
              />
            ) : (
              <input
                className="field"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder={inputPlaceholder}
                required={inputRequired}
              />
            )}
            {inputRequired && !inputValue.trim() && (
              <p className="mt-1 text-xs text-rose-600">This field is required.</p>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            type="button"
            className={`inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold transition ${buttonClass}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
