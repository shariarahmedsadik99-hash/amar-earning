"use client";

import { useState, useRef, useCallback } from "react";
import { useI18n } from "@/lib/i18n-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Upload,
  Loader2,
  X,
  Link as LinkIcon,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  /** Optional label override (defaults to i18n) */
  label?: string;
  /** Whether to also show a manual URL input as fallback */
  allowUrl?: boolean;
  /** Optional className */
  className?: string;
}

export function ImageUploader({
  value,
  onChange,
  label,
  allowUrl = true,
  className,
}: ImageUploaderProps) {
  const { t, lang } = useI18n();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        toast.error(
          lang === "bn"
            ? "ফাইল বড় (সর্বোচ্চ ৫ মেগাবাইট)"
            : "File too large (max 5 MB)"
        );
        return;
      }
      const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];
      if (!allowed.includes(file.type)) {
        toast.error(
          lang === "bn"
            ? `অসমর্থিত ফাইল: ${file.type || "unknown"}`
            : `Unsupported file: ${file.type || "unknown"}`
        );
        return;
      }
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Upload failed");
          return;
        }
        onChange(data.url);
        toast.success(
          lang === "bn" ? "ছবি আপলোড হয়েছে ✓" : "Image uploaded ✓"
        );
      } catch {
        toast.error(
          lang === "bn" ? "নেটওয়ার্ক ত্রুটি" : "Network error"
        );
      } finally {
        setUploading(false);
      }
    },
    [lang, onChange]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    // Reset so the same file can be re-selected
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const onPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const f = item.getAsFile();
        if (f) {
          handleFile(f);
          e.preventDefault();
          break;
        }
      }
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <ImageIcon className="h-3.5 w-3.5" />
          {label}
        </label>
      )}

      {/* Preview if value set */}
      {value ? (
        <div className="relative rounded-xl overflow-hidden border bg-muted/30">
          {/* Uploaded image preview (allowed: R2-hosted user content) */}
          <img
            src={value}
            alt="upload preview"
            className="w-full h-40 object-contain bg-muted/20"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="absolute top-2 right-2 flex items-center gap-1.5">
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="h-7 w-7 rounded-md bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background text-foreground"
              title={lang === "bn" ? "নতুন ট্যাবে খুলুন" : "Open in new tab"}
            >
              <LinkIcon className="h-3.5 w-3.5" />
            </a>
            <button
              type="button"
              onClick={() => onChange("")}
              className="h-7 w-7 rounded-md bg-background/80 backdrop-blur flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground text-foreground"
              title={lang === "bn" ? "মুছুন" : "Remove"}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] bg-green-600 text-white px-2 py-0.5 rounded-full">
            <CheckCircle2 className="h-3 w-3" />
            {lang === "bn" ? "আপলোড হয়েছে" : "Uploaded"}
          </div>
        </div>
      ) : uploading ? (
        <div className="h-40 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">
            {lang === "bn" ? "আপলোড হচ্ছে..." : "Uploading..."}
          </p>
        </div>
      ) : urlMode ? (
        <div className="space-y-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={lang === "bn" ? "ছবির লিংক দিন..." : "Paste image URL..."}
          />
          <button
            type="button"
            onClick={() => setUrlMode(false)}
            className="text-xs text-primary hover:underline"
          >
            {lang === "bn" ? "← আপলোড করতে চান?" : "← Upload instead?"}
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onPaste={onPaste}
          tabIndex={0}
          className={cn(
            "h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all outline-none",
            dragOver
              ? "border-primary bg-primary/10 scale-[1.01]"
              : "border-primary/30 hover:border-primary/50 hover:bg-primary/5",
            "focus-visible:ring-2 focus-visible:ring-primary"
          )}
          onClick={() => inputRef.current?.click()}
        >
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">
              {lang === "bn" ? "ছবি আপলোড করুন" : "Upload an image"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {lang === "bn"
                ? "টেনে আনুন বা ক্লিক করুন (সর্বোচ্চ ৫ মেগাবাইট)"
                : "Drag & drop or click (max 5 MB)"}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              JPG, PNG, WEBP, GIF, HEIC
            </p>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
        onChange={onInputChange}
        className="hidden"
      />

      {/* URL fallback toggle (only when no value and allowed) */}
      {allowUrl && !value && !uploading && !urlMode && (
        <button
          type="button"
          onClick={() => setUrlMode(true)}
          className="text-[11px] text-muted-foreground hover:text-primary hover:underline flex items-center gap-1"
        >
          <LinkIcon className="h-3 w-3" />
          {lang === "bn" ? "লিংক দিয়ে যোগ করুন" : "Add via URL instead"}
        </button>
      )}
    </div>
  );
}
