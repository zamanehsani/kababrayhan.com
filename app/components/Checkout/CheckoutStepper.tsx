import React from "react";

interface CheckoutStepperProps {
  currentStep: 1 | 2 | 3;
}

const CheckoutStepper: React.FC<CheckoutStepperProps> = ({ currentStep }) => {
  const steps = ["My Order", "Address", "Payment"];

  return (
    <div className="mx-auto mb-16 w-full max-w-xl px-4">
      <div className="relative flex items-center justify-between">
        {/* Progress Bar Background */}
        <div className="absolute top-1/2 left-0 h-[2px] w-full -translate-y-1/2 bg-stone-100" />
        
        {/* Active Progress Line */}
        <div 
          className="absolute top-1/2 left-0 h-[2px] bg-red-600 transition-all duration-700 ease-in-out" 
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((label, index) => {
          const stepNum = index + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;

          return (
            <div key={label} className="relative z-10 flex flex-col items-center">
              {/* Circle Indicator */}
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                  isActive 
                    ? "border-red-600 bg-white shadow-[0_0_15px_rgba(220,38,38,0.2)]" 
                    : isCompleted 
                      ? "border-red-600 bg-red-600" 
                      : "border-stone-200 bg-white"
                }`}
              >
                {isCompleted ? (
                  // Checkmark for completed steps
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-white">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                ) : (
                  // Number for active/pending steps
                  <span className={`text-xs font-black ${isActive ? "text-red-600" : "text-stone-400"}`}>
                    {stepNum}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`absolute -bottom-8 whitespace-nowrap text-[10px] font-black tracking-[0.2em] transition-colors duration-300 ${
                  isActive ? "text-stone-900" : "text-stone-400"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CheckoutStepper;