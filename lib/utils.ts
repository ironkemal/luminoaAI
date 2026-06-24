import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export function scoreToLabel(score: number): string {
  if (score >= 85) return "Ausgezeichnet";
  if (score >= 70) return "Gut";
  if (score >= 55) return "Befriedigend";
  if (score >= 40) return "Ausreichend";
  return "Verbesserungswürdig";
}

export function scoreToColor(score: number): string {
  if (score >= 85) return "text-green-600";
  if (score >= 70) return "text-blue-600";
  if (score >= 55) return "text-yellow-600";
  if (score >= 40) return "text-orange-600";
  return "text-red-600";
}

export function extractTextFromPdf(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

        const pdf = await pdfjsLib.getDocument(typedArray).promise;
        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items
            .map((item) => ("str" in item ? item.str || "" : ""))
            .join(" ");
          fullText += pageText + "\n";
        }

        resolve(fullText.trim());
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
