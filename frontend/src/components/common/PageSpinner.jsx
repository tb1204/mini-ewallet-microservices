import React from 'react';

export default function PageSpinner({ message = 'Đang tải dữ liệu...' }) {
  return (
    <div className="flex-1 min-h-[50vh] flex flex-col items-center justify-center gap-4 animate-in fade-in duration-200">
      <div className="relative flex items-center justify-center">
        {/* Subtle background glow */}
        <div className="absolute w-16 h-16 rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 blur-xl animate-pulse" />
        
        {/* Outer Circular Spinner */}
        <div className="w-12 h-12 rounded-full border-[3px] border-emerald-500/20 border-t-emerald-500 border-r-emerald-500 animate-spin" />
        
        {/* Inner Counter-spinning ring */}
        <div 
          className="absolute w-6 h-6 rounded-full border-2 border-indigo-500/20 border-b-indigo-500 animate-spin"
          style={{ animationDirection: 'reverse', animationDuration: '0.25s' }}
        />
      </div>

      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-text-primary tracking-wide">
          {message}
        </p>
        <p className="text-xs text-text-secondary">
          Vui lòng đợi trong giây lát
        </p>
      </div>
    </div>
  );
}

