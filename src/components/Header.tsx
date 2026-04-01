import React from "react";
import { Search } from "lucide-react";

export const Header: React.FC = () => {
  return (
    <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-8 bg-black/50 backdrop-blur-xl sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input 
            type="text" 
            placeholder="Search projects..." 
            className="bg-zinc-900 border border-zinc-800 rounded-full pl-10 pr-4 py-1.5 text-sm focus:outline-none focus:border-orange-500 transition-colors w-64 text-white"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-full border border-zinc-800">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-zinc-400">Cloud Sync Active</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" />
        </div>
      </div>
    </header>
  );
};
