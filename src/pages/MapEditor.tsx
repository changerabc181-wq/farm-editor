import React, { useState, useEffect } from "react";
import { Save, Download, Sparkles, ChevronRight } from "lucide-react";
import { MapData } from "../types";

export const MapEditor: React.FC = () => {
  const [map, setMap] = useState<MapData>({
    id: "1",
    name: "New Farm",
    tiles: Array(600).fill(0),
    objects: []
  });
  const [selectedTool, setSelectedTool] = useState<"tile" | "object">("tile");
  const [selectedTile, setSelectedTile] = useState(1);
  const [selectedObject, setSelectedObject] = useState("tree");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);

  useEffect(() => {
    // Load existing map from GitHub
    fetch("/api/github/data/farm_layout")
      .then(res => res.json())
      .then(data => {
        if (data && data.objects) {
          // Adapt the GitHub data to our editor format
          // The GitHub data has objects with position {x, y} and size {x, y}
          // We'll just load them into our objects array for visualization
          setMap(prev => ({
            ...prev,
            objects: data.objects.map((o: any) => ({
              x: Math.floor(o.position.x / (data.grid_size || 32)),
              y: Math.floor(o.position.y / (data.grid_size || 32)),
              type: o.name || "unknown",
              raw: o
            }))
          }));
        }
      })
      .catch(err => console.error("Failed to load map from GitHub", err));
  }, []);

  const generateMap = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/maps/assist/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      setMap({ ...map, tiles: data.tiles, objects: data.objects || [] });
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const polishMap = async () => {
    setIsPolishing(true);
    try {
      const res = await fetch("/api/maps/assist/polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ map })
      });
      const data = await res.json();
      setMap({ ...map, tiles: data.tiles, objects: data.objects || [] });
    } catch (err) {
      console.error(err);
    } finally {
      setIsPolishing(false);
    }
  };

  const handleCellClick = (i: number) => {
    const x = i % 30;
    const y = Math.floor(i / 30);
    
    if (selectedTool === "tile") {
      const newTiles = [...map.tiles];
      newTiles[i] = selectedTile;
      setMap({ ...map, tiles: newTiles });
    } else {
      const existing = map.objects.find(o => o.x === x && o.y === y);
      if (existing) {
        setMap({ ...map, objects: map.objects.filter(o => o !== existing) });
      } else {
        setMap({ ...map, objects: [...map.objects, { x, y, type: selectedObject }] });
      }
    }
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-white">Map Editor</h2>
          <div className="flex items-center gap-2 text-zinc-500 text-sm">
            <span>Summer Farm 1</span>
            <ChevronRight size={14} />
            <span>Main Layout</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors">
            <Save size={18} /> Save
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 overflow-hidden">
        {/* Canvas Area */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8 overflow-auto flex items-center justify-center relative group">
          <div 
            className="grid grid-cols-[repeat(30,24px)] grid-rows-[repeat(20,24px)] gap-px bg-zinc-800 border border-zinc-800 shadow-2xl"
            style={{ width: "fit-content" }}
          >
            {map.tiles.map((tile, i) => {
              const x = i % 30;
              const y = Math.floor(i / 30);
              const obj = map.objects.find(o => o.x === x && o.y === y);
              
              return (
                <div
                  key={i}
                  onClick={() => handleCellClick(i)}
                  className={`w-6 h-6 cursor-pointer transition-all relative flex items-center justify-center ${
                    tile === 0 ? "bg-emerald-900/30" : 
                    tile === 1 ? "bg-amber-900/50" : 
                    "bg-sky-900/50"
                  } hover:brightness-125`}
                >
                  {obj && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      {obj.type === "tree" ? <div className="w-4 h-4 bg-emerald-500 rounded-full" /> : 
                       obj.type === "rock" ? <div className="w-3 h-3 bg-zinc-500 rounded-sm" /> :
                       <div className="w-3 h-3 bg-red-500 rotate-45" title={obj.type} />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="absolute bottom-6 right-6 flex gap-2">
            <button className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center hover:bg-zinc-700 text-white">+</button>
            <button className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center hover:bg-zinc-700 text-white">-</button>
          </div>
        </div>

        {/* Tools Panel */}
        <div className="flex flex-col gap-6 overflow-auto pr-2">
          {/* Tool Switcher */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-1 flex gap-1">
            <button
              onClick={() => setSelectedTool("tile")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedTool === "tile" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Tiles
            </button>
            <button
              onClick={() => setSelectedTool("object")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedTool === "object" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Objects
            </button>
          </div>

          {/* Palette */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Palette</h3>
            {selectedTool === "tile" ? (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 0, name: "Grass", color: "bg-emerald-600" },
                  { id: 1, name: "Dirt", color: "bg-amber-700" },
                  { id: 2, name: "Water", color: "bg-sky-600" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTile(t.id)}
                    className={`flex flex-col items-center gap-2 p-2 rounded-xl border transition-all ${
                      selectedTile === t.id ? "border-orange-500 bg-orange-500/10" : "border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className={`w-full aspect-square rounded-lg ${t.color}`} />
                    <span className="text-[10px] font-medium text-zinc-400">{t.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "tree", name: "Tree", color: "bg-emerald-500" },
                  { id: "rock", name: "Rock", color: "bg-zinc-500" },
                  { id: "bush", name: "Bush", color: "bg-red-500" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedObject(t.id)}
                    className={`flex flex-col items-center gap-2 p-2 rounded-xl border transition-all ${
                      selectedObject === t.id ? "border-orange-500 bg-orange-500/10" : "border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className={`w-full aspect-square rounded-lg ${t.color} flex items-center justify-center`}>
                      {t.id === "tree" ? <div className="w-4 h-4 bg-white/20 rounded-full" /> : null}
                    </div>
                    <span className="text-[10px] font-medium text-zinc-400">{t.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AI Assistant */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 blur-3xl rounded-full" />
            <div className="flex items-center gap-2 text-orange-500 relative">
              <Sparkles size={18} />
              <h3 className="text-xs font-bold uppercase tracking-widest">AI Assistant</h3>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe a map layout..."
              className="w-full h-28 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-orange-500 transition-colors resize-none"
            />
            <div className="flex flex-col gap-2">
              <button
                onClick={generateMap}
                disabled={isGenerating || isPolishing}
                className="w-full py-2.5 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 transition-all disabled:opacity-50 shadow-lg shadow-orange-500/10"
              >
                {isGenerating ? "Generating..." : "Generate Layout"}
              </button>
              <button
                onClick={polishMap}
                disabled={isGenerating || isPolishing}
                className="w-full py-2.5 bg-zinc-800 text-white rounded-xl font-bold text-sm hover:bg-zinc-700 transition-all disabled:opacity-50 border border-zinc-700"
              >
                {isPolishing ? "Polishing..." : "Polish with AI"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
