import React, { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { Dashboard } from "./pages/Dashboard";
import { MapEditor } from "./pages/MapEditor";
import { ResourceEditor } from "./pages/ResourceEditor";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-orange-500/30">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="pl-64 min-h-screen flex flex-col">
        <Header />

        <div className="flex-1 p-8 h-[calc(100vh-64px)] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeTab === "dashboard" && <Dashboard />}
              {activeTab === "map" && <MapEditor />}
              {activeTab === "resource" && <ResourceEditor />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
