import React, { useState, useEffect } from "react";
import { removeBackground } from "@imgly/background-removal";
import { motion, AnimatePresence } from "motion/react";
import JSZip from "jszip";
import { 
  Plus, 
  Trash2, 
  Download, 
  RefreshCw, 
  Paintbrush, 
  Layers, 
  Play, 
  Sparkles, 
  ChevronRight, 
  Sliders, 
  Grid as GridIcon, 
  CheckCircle, 
  Check,
  AlertCircle,
  Loader2,
  FileImage,
  ExternalLink,
  Image as ImageIcon
} from "lucide-react";

import { ImageJob, BackdropConfig, BackdropType } from "./types";
import { compositeImageWithBackground } from "./utils/composite";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Dropzone from "./components/Dropzone";
import LandingPage from "./components/LandingPage";
import BackdropControls from "./components/BackdropControls";
import ComparisonSlider from "./components/ComparisonSlider";
import RefineModal from "./components/RefineModal";

const INITIAL_BACKDROP_CONFIG: BackdropConfig = {
  type: "transparent",
  color: "#FFFFFF",
  uploadedUrl: null,
  aiPrompt: "",
  aiUrl: null,
};

export default function App() {
  const [jobs, setJobs] = useState<ImageJob[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [backdropConfig, setBackdropConfig] = useState<BackdropConfig>(INITIAL_BACKDROP_CONFIG);
  const [activePreviewTab, setActivePreviewTab] = useState<"slider" | "backdrop">("slider");
  
  // Magic Brush Refinement State
  const [refineJob, setRefineJob] = useState<ImageJob | null>(null);

  // Bulk ZIP Download states
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [zipProgress, setZipProgress] = useState<number>(0);

  // Find currently selected job
  const activeJob = jobs.find((j) => j.id === activeJobId) || null;

  // Cleanup object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      jobs.forEach((job) => {
        if (job.originalUrl.startsWith("blob:")) URL.revokeObjectURL(job.originalUrl);
        if (job.processedUrl?.startsWith("blob:")) URL.revokeObjectURL(job.processedUrl);
        if (job.refinedUrl?.startsWith("blob:")) URL.revokeObjectURL(job.refinedUrl);
      });
      if (backdropConfig.uploadedUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(backdropConfig.uploadedUrl);
      }
    };
  }, []);

  // Update a single job in the list
  const updateJob = (id: string, updates: Partial<ImageJob>) => {
    setJobs((prevJobs) =>
      prevJobs.map((j) => (j.id === id ? { ...j, ...updates } : j))
    );
  };

  // Process a job with WASM Background Removal
  const runBackgroundRemoval = async (job: ImageJob) => {
    updateJob(job.id, { status: "processing", progress: 0, progressStep: "Initializing model assets..." });

    try {
      const config = {
        progress: (key: string, current: number, total: number) => {
          const percent = total > 0 ? Math.round((current / total) * 100) : 0;
          let step = "Removing background...";
          
          if (key.includes("fetch")) {
            step = "Downloading neural models (~7.4MB)...";
          } else if (key.includes("onnx")) {
            step = "Running image extraction...";
          } else if (key.includes("compile")) {
            step = "Compiling shader pipelines...";
          }

          updateJob(job.id, { progress: percent, progressStep: step });
        },
      };

      // Call imgly background-removal locally
      const blob = await removeBackground(job.originalFile, config);
      const processedUrl = URL.createObjectURL(blob);

      updateJob(job.id, {
        status: "done",
        processedUrl,
        progress: 100,
        progressStep: "Completed successfully",
      });

      // If no image is currently focused, auto-focus on this newly completed image
      setActiveJobId((prevId) => prevId || job.id);
    } catch (err: any) {
      console.error("Local BG removal failed for job", job.id, err);
      updateJob(job.id, {
        status: "failed",
        progressStep: "Failed",
        error: err.message || "Failed during local WASM execution.",
      });
    }
  };

  // Add files selected in dropzone
  const handleFilesSelected = (files: File[]) => {
    const newJobs: ImageJob[] = files.map((file) => {
      const originalUrl = URL.createObjectURL(file);
      return {
        id: Math.random().toString(36).substring(2, 9),
        name: file.name,
        size: file.size,
        originalFile: file,
        originalUrl,
        processedUrl: null,
        refinedUrl: null,
        status: "idle",
        progress: 0,
        progressStep: "Waiting to process...",
      };
    });

    setJobs((prev) => [...prev, ...newJobs]);

    // Automatically trigger processing in parallel for all newly added jobs
    newJobs.forEach((job) => {
      runBackgroundRemoval(job);
    });
  };

  // API handler calling our Express server for AI backdrop generation
  const handleGenerateAIBackdrop = async (prompt: string, aspectRatio: string): Promise<string> => {
    const res = await fetch("/api/backdrop/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, aspectRatio }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Background generation service failed.");
    }

    const data = await res.json();
    return data.imageUrl; // contains the base64 generated image
  };

  // Delete a job from staging list
  const handleDeleteJob = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const job = jobs.find((j) => j.id === id);
    if (job) {
      // Revoke memory URLs to free browser memory
      URL.revokeObjectURL(job.originalUrl);
      if (job.processedUrl) URL.revokeObjectURL(job.processedUrl);
      if (job.refinedUrl) URL.revokeObjectURL(job.refinedUrl);
    }

    setJobs((prev) => prev.filter((j) => j.id !== id));
    if (activeJobId === id) {
      const remaining = jobs.filter((j) => j.id !== id);
      setActiveJobId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Retry a failed job
  const handleRetryJob = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const job = jobs.find((j) => j.id === id);
    if (job) {
      runBackgroundRemoval(job);
    }
  };

  // Apply manual touchup refinements from RefineModal canvas
  const handleSaveRefinement = (refinedBlob: Blob) => {
    if (!refineJob) return;

    // Revoke old refinement URL if exists
    if (refineJob.refinedUrl) {
      URL.revokeObjectURL(refineJob.refinedUrl);
    }

    const refinedUrl = URL.createObjectURL(refinedBlob);
    updateJob(refineJob.id, {
      refinedUrl: refinedUrl,
    });

    setRefineJob(null);
  };

  // Download a single job composited with the selected backdrop
  const handleDownloadSingle = async (job: ImageJob, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const activeForegroundUrl = job.refinedUrl || job.processedUrl;
    if (!activeForegroundUrl) return;

    try {
      const composedBlob = await compositeImageWithBackground(activeForegroundUrl, backdropConfig);
      const url = URL.createObjectURL(composedBlob);

      const link = document.createElement("a");
      link.href = url;
      // Append backdrop type to name
      const baseName = job.name.substring(0, job.name.lastIndexOf(".")) || job.name;
      link.download = `${baseName}_clearcut_${backdropConfig.type}.png`;
      link.click();

      // Small cleanup delay
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) {
      console.error("Composite image creation failed:", err);
      alert("Failed to composite background. Downloading raw transparent foreground instead.");
      
      const link = document.createElement("a");
      link.href = activeForegroundUrl;
      const baseName = job.name.substring(0, job.name.lastIndexOf(".")) || job.name;
      link.download = `${baseName}_clearcut.png`;
      link.click();
    }
  };

  // Download all completed images as a ZIP archive
  const handleDownloadAllZip = async () => {
    const completedJobs = jobs.filter((j) => j.status === "done");
    if (completedJobs.length === 0) return;

    setIsZipping(true);
    setZipProgress(0);

    const zip = new JSZip();

    try {
      for (let i = 0; i < completedJobs.length; i++) {
        const job = completedJobs[i];
        const activeForegroundUrl = job.refinedUrl || job.processedUrl;
        if (!activeForegroundUrl) continue;

        const blob = await compositeImageWithBackground(activeForegroundUrl, backdropConfig);
        const baseName = job.name.substring(0, job.name.lastIndexOf(".")) || job.name;
        zip.file(`${baseName}_clearcut.png`, blob);

        setZipProgress(Math.round(((i + 1) / completedJobs.length) * 100));
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `clearcut_bulk_${backdropConfig.type}.zip`;
      link.click();

      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) {
      console.error("Failed to generate bulk ZIP:", err);
      alert("Error generating bulk package. Please download files individually.");
    } finally {
      setIsZipping(false);
    }
  };

  const handleClearStaging = () => {
    if (confirm("Are you sure you want to clear all images from staging?")) {
      jobs.forEach((job) => {
        URL.revokeObjectURL(job.originalUrl);
        if (job.processedUrl) URL.revokeObjectURL(job.processedUrl);
        if (job.refinedUrl) URL.revokeObjectURL(job.refinedUrl);
      });
      setJobs([]);
      setActiveJobId(null);
    }
  };

  // Helper styles to render checkered alpha grid under visual components
  const getAlphaGridStyle = (): React.CSSProperties => {
    if (backdropConfig.type === "transparent" || backdropConfig.type === "grid") {
      return {
        backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\" viewBox=\"0 0 24 24\"><rect width=\"12\" height=\"12\" fill=\"%231e293b\"/><rect x=\"12\" y=\"12\" width=\"12\" height=\"12\" fill=\"%231e293b\"/><rect x=\"12\" width=\"12\" height=\"12\" fill=\"%230f172a\"/><rect y=\"12\" width=\"12\" height=\"12\" fill=\"%230f172a\"/></svg>')",
        backgroundSize: "20px 20px",
      };
    } else if (backdropConfig.type === "color") {
      return { backgroundColor: backdropConfig.color };
    } else if (backdropConfig.type === "upload" && backdropConfig.uploadedUrl) {
      return {
        backgroundImage: `url(${backdropConfig.uploadedUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    } else if (backdropConfig.type === "ai" && backdropConfig.aiUrl) {
      return {
        backgroundImage: `url(${backdropConfig.aiUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }
    return {};
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6">
        {jobs.length === 0 ? (
          <LandingPage onFilesSelected={handleFilesSelected} />
        ) : (
          /* Staging Active State */
          <div className="py-6 space-y-6 animate-fade-in">
            
            {/* Bento Grid Container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* PLAYGROUND VIEW: Column Span 8 */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                
                {/* Active Job Playground Container */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
                  
                  {/* Active Job Header tab row */}
                  <div className="bg-slate-950/40 px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 max-w-[200px] sm:max-w-xs truncate">
                          {activeJob ? activeJob.name : "Select an image to preview"}
                        </h3>
                        {activeJob && (
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {(activeJob.size / 1024 / 1024).toFixed(2)} MB // lossless
                          </p>
                        )}
                      </div>
                    </div>
 
                    {/* View selectors */}
                    {activeJob && activeJob.status === "done" && (
                      <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                        <button
                          onClick={() => setActivePreviewTab("slider")}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                            activePreviewTab === "slider"
                              ? "bg-slate-800 text-blue-400 border border-slate-700"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <Sliders className="h-3.5 w-3.5" />
                          <span>Before/After</span>
                        </button>
 
                        <button
                          onClick={() => setActivePreviewTab("backdrop")}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                            activePreviewTab === "backdrop"
                              ? "bg-slate-800 text-blue-400 border border-slate-700"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <Layers className="h-3.5 w-3.5" />
                          <span>Backdrop Composer</span>
                        </button>
                      </div>
                    )}
                  </div>
 
                  {/* Active Stage Body */}
                  <div className="flex-1 min-h-[380px] flex items-center justify-center p-6 bg-slate-950/50">
                    {!activeJob ? (
                      /* No Focused Job Placeholder */
                      <div className="text-center py-12 max-w-sm space-y-3 text-slate-400">
                        <div className="mx-auto rounded-full bg-slate-900 border border-slate-800 h-12 w-12 flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-slate-500" />
                        </div>
                        <p className="text-sm font-semibold text-slate-300">No Image Focused</p>
                        <p className="text-xs">
                          Choose any of the uploaded images in the queue grid below to preview, refine, and composite backgrounds.
                        </p>
                      </div>
                    ) : activeJob.status === "processing" ? (
                      /* Active Job is currently processing */
                      <div className="text-center py-12 space-y-4 max-w-sm">
                        <div className="relative mx-auto h-16 w-16 flex items-center justify-center">
                          <Loader2 className="absolute h-12 w-12 animate-spin text-blue-500" />
                          <div className="rounded-full bg-blue-500/10 border border-blue-500/20 p-2.5 text-blue-400">
                            <Sliders className="h-5 w-5 animate-pulse" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-200">Isolating Object...</p>
                          <p className="text-xs text-blue-400 font-mono mt-1">{activeJob.progressStep}</p>
                        </div>
                        {/* Progress slider bar */}
                        <div className="w-full bg-slate-900 rounded-full h-1.5 border border-slate-800 overflow-hidden">
                          <div 
                            className="bg-blue-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${activeJob.progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">Progress: {activeJob.progress}%</span>
                      </div>
                    ) : activeJob.status === "failed" ? (
                      /* Active Job failed */
                      <div className="text-center py-12 space-y-3 max-w-xs text-rose-400">
                        <div className="mx-auto rounded-full bg-rose-500/10 border border-rose-500/20 h-12 w-12 flex items-center justify-center">
                          <AlertCircle className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-bold">Extraction Failed</p>
                        <p className="text-xs text-rose-400/80">{activeJob.error || "WASM models were unable to run."}</p>
                        <button
                          onClick={(e) => handleRetryJob(activeJob.id, e)}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/30 text-rose-300 font-bold text-xs rounded-xl transition"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Retry Image</span>
                        </button>
                      </div>
                    ) : (
                      /* Active Job is completed: Render appropriate tab */
                      <div className="w-full h-full flex flex-col justify-center items-center">
                        {activePreviewTab === "slider" ? (
                          <ComparisonSlider
                            originalUrl={activeJob.originalUrl}
                            processedUrl={activeJob.refinedUrl || activeJob.processedUrl!}
                          />
                        ) : (
                          /* COMPOSER TAB */
                          <div className="w-full flex flex-col items-center">
                            <div 
                              className="relative w-full aspect-video sm:h-[420px] rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center"
                              style={getAlphaGridStyle()}
                            >
                              <img
                                src={activeJob.refinedUrl || activeJob.processedUrl!}
                                alt="Composed foreground"
                                className="w-full h-full object-contain pointer-events-none drop-shadow-xl"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            
                            <div className="mt-3 flex items-center gap-2 text-slate-400 text-xs font-mono">
                              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                              <span>Backdrop mode: <strong className="text-blue-400 uppercase">{backdropConfig.type}</strong></span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
 
                  {/* Active Playground Toolbar Footer (Only shown if finished) */}
                  {activeJob && activeJob.status === "done" && (
                    <div className="bg-slate-950/40 p-4 border-t border-slate-800 flex flex-wrap justify-between items-center gap-3">
                      <div className="flex items-center gap-2">
                        {/* Refine / Magic Brush trigger */}
                        <button
                          onClick={() => setRefineJob(activeJob)}
                          className="flex items-center gap-1.5 px-4 py-2 border border-slate-800 hover:border-blue-800/80 hover:bg-blue-950/10 rounded-xl text-xs font-semibold text-blue-400 transition"
                        >
                          <Paintbrush className="h-3.5 w-3.5" />
                          <span>Interactive Magic Brush / Eraser</span>
                        </button>
 
                        {activeJob.refinedUrl && (
                          <div className="flex items-center gap-1 text-[10px] text-blue-300 bg-blue-600/10 px-2 py-0.5 rounded border border-blue-500/20 font-bold animate-pulse">
                            <CheckCircle className="h-3 w-3 text-blue-400" />
                            <span>Refined</span>
                          </div>
                        )}
                      </div>
 
                      {/* Download composited button */}
                      <button
                        onClick={() => handleDownloadSingle(activeJob)}
                        className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-blue-950/20"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download Composed PNG</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
 
              {/* RIGHT SIDEBAR: Backdrop Selection Controls */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <BackdropControls
                  config={backdropConfig}
                  onChange={setBackdropConfig}
                  onGenerateAI={handleGenerateAIBackdrop}
                  activeImageAspect="1:1" // defaults as aspect fit covers sceneries
                />
              </div>

              {/* MANUAL REFINEMENT bento card: Column Span 3 */}
              <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between min-h-[220px] shadow-lg">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <span className="text-amber-500">★</span> Manual Refinement
                </h3>
                
                <div className="grid grid-cols-2 gap-3 my-4">
                  <button 
                    onClick={() => {
                      if (activeJob) {
                        setRefineJob(activeJob);
                      } else {
                        alert("Please upload or select an image in the queue first.");
                      }
                    }}
                    className="flex flex-col items-center justify-center p-3.5 bg-blue-600/10 border border-blue-500/30 rounded-xl hover:bg-blue-600/15 transition group cursor-pointer"
                  >
                    <Paintbrush className="h-5 w-5 text-blue-400 group-hover:scale-110 transition-transform mb-2" />
                    <span className="text-[9px] font-bold text-blue-300 uppercase tracking-wider">Magic Brush</span>
                  </button>
                  <button 
                    onClick={() => {
                      if (activeJob) {
                        setRefineJob(activeJob);
                      } else {
                        alert("Please upload or select an image first.");
                      }
                    }}
                    className="flex flex-col items-center justify-center p-3.5 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition group cursor-pointer"
                  >
                    <Trash2 className="h-5 w-5 text-slate-500 group-hover:scale-110 group-hover:text-rose-400 transition-transform mb-2" />
                    <span className="text-[9px] font-bold text-slate-400 group-hover:text-rose-300 uppercase tracking-wider">Eraser</span>
                  </button>
                </div>

                <div>
                  <div className="flex justify-between text-[9px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">
                    <span>Alpha Precision</span>
                    <span className="font-mono text-emerald-400">Adaptive Edge</span>
                  </div>
                  <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div className="w-11/12 h-full bg-blue-500" />
                  </div>
                </div>
              </div>

              {/* BULK QUEUE scroll strip bento card: Column Span 9 */}
              <div className="lg:col-span-9 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between min-h-[220px] shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                      Bulk Staging Queue
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {jobs.filter((j) => j.status === "done").length} of {jobs.length} processed
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {/* Clear All */}
                    <button
                      onClick={handleClearStaging}
                      className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-800 hover:border-slate-700 hover:bg-slate-950 rounded-lg text-[10px] uppercase font-bold tracking-wider text-slate-400 hover:text-rose-400 transition cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Clear All</span>
                    </button>

                    {/* Add More */}
                    <button
                      onClick={() => document.querySelector("input[type=file]")?.dispatchEvent(new MouseEvent("click"))}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:text-slate-200 rounded-lg text-[10px] uppercase font-bold tracking-wider text-slate-400 transition cursor-pointer"
                    >
                      <Plus className="h-3 w-3 animate-pulse" />
                      <span>Add More</span>
                    </button>

                    {/* Download ZIP */}
                    <button
                      onClick={handleDownloadAllZip}
                      disabled={isZipping || jobs.filter((j) => j.status === "done").length === 0}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-950 disabled:text-slate-600 border disabled:border-slate-800 border-transparent text-white font-bold rounded-lg text-[10px] uppercase tracking-wider transition shadow-lg shadow-blue-950/20 cursor-pointer"
                    >
                      {isZipping ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin text-white" />
                          <span>Zipping {zipProgress}%</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-3 w-3" />
                          <span>Download ZIP</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Horizontal Scroll Strip */}
                <div className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                  {jobs.map((job) => {
                    const isFocused = job.id === activeJobId;
                    
                    return (
                      <div
                        key={job.id}
                        onClick={() => {
                          if (job.status !== "idle") {
                            setActiveJobId(job.id);
                          }
                        }}
                        className={`relative flex-shrink-0 w-32 bg-slate-950 border rounded-xl overflow-hidden cursor-pointer group transition-all ${
                          isFocused
                            ? "border-blue-500 ring-2 ring-blue-500/20 scale-[1.02]"
                            : "border-slate-800 hover:border-slate-700 bg-slate-950/60"
                        }`}
                      >
                        {/* Thumbnail frame with aspect-square */}
                        <div className="relative aspect-square w-full bg-slate-950 overflow-hidden flex items-center justify-center border-b border-slate-800/40">
                          {job.status === "done" ? (
                            <div 
                              className="absolute inset-0 w-full h-full flex items-center justify-center p-1.5"
                              style={{
                                backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\" viewBox=\"0 0 24 24\"><rect width=\"12\" height=\"12\" fill=\"%231e293b\"/><rect x=\"12\" y=\"12\" width=\"12\" height=\"12\" fill=\"%231e293b\"/><rect x=\"12\" width=\"12\" height=\"12\" fill=\"%230f172a\"/><rect y=\"12\" width=\"12\" height=\"12\" fill=\"%230f172a\"/></svg>')",
                                backgroundSize: "12px 12px",
                              }}
                            >
                              <img
                                src={job.refinedUrl || job.processedUrl!}
                                alt="Result thumbnail"
                                className="h-full w-full object-contain pointer-events-none transition-transform duration-250 group-hover:scale-105"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ) : (
                            <img
                              src={job.originalUrl}
                              alt="Original thumbnail"
                              className="h-full w-full object-contain opacity-50 p-1.5"
                              referrerPolicy="no-referrer"
                            />
                          )}

                          {/* Processing spinner layer */}
                          {job.status === "processing" && (
                            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1">
                              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                              <span className="text-[9px] font-mono font-bold text-blue-300">
                                {job.progress}%
                              </span>
                            </div>
                          )}

                          {/* Fail indicator layer */}
                          {job.status === "failed" && (
                            <div className="absolute inset-0 bg-rose-950/70 flex flex-col items-center justify-center gap-1">
                              <AlertCircle className="h-4 w-4 text-rose-400 animate-pulse" />
                              <span className="text-[9px] text-rose-400 font-bold">Failed</span>
                            </div>
                          )}

                          {/* Check overlay if completed */}
                          {job.status === "done" && (
                            <div className="absolute top-1.5 left-1.5 bg-emerald-500 text-white rounded-full p-0.5 shadow border border-emerald-400 z-10">
                              <Check className="h-2 w-2 stroke-[3]" />
                            </div>
                          )}

                          {/* Delete overlay */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteJob(job.id, e);
                            }}
                            className="absolute top-1.5 right-1.5 bg-slate-950/80 border border-slate-800 rounded-full p-1 text-slate-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            title="Delete Image"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        </div>

                        {/* Card Information footer */}
                        <div className="p-2 flex flex-col gap-0.5 text-left">
                          <p className="text-[10px] font-bold text-slate-200 truncate" title={job.name}>
                            {job.name}
                          </p>
                          <p className="text-[8px] text-slate-500 font-mono">
                            {(job.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add more inside strip */}
                  {jobs.length < 20 && (
                    <div
                      onClick={() => document.querySelector("input[type=file]")?.dispatchEvent(new MouseEvent("click"))}
                      className="flex-shrink-0 w-32 aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/35 hover:bg-slate-900/20 rounded-xl cursor-pointer text-center group transition-colors"
                    >
                      <Plus className="h-5 w-5 text-slate-500 group-hover:text-blue-500 group-hover:scale-110 transition-all" />
                      <span className="text-[9px] text-slate-500 group-hover:text-slate-400 font-bold uppercase tracking-wider mt-1">
                        Add More
                      </span>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}
      </main>

      <Footer />

      {/* ACTIVE MANUAL TOUCHUP CANVAS MODAL */}
      <RefineModal
        job={refineJob}
        isOpen={refineJob !== null}
        onClose={() => setRefineJob(null)}
        onSave={handleSaveRefinement}
      />
    </div>
  );
}
