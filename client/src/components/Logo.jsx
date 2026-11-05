import React from 'react';

export function Logo({ className = "w-7 h-7", textClassName = "text-xl font-bold" }) {
  return (
    <div className="flex items-center gap-2.5 cursor-pointer select-none">
      <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-tr from-nexora-accent via-nexora-violet to-nexora-cyan p-[1.5px] shadow-lg shadow-nexora-accent/20 ${className}`}>
        <div className="w-full h-full bg-nexora-darkest rounded-[10px] flex items-center justify-center">
          <span className="font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300">
            N
          </span>
        </div>
      </div>
      <div className="flex flex-col leading-none">
        <span className={`tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400 ${textClassName}`}>
          NEXORA<span className="text-nexora-cyan ml-1 font-mono text-xs px-1.5 py-0.5 rounded bg-nexora-cyan/10 border border-nexora-cyan/20">AI</span>
        </span>
      </div>
    </div>
  );
}
