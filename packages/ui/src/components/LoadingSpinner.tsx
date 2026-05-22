interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({
  message = "Loading…",
  fullScreen = true,
}: LoadingSpinnerProps) {
  const wrapper = fullScreen
    ? "min-h-screen bg-[#F5E6D3] flex items-center justify-center"
    : "flex items-center justify-center py-12";

  return (
    <div className={wrapper}>
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-9 h-9">
          {/* Track */}
          <svg
            className="w-9 h-9"
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="18"
              cy="18"
              r="14"
              stroke="#C8A96E"
              strokeOpacity="0.2"
              strokeWidth="3"
            />
            {/* Spinning arc */}
            <circle
              cx="18"
              cy="18"
              r="14"
              stroke="#C8A96E"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="22 66"
              className="animate-spin"
              style={{ transformOrigin: "center", animationDuration: "0.9s" }}
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-[#8B6F5E]">{message}</p>
      </div>
    </div>
  );
}