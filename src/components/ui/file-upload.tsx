"use client";

import { useState, useCallback } from "react";
import { Upload, X, Loader2, FileText, Image } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  label: string;
  category: string;
  accept?: string;
  multiple?: boolean;
  urls: string[];
  onUrlsChange: (urls: string[]) => void;
}

export function FileUpload({
  label,
  category,
  accept = ".pdf,.png,.jpg,.jpeg",
  multiple = false,
  urls,
  onUrlsChange,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files?.length) return;

      setUploading(true);
      const newUrls: string[] = [];

      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", category);

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          newUrls.push(data.url);
        }
      }

      if (newUrls.length > 0) {
        onUrlsChange([...urls, ...newUrls]);
      }
      setUploading(false);
      e.target.value = "";
    },
    [urls, onUrlsChange, category]
  );

  const removeUrl = (index: number) => {
    onUrlsChange(urls.filter((_, i) => i !== index));
  };

  const isImage = (url: string) => /\.(png|jpg|jpeg|gif|webp)/.test(url.toLowerCase());

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <label className="cursor-pointer">
          <input
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleUpload}
            className="hidden"
          />
          <Button variant="outline" size="sm" asChild disabled={uploading}>
            <span className="text-xs">
              {uploading ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Upload className="w-3 h-3 mr-1" />
              )}
              Upload
            </span>
          </Button>
        </label>
      </div>

      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((url, i) => (
            <div
              key={i}
              className="relative group w-16 h-16 rounded-lg border border-stone-200 overflow-hidden bg-stone-50"
            >
              {isImage(url) ? (
                <img src={url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-stone-400" />
                </div>
              )}
              <button
                type="button"
                onClick={() => removeUrl(i)}
                className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
