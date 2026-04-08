import React, { useState, useEffect } from "react";
import { Save, Plus, Trash2, Sparkles, Upload, Image as ImageIcon, Search, Package } from "lucide-react";
import { ResourceType, Resource } from "../types";

export const ResourceEditor: React.FC = () => {
  const [types, setTypes] = useState<ResourceType[]>([]);
  const [selectedType, setSelectedType] = useState<ResourceType | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  
  const [spritePrompt, setSpritePrompt] = useState("");
  const [isGeneratingSprite, setIsGeneratingSprite] = useState(false);
  const [spriteUrl, setSpriteUrl] = useState<string | null>(null);
  const [repoImages, setRepoImages] = useState<string[]>([]);
  
  const [animFrame, setAnimFrame] = useState(0);
  const [spriteUrls, setSpriteUrls] = useState<string[]>([]);

  const getAllResourceImageUrls = (r: any): string[] => {
    let paths: any[] = [];
    if (r.stages_sprites && Array.isArray(r.stages_sprites)) {
      paths = r.stages_sprites;
    } else if (r.stage_sprites && Array.isArray(r.stage_sprites)) {
      paths = r.stage_sprites;
    } else if (r.sprite) {
      paths = [r.sprite];
    } else if (r.icon) {
      paths = [r.icon];
    } else if (r.portrait) {
      paths = [r.portrait];
    }

    return paths.map(p => {
      let resPath = p.path?.godot_path || p.godot_path || p;
      if (!resPath || typeof resPath !== 'string') return null;
      if (resPath.startsWith("http")) return resPath;
      if (resPath.startsWith("res://")) {
        return `https://raw.githubusercontent.com/changerabc181-wq/farm/main/${resPath.replace("res://", "")}`;
      }
      return resPath;
    }).filter(Boolean) as string[];
  };

  const getResourceImageUrl = (r: any) => {
    let resPath = null;
    if (r.stages_sprites && r.stages_sprites.length > 0) {
      const lastStage = r.stages_sprites[r.stages_sprites.length - 1];
      resPath = lastStage.path?.godot_path || lastStage.godot_path || lastStage;
    } else if (r.stage_sprites && r.stage_sprites.length > 0) {
      const lastStage = r.stage_sprites[r.stage_sprites.length - 1];
      resPath = lastStage.path?.godot_path || lastStage.godot_path || lastStage;
    } else if (r.sprite) {
      resPath = r.sprite.godot_path || r.sprite;
    } else if (r.icon) {
      resPath = r.icon.godot_path || r.icon;
    } else if (r.portrait) {
      resPath = r.portrait.godot_path || r.portrait;
    }
    
    if (!resPath) return null;
    if (typeof resPath !== 'string') return null;
    if (resPath.startsWith("http")) return resPath;
    if (resPath.startsWith("res://")) {
      return `https://raw.githubusercontent.com/changerabc181-wq/farm/main/${resPath.replace("res://", "")}`;
    }
    return resPath;
  };

  useEffect(() => {
    fetch("/api/catalog/object-types")
      .then(res => res.json())
      .then(data => {
        setTypes(data);
        if (data.length > 0) setSelectedType(data[0]);
      });
      
    fetch("/api/github/data/resource_sitemap")
      .then(res => res.json())
      .then(data => {
        if (data && data.assets && data.assets.inventory) {
          const images = data.assets.inventory
            .filter((asset: any) => asset.path.endsWith(".png"))
            .map((asset: any) => `https://raw.githubusercontent.com/changerabc181-wq/farm/main/${asset.path}`);
          setRepoImages(images);
        }
      })
      .catch(err => console.error("Failed to fetch repo images", err));
  }, []);

  useEffect(() => {
    if (selectedType) {
      fetch(`/api/github/data/${selectedType.file}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            console.error("API returned error:", data.error);
            setResources([]);
            setSelectedResource(null);
            return;
          }
          // Handle both array and object formats
          let parsedData = data;
          if (!Array.isArray(data) && typeof data === "object" && data !== null) {
            if (Array.isArray(data[selectedType.file])) {
              parsedData = data[selectedType.file];
            } else {
              const keys = Object.keys(data);
              if (keys.length === 1 && Array.isArray(data[keys[0]])) {
                parsedData = data[keys[0]];
              }
            }
          }

          if (Array.isArray(parsedData)) {
            setResources(parsedData.map((item, i) => ({ id: item.id || item.name || `item_${i}`, ...item })));
          } else if (typeof parsedData === "object" && parsedData !== null) {
            const arr = Object.entries(parsedData).map(([key, value]: [string, any]) => ({
              id: key,
              ...value
            }));
            setResources(arr);
          } else {
            setResources([]);
          }
          setSelectedResource(null);
        })
        .catch(err => {
          console.error("Failed to fetch resource data", err);
          setResources([]);
        });
    }
  }, [selectedType]);

  useEffect(() => {
    if (selectedResource) {
      const urls = getAllResourceImageUrls(selectedResource);
      setSpriteUrls(urls);
      setAnimFrame(0);
    } else {
      setSpriteUrls([]);
    }
  }, [selectedResource]);

  useEffect(() => {
    if (spriteUrls.length > 1) {
      const interval = setInterval(() => {
        setAnimFrame(f => (f + 1) % spriteUrls.length);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [spriteUrls]);

  const handleGenerateSprite = async () => {
    if (!spritePrompt || !selectedType) return;
    setIsGeneratingSprite(true);
    try {
      const res = await fetch("/api/assets/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: spritePrompt, type: selectedType.id })
      });
      const data = await res.json();
      if (data.imageUrl) {
        setSpriteUrl(data.imageUrl);
        if (selectedResource) {
          handleFieldChange("sprite", data.imageUrl);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingSprite(false);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    if (!selectedResource) return;
    const updated = { ...selectedResource, [field]: value };
    setSelectedResource(updated);
    setResources(resources.map(r => r.id === updated.id ? updated : r));
    
    if (field === 'sprite' || field === 'icon' || field === 'stages_sprites' || field === 'stage_sprites' || field === 'portrait') {
      setSpriteUrl(getResourceImageUrl(updated));
    }
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-white">Resource Editor</h2>
          <p className="text-zinc-500 text-sm">Manage game assets, items, and configurations.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium shadow-lg shadow-orange-500/20">
          <Save size={18} /> Save Changes
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {types.map(t => (
          <button
            key={t.id}
            onClick={() => { setSelectedType(t); setSelectedResource(null); }}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedType?.id === t.id 
                ? "bg-white text-black shadow-md" 
                : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800"
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[250px_1fr_300px] gap-6 overflow-hidden">
        {/* Resource List */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-zinc-800 flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input 
                type="text" 
                placeholder="Search resources..." 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <button className="w-full flex items-center justify-center gap-2 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors text-sm font-medium border border-zinc-700">
              <Plus size={16} /> New {selectedType?.name.slice(0, -1)}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
            {resources.map(r => (
              <button
                key={r.id}
                onClick={() => { setSelectedResource(r); setSpriteUrl(getResourceImageUrl(r)); }}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center justify-between group ${
                  selectedResource?.id === r.id 
                    ? "bg-orange-500/10 text-orange-500 font-medium" 
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  {getResourceImageUrl(r) ? (
                    <img src={getResourceImageUrl(r)!} alt={r.name || r.id} className="w-6 h-6 object-contain" referrerPolicy="no-referrer" style={{ imageRendering: "pixelated" }} />
                  ) : (
                    <div className="w-6 h-6 bg-zinc-800 rounded flex items-center justify-center shrink-0">
                      <ImageIcon size={12} className="text-zinc-600" />
                    </div>
                  )}
                  <span className="truncate pr-4">{r.name || r.id}</span>
                </div>
                <Trash2 size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ${selectedResource?.id === r.id ? "text-orange-500 hover:text-orange-400" : "text-zinc-500 hover:text-red-400"}`} />
              </button>
            ))}
            {resources.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-zinc-600 text-sm">
                No resources found.
              </div>
            )}
          </div>
        </div>

        {/* Editor Area (List of Properties) */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 flex flex-col gap-6 overflow-hidden">
          {selectedResource ? (
            <>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4 shrink-0">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 truncate">
                  <span className="truncate">{selectedResource.name || selectedResource.id}</span>
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-6">
                {/* Current Sprite Preview */}
                <div className="flex flex-col gap-2 shrink-0">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Current Sprite</label>
                  <div className="w-24 h-24 bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-xl flex items-center justify-center relative overflow-hidden group">
                    {(spriteUrls[animFrame] || spriteUrl) ? (
                      <>
                        <img src={spriteUrls[animFrame] || spriteUrl!} alt="Sprite" className="w-full h-full object-contain p-2" style={{ imageRendering: "pixelated" }} referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button onClick={() => { setSpriteUrl(null); setSpriteUrls([]); }} className="p-1.5 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center">
                        <ImageIcon size={20} className="text-zinc-700 mx-auto mb-1" />
                        <span className="text-[10px] text-zinc-600">No Sprite</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Detailed JSON</label>
                  <textarea
                    value={JSON.stringify(selectedResource, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setSelectedResource(parsed);
                        setResources(resources.map(r => r.id === parsed.id ? parsed : r));
                      } catch (err) {
                        // Invalid JSON, ignore for now
                      }
                    }}
                    className="w-full flex-1 min-h-[300px] bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-sm text-white font-mono focus:outline-none focus:border-orange-500 transition-colors resize-none"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-4 text-center">
              <div className="w-12 h-12 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-center">
                <Package size={24} className="text-zinc-700" />
              </div>
              <p className="text-sm">Select a resource to edit its properties.</p>
            </div>
          )}
        </div>

        {/* Existing Sprites Gallery & AI Generator */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 flex flex-col gap-6 overflow-hidden">
          <div className="flex flex-col gap-4 relative shrink-0 border-b border-zinc-800 pb-6">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-purple-500/10 blur-2xl rounded-full pointer-events-none" />
            <div className="flex items-center gap-2 text-purple-400">
              <Sparkles size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">AI Generator</span>
            </div>
            <textarea
              value={spritePrompt}
              onChange={(e) => setSpritePrompt(e.target.value)}
              placeholder="Describe the sprite you want to generate (e.g., 'A shiny red apple, pixel art style, 32x32')"
              className="w-full h-20 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-purple-500 transition-colors resize-none"
            />
            <button 
              onClick={handleGenerateSprite}
              disabled={isGeneratingSprite || !spritePrompt}
              className="w-full flex items-center justify-center gap-2 py-2 bg-purple-500/10 text-purple-400 rounded-xl hover:bg-purple-500/20 transition-colors text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed border border-purple-500/20"
            >
              {isGeneratingSprite ? (
                <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                "Generate with AI"
              )}
            </button>
          </div>

          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-white">
              <ImageIcon size={18} className="text-orange-500" />
              <h3 className="font-bold">Existing Sprites</h3>
            </div>
            <div className="text-xs text-zinc-500">{repoImages.length} images found</div>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {repoImages.map((url, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSpriteUrl(url);
                    if (selectedResource) {
                      const resPath = url.replace("https://raw.githubusercontent.com/changerabc181-wq/farm/main/", "res://");
                      if (selectedResource.stages_sprites && Array.isArray(selectedResource.stages_sprites)) {
                        const newStages = [...selectedResource.stages_sprites];
                        if (newStages.length > 0) {
                          const lastStage = newStages[newStages.length - 1];
                          if (typeof lastStage === 'object' && lastStage !== null) {
                            if (lastStage.path && typeof lastStage.path === 'object') {
                              newStages[newStages.length - 1] = { ...lastStage, path: { ...lastStage.path, godot_path: resPath } };
                            } else {
                              newStages[newStages.length - 1] = { ...lastStage, godot_path: resPath };
                            }
                          } else {
                            newStages[newStages.length - 1] = resPath;
                          }
                        } else {
                          newStages.push(resPath);
                        }
                        handleFieldChange("stages_sprites", newStages);
                      } else if (selectedResource.stage_sprites && Array.isArray(selectedResource.stage_sprites)) {
                        const newStages = [...selectedResource.stage_sprites];
                        if (newStages.length > 0) {
                          const lastStage = newStages[newStages.length - 1];
                          if (typeof lastStage === 'object' && lastStage !== null) {
                            if (lastStage.path && typeof lastStage.path === 'object') {
                              newStages[newStages.length - 1] = { ...lastStage, path: { ...lastStage.path, godot_path: resPath } };
                            } else {
                              newStages[newStages.length - 1] = { ...lastStage, godot_path: resPath };
                            }
                          } else {
                            newStages[newStages.length - 1] = resPath;
                          }
                        } else {
                          newStages.push(resPath);
                        }
                        handleFieldChange("stage_sprites", newStages);
                      } else if (selectedResource.icon !== undefined) {
                        if (typeof selectedResource.icon === 'object' && selectedResource.icon !== null) {
                          handleFieldChange("icon", { ...selectedResource.icon, godot_path: resPath });
                        } else {
                          handleFieldChange("icon", resPath);
                        }
                      } else if (selectedResource.portrait !== undefined) {
                        if (typeof selectedResource.portrait === 'object' && selectedResource.portrait !== null) {
                          handleFieldChange("portrait", { ...selectedResource.portrait, godot_path: resPath });
                        } else {
                          handleFieldChange("portrait", resPath);
                        }
                      } else {
                        if (typeof selectedResource.sprite === 'object' && selectedResource.sprite !== null) {
                          handleFieldChange("sprite", { ...selectedResource.sprite, godot_path: resPath });
                        } else {
                          handleFieldChange("sprite", resPath);
                        }
                      }
                    }
                  }}
                  className={`relative aspect-square rounded-xl border overflow-hidden bg-zinc-950 transition-all group ${
                    spriteUrl === url ? "border-orange-500 ring-2 ring-orange-500/20" : "border-zinc-800 hover:border-zinc-600"
                  }`}
                  title={url.split('/').pop()}
                >
                  <img 
                    src={url} 
                    alt="Sprite" 
                    className="w-full h-full object-contain p-2"
                    style={{ imageRendering: "pixelated" }}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/80 backdrop-blur-sm p-1 translate-y-full group-hover:translate-y-0 transition-transform">
                    <p className="text-[9px] text-zinc-300 truncate text-center">
                      {url.split('/').pop()}
                    </p>
                  </div>
                </button>
              ))}
              {repoImages.length === 0 && (
                <div className="col-span-full py-12 text-center text-zinc-500 text-sm">
                  Loading images from GitHub...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
