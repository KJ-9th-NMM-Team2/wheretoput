interface MobileBlockModalProps {
  title: string;
  description: string;
  showMobileButton?: boolean;
  mobileButtonText?: string;
  mobileButtonPath?: string;
  backButtonText?: string;
  onMobileButtonClick?: () => void;
  onBackButtonClick?: () => void;
}

export default function MobileBlockModal({
  title,
  description,
  showMobileButton = false,
  mobileButtonText = "모바일 버전으로 보기",
  mobileButtonPath,
  backButtonText = "이전으로 돌아가기",
  onMobileButtonClick,
  onBackButtonClick,
}: MobileBlockModalProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-blue-600 cursor-pointer"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600">{description}</p>
        </div>
        <div className="space-y-3">
          {showMobileButton && (
            <button
              onClick={onMobileButtonClick}
              className="tool-btn tool-btn:hover w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors cursor-pointer"
            >
              {mobileButtonText}
            </button>
          )}
          <button
            onClick={onBackButtonClick}
            className={`tool-btn-gray w-full font-medium py-3 px-4 rounded-lg transition-colors cursor-pointer ${
              showMobileButton
                ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {backButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}
