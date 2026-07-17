import { BackdropConfig } from "../types";

/**
 * Composites a processed transparent foreground image with a selected background configuration
 * and returns a promise resolving to a Blob (or data URL) of the composed image.
 */
export function compositeImageWithBackground(
  foregroundSrc: string,
  backgroundConfig: BackdropConfig,
  format: "image/png" | "image/jpeg" = "image/png"
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const foregroundImg = new Image();
    foregroundImg.crossOrigin = "anonymous";
    foregroundImg.src = foregroundSrc;

    foregroundImg.onload = () => {
      const canvas = document.createElement("canvas");
      // Use full natural dimensions of the foreground image to preserve quality
      canvas.width = foregroundImg.naturalWidth;
      canvas.height = foregroundImg.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not obtain canvas context"));
        return;
      }

      const drawForeground = () => {
        ctx.drawImage(foregroundImg, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Canvas blob export failed"));
          }
        }, format);
      };

      // 1. Draw Background based on config
      if (backgroundConfig.type === "transparent" || backgroundConfig.type === "grid") {
        // Transparent output: nothing to draw on the background
        drawForeground();
      } else if (backgroundConfig.type === "color") {
        // Solid color background
        ctx.fillStyle = backgroundConfig.color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawForeground();
      } else {
        // Custom backdrop (uploaded or AI generated)
        const bgUrl =
          backgroundConfig.type === "upload"
            ? backgroundConfig.uploadedUrl
            : backgroundConfig.aiUrl;

        if (!bgUrl) {
          // Fallback to transparent if no backdrop image is supplied
          drawForeground();
          return;
        }

        const backgroundImg = new Image();
        backgroundImg.crossOrigin = "anonymous";
        backgroundImg.src = bgUrl;

        backgroundImg.onload = () => {
          // Draw background image scaled as "cover" (maintaining aspect ratio to cover canvas)
          const canvasAspect = canvas.width / canvas.height;
          const bgAspect = backgroundImg.naturalWidth / backgroundImg.naturalHeight;

          let drawWidth = canvas.width;
          let drawHeight = canvas.height;
          let offsetX = 0;
          let offsetY = 0;

          if (bgAspect > canvasAspect) {
            // Background is wider than canvas
            drawWidth = canvas.height * bgAspect;
            offsetX = -(drawWidth - canvas.width) / 2;
          } else if (bgAspect < canvasAspect) {
            // Background is taller than canvas
            drawHeight = canvas.width / bgAspect;
            offsetY = -(drawHeight - canvas.height) / 2;
          }

          ctx.drawImage(backgroundImg, offsetX, offsetY, drawWidth, drawHeight);
          drawForeground();
        };

        backgroundImg.onerror = (err) => {
          console.error("Failed to load background image for composition:", err);
          // Fallback to transparent background and proceed with foreground anyway
          drawForeground();
        };
      }
    };

    foregroundImg.onerror = (err) => {
      reject(new Error("Failed to load foreground image: " + err));
    };
  });
}
