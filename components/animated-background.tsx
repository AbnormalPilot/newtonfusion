"use client"

export function AnimatedBackground() {
  return (
    <div className="absolute right-0 inset-0 overflow-visible pointer-events-none">
      <svg
        
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-cover"
      >
        <defs>
          <filter
            id="filter0_f_6_2"
            x="-161.8"
            y="-474.8"
            width="2499.75"
            height="2007.14"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur stdDeviation="286.9" result="effect1_foregroundBlur_6_2" />
          </filter>
          <filter
            id="filter1_f_6_2"
            x="1071.85"
            y="-94.1538"
            width="736.479"
            height="1043.31"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur stdDeviation="65.0769" result="effect1_foregroundBlur_6_2" />
          </filter>
          <filter
            id="filter2_f_6_2"
            x="794.2"
            y="149.2"
            width="666.6"
            height="802.6"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur stdDeviation="113.9" result="effect1_foregroundBlur_6_2" />
          </filter>
          <clipPath id="clip0_6_2">
            <rect width="1440" height="1024" fill="white" />
          </clipPath>
        </defs>

        <g clipPath="url(#clip0_6_2)">
   
          {/* Animated blue triangle */}
          <g filter="url(#filter0_f_6_2)">
            <path
              d="M412 528.767L1764.15 958.535V99L412 528.767Z"
              fill="#077AFE"
              className="animate-pulse"
              style={{
                animation: "float 8s ease-in-out infinite, glow 4s ease-in-out infinite alternate",
              }}
            />
          </g>

          {/* Animated white orb 1 */}
          <g style={{ mixBlendMode: "plus-lighter" }} filter="url(#filter1_f_6_2)">
            <path
              d="M1678.17 427.5C1678.17 643.719 1601.8 819 1507.59 819C1413.38 819 1202 643.719 1202 427.5C1202 211.281 1413.38 36 1507.59 36C1601.8 36 1678.17 211.281 1678.17 427.5Z"
              fill="white"
              style={{
                animation: "pulse 6s ease-in-out infinite, drift 12s ease-in-out infinite",
              }}
            />
          </g>

          {/* Animated white orb 2 */}
          <g style={{ mixBlendMode: "plus-lighter" }} filter="url(#filter2_f_6_2)">
            <path
              d="M1233 550.5C1233 646.321 1199.16 724 1157.41 724C1115.67 724 1022 646.321 1022 550.5C1022 454.679 1115.67 377 1157.41 377C1199.16 377 1233 454.679 1233 550.5Z"
              fill="white"
              style={{
                animation: "pulse 4s ease-in-out infinite 2s, drift 10s ease-in-out infinite reverse",
              }}
            />
          </g>
        </g>
      </svg>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
        }
        
        @keyframes glow {
          0% { opacity: 0.8; }
          100% { opacity: 1; }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.05); }
        }
        
        @keyframes drift {
          0%, 100% { transform: translateX(0px) translateY(0px); }
          25% { transform: translateX(5px) translateY(-3px); }
          50% { transform: translateX(-3px) translateY(5px); }
          75% { transform: translateX(-5px) translateY(-2px); }
        }
      `}</style>
    </div>
  )
}
