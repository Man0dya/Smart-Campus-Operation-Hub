import { useEffect, useState } from "react";
import { HiOutlineCheckCircle, HiOutlineExclamationCircle, HiOutlineXMark } from "react-icons/hi2";

const EXIT_ANIMATION_MS = 180;

function FloatingToast({
  open,
  message,
  type = "success",
  onClose,
  duration = 2600,
}) {
  const [isRendered, setIsRendered] = useState(open && Boolean(message));
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const shouldBeOpen = open && Boolean(message);

    if (shouldBeOpen) {
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
  }, [open, message, isRendered]);

  useEffect(() => {
    if (!open || !message) {
      return undefined;
    }

    const timer = setTimeout(() => {
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [open, message, duration, onClose]);

  if (!isRendered || !message) {
    return null;
  }

  const isSuccess = type === "success";
  const containerClass = isSuccess
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-rose-200 bg-rose-50 text-rose-800";

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[130] w-full max-w-sm">
      <div
        className={`pointer-events-auto rounded-xl border px-4 py-3 shadow-lg ${containerClass} ${
          isClosing ? "toast-out" : "toast-in"
        }`}
      >
        <div className="flex items-start gap-2.5">
          {isSuccess ? (
            <HiOutlineCheckCircle className="mt-0.5 h-5 w-5" />
          ) : (
            <HiOutlineExclamationCircle className="mt-0.5 h-5 w-5" />
          )}
          <p className="flex-1 text-sm font-medium">{message}</p>
          <button
            type="button"
            aria-label="Close notification"
            className="inline-flex h-5 w-5 items-center justify-center rounded text-current/70 transition hover:bg-black/5 hover:text-current"
            onClick={onClose}
          >
            <HiOutlineXMark className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default FloatingToast;
