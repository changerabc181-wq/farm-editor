import React from "react";
import { Layout, Map as MapIcon, Package, Settings } from "lucide-react";

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      active 
        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" 
        : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-zinc-950 border-r border-zinc-800 p-6 flex flex-col gap-8 z-20">
      <div className="flex items-center gap-3 px-2">
        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
          <Layout size={24} />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight">Pastoral</h1>
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">Editor</p>
        </div>
      </div>

      <nav className="flex flex-col gap-2">
        <SidebarItem 
          icon={Layout} 
          label="Dashboard" 
          active={activeTab === "dashboard"} 
          onClick={() => setActiveTab("dashboard")} 
        />
        <SidebarItem 
          icon={MapIcon} 
          label="Map Editor" 
          active={activeTab === "map"} 
          onClick={() => setActiveTab("map")} 
        />
        <SidebarItem 
          icon={Package} 
          label="Resource Editor" 
          active={activeTab === "resource"} 
          onClick={() => setActiveTab("resource")} 
        />
      </nav>

      <div className="mt-auto pt-6 border-t border-zinc-800">
        <SidebarItem icon={Settings} label="Settings" />
      </div>
    </aside>
  );
};
