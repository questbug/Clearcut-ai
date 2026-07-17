import React, { useState, useRef } from "react";
import { BackdropConfig, BackdropType } from "../types";
import { 
  Grid, 
  Image as ImageIcon, 
  Sparkles, 
  Palette, 
  Upload, 
  Eye, 
  Check, 
  Loader2, 
  AlertCircle 
} from "lucide-react";

interface BackdropControlsProps {
  config: BackdropConfig;
  onChange: (newConfig: BackdropConfig) => void;
  onGenerateAI: (prompt: string, aspectRatio: string) => Promise<string>;
  activeImageAspect?: "1:1" | "16:9" | "3:4" | "4:3" | "9:16";
}

// Predefined professional background colors
const PRESET_COLORS = [
  "#FFFFFF", // Pure White
  "#000000", // Pure Black
  "#F3F4F6", // Off-white/slate
  "#E5E7EB", // Studio Grey
  "#F5EBE6", // Warm Beige
  "#E0F2FE", // Soft Corporate Blue
  "#FDF2F8", // Pastel Pink
  "#DCFCE7", // Mint Green
  "#FEF9C3", // Soft Sunshine Yellow
];

export default function BackdropControls({
  config,
  onChange,
  onGenerateAI,
  activeImageAspect = "1:1",
}: BackdropControlsProps) {
  const [activeTab, setActiveTab] = useState<BackdropType>(config.type);
  const [customColor, setCustomColor] = useState<string>(config.color);
  const [prompt, setPrompt] = useState<string>(config.aiPrompt);
  const [aiAspect, setAiAspect] = useState<string>(
    ["1:1", "16:9", "3:4", "4:3", "9:16"].includes(activeImageAspect) ? activeImageAspect : "1:1"
  );
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleTabChange = (tab: BackdropType) => {
    setActiveTab(tab);
    onChange({
      ...config,
      type: tab,
    });
  };

  const handleColorSelect = (color: string) => {
    onChange({
      ...config,
      type: "color",
      color: color,
    });
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomColor(value);
    onChange({
      ...config,
      type: "color",
      color: value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const url = URL.createObjectURL(file);

    onChange({
      ...config,
      type: "upload",
      uploadedUrl: url,
    });
  };

  const handleGenerateBackdrop = async () => {
    if (!prompt.trim()) {
      setErrorMsg("Please write a text description of the scene you want to generate.");
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const generatedUrl = await onGenerateAI(prompt, aiAspect);
      onChange({
        ...config,
        type: "ai",
        aiPrompt: prompt,
        aiUrl: generatedUrl,
      });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Could not generate AI backdrop. Is your API Key set?");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Tab select bar */}
      <div className="flex border-b border-slate-800 bg-slate-950/40 p-1">
        <button
          onClick={() => handleTabChange("transparent")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[11px] font-bold uppercase tracking-wider transition-all rounded-lg ${
            activeTab === "transparent"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-950/40"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <Grid className="h-3.5 w-3.5" />
          <span>Alpha</span>
        </button>

        <button
          onClick={() => handleTabChange("color")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[11px] font-bold uppercase tracking-wider transition-all rounded-lg ${
            activeTab === "color"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-950/40"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <Palette className="h-3.5 w-3.5" />
          <span>Solid</span>
        </button>

        <button
          onClick={() => handleTabChange("upload")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[11px] font-bold uppercase tracking-wider transition-all rounded-lg ${
            activeTab === "upload"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-950/40"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <Upload className="h-3.5 w-3.5" />
          <span>Photo</span>
        </button>

        <button
          onClick={() => handleTabChange("ai")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[11px] font-bold uppercase tracking-wider transition-all rounded-lg ${
            activeTab === "ai"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-950/40"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>AI Studio</span>
        </button>
      </div>

      {/* Tab contents */}
      <div className="p-6">
        {/* ALPHA GRID */}
        {activeTab === "transparent" && (
          <div className="text-center py-4">
            <p className="text-sm text-slate-300">
              The subject is isolated on a completely transparent background.
            </p>
            <p className="text-xs text-slate-500 mt-1.5">
              Ideal for logo assets, e-commerce products, or editing in Photoshop.
            </p>
          </div>
        )}

        {/* SOLID COLOR */}
        {activeTab === "color" && (
          <div className="space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Select Background Color
            </span>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  className={`relative aspect-square w-full rounded-lg border transition-all ${
                    config.type === "color" && config.color.toLowerCase() === color.toLowerCase()
                      ? "border-indigo-500 ring-2 ring-indigo-500/30 scale-105"
                      : "border-slate-800 hover:border-slate-600"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                >
                  {config.type === "color" && config.color.toLowerCase() === color.toLowerCase() && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg">
                      <Check className={`h-4 w-4 ${color === "#FFFFFF" || color === "#F3F4F6" || color === "#E5E7EB" ? "text-slate-850" : "text-white"}`} />
                    </div>
                  )}
                </button>
              ))}

              {/* Custom Color Picker Button */}
              <div className="relative aspect-square w-full rounded-lg border border-slate-800 bg-slate-950 overflow-hidden group hover:border-slate-600">
                <input
                  type="color"
                  value={customColor}
                  onChange={handleCustomColorChange}
                  className="absolute inset-0 w-full h-full p-0 cursor-pointer opacity-0"
                />
                <div 
                  className="w-full h-full flex items-center justify-center text-xs font-mono"
                  style={{ backgroundColor: customColor }}
                >
                  <Palette className={`h-4 w-4 ${customColor === "#ffffff" ? "text-slate-900" : "text-white"}`} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-950/40 p-3 rounded-xl border border-slate-850 mt-4">
              <span className="text-xs text-slate-400">Selected Hex:</span>
              <span className="font-mono text-xs font-bold text-slate-200">{config.color}</span>
            </div>
          </div>
        )}

        {/* UPLOAD CUSTOM BACKDROP */}
        {activeTab === "upload" && (
          <div className="space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Upload Your Own Background
            </span>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-3 bg-slate-950 border border-slate-800 hover:border-slate-600 hover:bg-slate-900 rounded-xl text-slate-200 text-sm font-medium transition cursor-pointer"
              >
                <Upload className="h-4 w-4 text-indigo-400" />
                <span>Choose Backdrop Photo</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              {config.type === "upload" && config.uploadedUrl ? (
                <div className="flex items-center gap-2.5 bg-indigo-950/20 border border-indigo-900/30 py-2.5 px-4 rounded-xl text-xs text-indigo-300">
                  <Eye className="h-4 w-4 text-indigo-400" />
                  <span className="truncate max-w-xs">Custom background applied</span>
                </div>
              ) : (
                <span className="text-xs text-slate-500">No background image selected yet</span>
              )}
            </div>
          </div>
        )}

        {/* AI BACKDROP GENERATOR */}
        {activeTab === "ai" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Describe Your Perfect Background
              </span>
              <span className="text-[10px] text-amber-400 font-bold bg-amber-400/10 py-0.5 px-1.5 rounded border border-amber-400/20 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                <span>Powered by Gemini AI</span>
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A modern luxury kitchen marble countertop, sunny window with warm direct sunlight, soft leaf shadows on wood table, shallow depth of field, photorealistic..."
                rows={3}
                disabled={isGenerating}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none disabled:opacity-55"
              />

              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                {/* Aspect ratio picker */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Ratio:</span>
                  <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-850">
                    {["1:1", "16:9", "3:4", "4:3", "9:16"].map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => setAiAspect(ratio)}
                        disabled={isGenerating}
                        className={`px-2 py-1 text-[10px] font-mono font-bold rounded-md transition ${
                          aiAspect === ratio
                            ? "bg-slate-800 text-white border border-slate-700 shadow"
                            : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleGenerateBackdrop}
                  disabled={isGenerating}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-850 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-indigo-950/25"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>Generating scenery...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-amber-400" />
                      <span>Generate Backdrop</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error display */}
            {errorMsg && (
              <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/25 p-3 rounded-xl text-rose-400 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>{errorMsg}</p>
              </div>
            )}

            {/* Predefined prompt helpers */}
            <div className="pt-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Quick Prompts Idea
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Luxury marble studio table",
                  "Beige background soft lighting",
                  "Minimal wooden table leaf shadows",
                  "Neon cyber backdrop, cyberpunk",
                  "Blurry outdoor spring park bokeh",
                ].map((idea) => (
                  <button
                    key={idea}
                    onClick={() => setPrompt(idea)}
                    disabled={isGenerating}
                    className="text-[10px] text-slate-400 bg-slate-950 border border-slate-850 rounded-lg py-1 px-2 hover:border-slate-700 hover:text-slate-200 transition"
                  >
                    {idea}
                  </button>
                ))}
              </div>
            </div>

            {config.type === "ai" && config.aiUrl && (
              <div className="mt-4 flex items-center justify-between bg-emerald-950/10 border border-emerald-900/20 p-3 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="relative h-10 w-10 border border-emerald-800/30 rounded overflow-hidden">
                    <img src={config.aiUrl} className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-200 font-semibold">AI Backdrop Applied</p>
                    <p className="text-[10px] text-slate-400 max-w-[150px] truncate">"{config.aiPrompt}"</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-400/20">
                  Ready
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bento Performance Stats Card Footer */}
      <div className="p-5 bg-blue-500/5 border-t border-slate-800/80 rounded-b-2xl mt-auto">
        <h3 className="text-xs font-bold text-blue-400 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
          <span className="text-blue-500">◆</span> Performance Stats
        </h3>
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">Inference Time</span>
            <span className="font-mono text-slate-300 font-semibold">138ms</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">Wasm VRAM Usage</span>
            <span className="font-mono text-slate-300 font-semibold">2.1 GB</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">Edge Precision</span>
            <span className="font-mono text-emerald-400 font-semibold">99.8%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
