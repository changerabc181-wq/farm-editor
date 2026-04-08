import React, { useState, useEffect } from "react";
import { Save, Download, Sparkles, ChevronRight, Package } from "lucide-react";
import { MapData } from "../types";
import JSZip from "jszip";
import { saveAs } from "file-saver";

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
  const [isDownloadingResources, setIsDownloadingResources] = useState(false);
  const [availableObjects, setAvailableObjects] = useState<{id: string, name: string, color: string, imageUrl?: string}[]>([
    { id: "tree", name: "Tree", color: "bg-emerald-500" },
    { id: "rock", name: "Rock", color: "bg-zinc-500" },
    { id: "bush", name: "Bush", color: "bg-red-500" },
  ]);
  const [availableTiles, setAvailableTiles] = useState<{id: number, name: string, imageUrl: string, bgPosition: string, pixelRect?: any, imageSize?: any}[]>([]);

  useEffect(() => {
    // Load resource sitemap from GitHub
    fetch("/api/github/data/resource_sitemap")
      .then(res => res.json())
      .then(sitemap => {
        if (!sitemap || sitemap.error) return;

        // 1. Load Map Data
        const mapData = sitemap.maps?.[0];
        const objectLayout = sitemap.object_layouts?.[0];
        
        if (mapData) {
          const newTiles = Array(600).fill(0);
          if (mapData.tile_usages) {
            mapData.tile_usages.forEach((usage: any) => {
              usage.positions.forEach((pos: any) => {
                const index = pos.grid.y * 30 + pos.grid.x;
                if (index >= 0 && index < 600) {
                  newTiles[index] = usage.tile_id;
                }
              });
            });
          }

          const newObjects: any[] = [];
          if (objectLayout && objectLayout.objects) {
            objectLayout.objects.forEach((obj: any) => {
              newObjects.push({
                x: obj.position?.grid?.x || 0,
                y: obj.position?.grid?.y || 0,
                type: obj.scene_key || "unknown",
                raw: obj
              });
            });
          }

          setMap(prev => ({
            ...prev,
            tiles: newTiles,
            objects: newObjects
          }));
        }

        const convertResToUrl = (resPath: string) => {
          if (!resPath) return undefined;
          if (resPath.startsWith("http")) return resPath;
          if (!resPath.startsWith("res://")) return undefined;
          return `https://raw.githubusercontent.com/changerabc181-wq/farm/main/${resPath.replace("res://", "")}`;
        };

        // 2. Load Available Tiles from tilesets
        if (sitemap.tilesets && sitemap.tilesets.length > 0) {
          const tileset = sitemap.tilesets[0];
          const tilesetUrl = convertResToUrl(tileset.godot_path);
          if (tilesetUrl && tileset.elements) {
            const newTiles = tileset.elements.map((el: any) => {
              // Calculate background position based on pixel_rect
              // The image is 1024x1024, tiles are 16x16
              // But in our UI we might render them at a different size, so we use percentages or exact pixels if we set background-size
              // If we set background-size to the full image size relative to the container, it's easier to use exact pixels
              // Actually, if the container is 24x24 (w-6 h-6), and the tile is 16x16, the scale is 1.5
              // So background-size should be 1024 * 1.5 = 1536px
              // And background-position should be -x * 1.5, -y * 1.5
              // Let's just store the raw x, y and calculate in the render
              return {
                id: el.tile_id,
                name: el.name,
                imageUrl: tilesetUrl,
                bgPosition: `-${el.pixel_rect.x}px -${el.pixel_rect.y}px`,
                pixelRect: el.pixel_rect,
                imageSize: tileset.image
              };
            });
            setAvailableTiles(newTiles);
          }
        } else {
          // Fallback
          setAvailableTiles([
            { id: 0, name: "Grass", imageUrl: "", bgPosition: "0 0", pixelRect: {x:0, y:0, width:16, height:16}, imageSize: {width:16, height:16} },
            { id: 1, name: "Dirt", imageUrl: "", bgPosition: "0 0", pixelRect: {x:0, y:0, width:16, height:16}, imageSize: {width:16, height:16} },
            { id: 2, name: "Water", imageUrl: "", bgPosition: "0 0", pixelRect: {x:0, y:0, width:16, height:16}, imageSize: {width:16, height:16} },
          ]);
        }

        // 3. Load Available Objects from bindings
        const newObjects: {id: string, name: string, color: string, imageUrl?: string}[] = [
          { id: "tree", name: "Tree", color: "bg-emerald-500" },
          { id: "rock", name: "Rock", color: "bg-zinc-500" },
          { id: "bush", name: "Bush", color: "bg-red-500" },
        ];

        if (sitemap.bindings) {
          // Process crops
          if (Array.isArray(sitemap.bindings.crops)) {
            sitemap.bindings.crops.forEach((crop: any) => {
              let imageUrl = undefined;
              if (crop.stage_sprites && crop.stage_sprites.length > 0) {
                imageUrl = convertResToUrl(crop.stage_sprites[crop.stage_sprites.length - 1].path?.godot_path);
              }
              newObjects.push({ id: crop.id, name: crop.name || crop.id, color: "bg-green-400", imageUrl });
            });
          }
          
          // Process items
          if (Array.isArray(sitemap.bindings.items)) {
            sitemap.bindings.items.forEach((item: any) => {
              let imageUrl = undefined;
              if (item.icon?.godot_path) {
                imageUrl = convertResToUrl(item.icon.godot_path);
              }
              newObjects.push({ id: item.id, name: item.name || item.id, color: "bg-blue-400", imageUrl });
            });
          }
          
          // Process NPCs
          if (Array.isArray(sitemap.bindings.npcs)) {
            sitemap.bindings.npcs.forEach((npc: any) => {
              let imageUrl = undefined;
              if (npc.portrait?.godot_path) {
                imageUrl = convertResToUrl(npc.portrait.godot_path);
              } else if (npc.sprite?.godot_path) {
                imageUrl = convertResToUrl(npc.sprite.godot_path);
              }
              newObjects.push({ id: npc.id, name: npc.name || npc.id, color: "bg-purple-400", imageUrl });
            });
          }
        }

        const uniqueObjects = Array.from(new Map(newObjects.map(item => [item.id, item])).values());
        setAvailableObjects(uniqueObjects);
      })
      .catch(err => console.error("Failed to load sitemap from GitHub", err));
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

  const handleExport = () => {
    const exportData = {
      grid_size: 32,
      objects: map.objects.map(obj => {
        // Try to preserve raw properties if they exist
        const raw = obj.raw || {};
        return {
          kind: raw.kind || "scene",
          name: raw.name || obj.type,
          scene_key: obj.type,
          position: {
            x: obj.x * 32,
            y: obj.y * 32
          },
          properties: raw.properties || {}
        };
      })
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "farm_layout.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadResources = async () => {
    setIsDownloadingResources(true);
    try {
      const res = await fetch("/api/github/data/resource_sitemap");
      const sitemap = await res.json();
      if (!sitemap || !sitemap.assets || !sitemap.assets.inventory) {
        throw new Error("Invalid sitemap data");
      }

      const zip = new JSZip();
      const images = sitemap.assets.inventory.filter((asset: any) => asset.path.endsWith(".png"));
      
      // Download images in batches to avoid overwhelming the browser/network
      const batchSize = 10;
      for (let i = 0; i < images.length; i += batchSize) {
        const batch = images.slice(i, i + batchSize);
        await Promise.all(batch.map(async (asset: any) => {
          try {
            const imgRes = await fetch(`https://raw.githubusercontent.com/changerabc181-wq/farm/main/${asset.path}`);
            if (imgRes.ok) {
              const blob = await imgRes.blob();
              zip.file(asset.path, blob);
            }
          } catch (err) {
            console.error(`Failed to download ${asset.path}`, err);
          }
        }));
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "farm_resources.zip");
    } catch (err) {
      console.error("Failed to download resources", err);
      alert("Failed to download resources. Check console for details.");
    } finally {
      setIsDownloadingResources(false);
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
          <button 
            onClick={handleDownloadResources}
            disabled={isDownloadingResources}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            <Package size={18} /> {isDownloadingResources ? "Downloading..." : "Resources"}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors">
            <Save size={18} /> Save
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
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
              const tileData = availableTiles.find(t => t.id === tile);
              
              return (
                <div
                  key={i}
                  onClick={() => handleCellClick(i)}
                  className="w-6 h-6 cursor-pointer transition-all relative flex items-center justify-center hover:brightness-125"
                  style={tileData?.imageUrl ? {
                    backgroundImage: `url(${tileData.imageUrl})`,
                    backgroundPosition: tileData.pixelRect ? `${(tileData.pixelRect.x / 16) / (64 - 1) * 100}% ${(tileData.pixelRect.y / 16) / (64 - 1) * 100}%` : '0% 0%',
                    backgroundSize: '6400% 6400%',
                    imageRendering: 'pixelated'
                  } : {
                    backgroundColor: tile === 0 ? "rgba(6, 78, 59, 0.3)" : tile === 1 ? "rgba(120, 53, 15, 0.5)" : "rgba(12, 74, 110, 0.5)"
                  }}
                >
                  {obj && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      {(() => {
                        const availableObj = availableObjects.find(a => a.id === obj.type);
                        if (availableObj?.imageUrl) {
                          return <img src={availableObj.imageUrl} alt={obj.type} className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />;
                        }
                        return (
                          <div 
                            className={`w-4 h-4 rounded-sm ${availableObj?.color || "bg-purple-500"}`} 
                            title={obj.type}
                          />
                        );
                      })()}
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
              <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                {availableTiles.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTile(t.id)}
                    className={`flex flex-col items-center gap-2 p-2 rounded-xl border transition-all ${
                      selectedTile === t.id ? "border-orange-500 bg-orange-500/10" : "border-zinc-800 hover:border-zinc-700"
                    }`}
                    title={t.name}
                  >
                    <div 
                      className="w-full aspect-square rounded-lg" 
                      style={t.imageUrl ? {
                        backgroundImage: `url(${t.imageUrl})`,
                        backgroundPosition: t.pixelRect ? `${(t.pixelRect.x / 16) / (64 - 1) * 100}% ${(t.pixelRect.y / 16) / (64 - 1) * 100}%` : '0% 0%',
                        backgroundSize: '6400% 6400%',
                        imageRendering: 'pixelated'
                      } : {
                        backgroundColor: t.id === 0 ? "rgba(6, 78, 59, 1)" : t.id === 1 ? "rgba(120, 53, 15, 1)" : "rgba(12, 74, 110, 1)"
                      }}
                    />
                    <span className="text-[10px] font-medium text-zinc-400 truncate w-full text-center">{t.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                {availableObjects.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedObject(t.id)}
                    className={`flex flex-col items-center gap-2 p-2 rounded-xl border transition-all ${
                      selectedObject === t.id ? "border-orange-500 bg-orange-500/10" : "border-zinc-800 hover:border-zinc-700"
                    }`}
                    title={t.name}
                  >
                    <div className={`w-full aspect-square rounded-lg ${t.imageUrl ? 'bg-zinc-800/50' : t.color} flex items-center justify-center overflow-hidden`}>
                      {t.imageUrl ? (
                        <img src={t.imageUrl} alt={t.name} className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        t.id === "tree" ? <div className="w-4 h-4 bg-white/20 rounded-full" /> : null
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-zinc-400 truncate w-full text-center">{t.name}</span>
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
