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

  useEffect(() => {
    fetch("/api/catalog/object-types")
      .then(res => res.json())
      .then(data => {
        setTypes(data);
        if (data.length > 0) setSelectedType(data[0]);
      });
  }, []);

  useEffect(() => {
    if (selectedType) {
      fetch(`/api/github/data/${selectedType.file}`)
        .then(res => res.json())
        .then(data => {
          // Handle both array and object formats
          if (Array.isArray(data)) {
            setResources(data.map((item, i) => ({ id: item.id || item.name || `item_${i}`, ...item })));
          } else if (typeof data === "object" && data !== null) {
            const arr = Object.entries(data).map(([key, value]: [string, any]) => ({
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
      if (data.url) {
        setSpriteUrl(data.url);
        if (selectedResource) {
          handleFieldChange("sprite", data.url);
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
  };

  const renderFieldInput = (key: string, value: any) => {
    if (key === "id") return null; // Don't edit ID directly here
    
    if (typeof value === "boolean") {
      return (
        <select 
          value={value ? "true" : "false"}
          onChange={(e) => handleFieldChange(key, e.target.value === "true")}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
        >
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      );
    }
    
    if (typeof value === "number") {
      return (
        <input
          type="number"
          value={value}
          onChange={(e) => handleFieldChange(key, parseFloat(e.target.value))}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
        />
      );
    }
    
    if (typeof value === "object" && value !== null) {
      return (
        <textarea
          value={JSON.stringify(value, null, 2)}
          onChange={(e) => {
            try {
              handleFieldChange(key, JSON.parse(e.target.value));
            } catch (err) {
              // Invalid JSON, ignore for now or show error
            }
          }}
          className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-orange-500 transition-colors resize-y"
        />
      );
    }
    
    return (
      <input
        type="text"
        value={value || ""}
        onChange={(e) => handleFieldChange(key, e.target.value)}
        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
      />
    );
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

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[300px_1fr_320px] gap-6 overflow-hidden">
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
                onClick={() => { setSelectedResource(r); setSpriteUrl(r.sprite || null); }}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center justify-between group ${
                  selectedResource?.id === r.id 
                    ? "bg-orange-500/10 text-orange-500 font-medium" 
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <span className="truncate pr-4">{r.name || r.id}</span>
                <Trash2 size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${selectedResource?.id === r.id ? "text-orange-500 hover:text-orange-400" : "text-zinc-500 hover:text-red-400"}`} />
              </button>
            ))}
            {resources.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-zinc-600 text-sm">
                No resources found.
              </div>
            )}
          </div>
        </div>

        {/* Editor Area */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 overflow-y-auto flex flex-col gap-6">
          {selectedResource ? (
            <>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center text-orange-500">
                    <ImageIcon size={16} />
                  </div>
                  {selectedResource.name || selectedResource.id}
                </h3>
                <span className="text-xs font-mono text-zinc-500 bg-zinc-950 px-2 py-1 rounded-md border border-zinc-800">
                  ID: {selectedResource.id}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {Object.entries(selectedResource).map(([key, value]) => {
                  if (key === "id" || key === "sprite") return null;
                  return (
                    <div key={key} className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                        {key.replace(/_/g, " ")}
                      </label>
                      {renderFieldInput(key, value)}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-4">
              <div className="w-16 h-16 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-center">
                <Package size={32} className="text-zinc-700" />
              </div>
              <p>Select a resource to edit its properties.</p>
            </div>
          )}
        </div>

        {/* Asset Generator */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 flex flex-col gap-6 overflow-y-auto">
          <div className="flex items-center gap-2 text-white border-b border-zinc-800 pb-4">
            <ImageIcon size={18} className="text-orange-500" />
            <h3 className="font-bold">Sprite Asset</h3>
          </div>
          
          <div className="aspect-square bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center gap-3 relative overflow-hidden group">
            {spriteUrl ? (
              <>
                <img src={spriteUrl} alt="Sprite" className="w-full h-full object-contain p-4 pixelated" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 text-white transition-colors">
                    <Upload size={16} />
                  </button>
                  <button onClick={() => setSpriteUrl(null)} className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-600">
                  <Upload size={20} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-zinc-400">Upload Sprite</p>
                  <p className="text-xs text-zinc-600 mt-1">PNG or GIF up to 2MB</p>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col gap-4 relative">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-purple-500/10 blur-2xl rounded-full pointer-events-none" />
            <div className="flex items-center gap-2 text-purple-400">
              <Sparkles size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">AI Generator</span>
            </div>
            <textarea
              value={spritePrompt}
              onChange={(e) => setSpritePrompt(e.target.value)}
              placeholder="Describe the sprite you want to generate (e.g., 'A shiny red apple, pixel art style, 32x32')"
              className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-purple-500 transition-colors resize-none"
            />
            <button
              onClick={handleGenerateSprite}
              disabled={isGeneratingSprite || !spritePrompt}
              className="w-full py-2.5 bg-purple-500 text-white rounded-xl font-bold text-sm hover:bg-purple-600 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20"
            >
              {isGeneratingSprite ? "Generating..." : "Generate Sprite"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
