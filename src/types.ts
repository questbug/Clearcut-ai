export interface ImageJob {
  id: string;
  name: string;
  size: number;
  originalFile: File;
  originalUrl: string;
  processedUrl: string | null; // The URL of the automated background removed image
  refinedUrl: string | null;   // The URL after user manual brush refinements (falls back to processedUrl if not refined)
  status: "idle" | "processing" | "done" | "failed";
  progress: number;
  progressStep: string;
  error?: string;
}

export type BackdropType = "transparent" | "color" | "grid" | "upload" | "ai";

export interface BackdropConfig {
  type: BackdropType;
  color: string; // solid color value, e.g. #ffffff
  uploadedUrl: string | null; // URL of custom uploaded backdrop
  aiPrompt: string; // Prompt for Gemini AI image generation
  aiUrl: string | null; // URL of generated AI backdrop
}
