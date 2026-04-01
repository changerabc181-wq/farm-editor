import React from "react";
import { Map as MapIcon, Package, Sparkles, ChevronRight, Plus, Image as ImageIcon } from "lucide-react";

export const Dashboard: React.FC = () => {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-white">Welcome back, Felix</h2>
        <p className="text-zinc-500">Manage your farm projects and resources from here.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Maps", value: "12", icon: MapIcon, color: "text-blue-500" },
          { label: "Resources", value: "148", icon: Package, color: "text-orange-500" },
          { label: "AI Generations", value: "1,204", icon: Sparkles, color: "text-purple-500" },
        ].map((stat) => (
          <div key={stat.label} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-zinc-500 text-sm font-medium">{stat.label}</span>
              <span className="text-3xl font-bold text-white">{stat.value}</span>
            </div>
            <div className={`p-3 rounded-xl bg-zinc-950 border border-zinc-800 ${stat.color}`}>
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-bold text-white">Recent Projects</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="group bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-orange-500/50 transition-all cursor-pointer">
              <div className="aspect-video bg-zinc-950 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <span className="text-xs font-medium text-white flex items-center gap-1">
                    Open Project <ChevronRight size={14} />
                  </span>
                </div>
                <div className="w-full h-full flex items-center justify-center text-zinc-800">
                  <ImageIcon size={48} />
                </div>
              </div>
              <div className="p-4 flex flex-col gap-1">
                <h4 className="font-bold text-white">Summer Farm {i}</h4>
                <p className="text-xs text-zinc-500">Last edited 2 hours ago</p>
              </div>
            </div>
          ))}
          <button className="border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-3 text-zinc-500 hover:text-orange-500 hover:border-orange-500/50 transition-all">
            <Plus size={32} />
            <span className="font-medium">New Project</span>
          </button>
        </div>
      </div>
    </div>
  );
};
