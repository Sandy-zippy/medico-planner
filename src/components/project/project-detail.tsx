"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Upload, Sparkles, Loader2, FileText,
  Building2, MapPin, Maximize2, Shield, Trash2,
  Brain, RefreshCw, ChevronLeft, ChevronRight,
} from "lucide-react";
import { PROJECT_STATUS_COLORS, getClinicLabel, getProvinceCode } from "@/lib/constants";
import { OutputRenderer } from "@/components/project/output-renderer";
import type { Project, Generation } from "@/types";
import { toast } from "sonner";

const PROGRESS_MESSAGES = [
  "Starting AI analysis...",
  "Analyzing room program...",
  "Evaluating building code compliance...",
  "Computing spatial adjacencies...",
  "Generating equipment schedules...",
  "Computing floor plan layout...",
  "Building 3D visualization...",
  "Finalizing concept package...",
];

export function ProjectDetail({
  project,
  generations: initialGenerations,
}: {
  project: Project;
  generations: Generation[];
}) {
  const router = useRouter();
  const [generations, setGenerations] = useState(initialGenerations);
  const [generating, setGenerating] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadUrls, setUploadUrls] = useState<string[]>(project.upload_urls ?? []);
  const [activeVersion, setActiveVersion] = useState<string>(
    initialGenerations[0]?.id ?? ""
  );
  const [sidebarOpen, setSidebarOpen] = useState(!initialGenerations.length);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeGeneration = generations.find((g) => g.id === activeVersion);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, []);

  const startProgressCycle = () => {
    let idx = 0;
    setProgressMsg(PROGRESS_MESSAGES[0]);
    progressRef.current = setInterval(() => {
      idx = Math.min(idx + 1, PROGRESS_MESSAGES.length - 1);
      setProgressMsg(PROGRESS_MESSAGES[idx]);
    }, 3000);
  };

  const stopProgressCycle = () => {
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
    setProgressMsg("");
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerationError(null);
    startProgressCycle();

    try {
      const res = await fetch(`/api/projects/${project.id}/generate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Generation failed");
      const gen = await res.json();

      if (gen.status === "pending" || gen.status === "processing") {
        pollForCompletion(gen.id, gen.version);
      } else {
        stopProgressCycle();
        setGenerations((prev) => [gen, ...prev]);
        setActiveVersion(gen.id);
        setGenerating(false);
        setSidebarOpen(false);
        toast.success(`Version ${gen.version} generated`);
        router.refresh();
      }
    } catch {
      stopProgressCycle();
      setGenerating(false);
      setGenerationError("Failed to start generation. Please try again.");
      toast.error("Failed to generate concept package");
    }
  };

  const pollForCompletion = (genId: string, version: number) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/projects/${project.id}/generations/${genId}`
        );
        if (!res.ok) return;
        const gen = await res.json();

        if (gen.status === "completed") {
          if (pollRef.current) clearInterval(pollRef.current);
          stopProgressCycle();
          setGenerations((prev) => [gen, ...prev]);
          setActiveVersion(gen.id);
          setGenerating(false);
          setSidebarOpen(false);
          toast.success(`Version ${version} generated with AI`);
          router.refresh();
        } else if (gen.status === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
          stopProgressCycle();
          setGenerating(false);
          setGenerationError(
            gen.error_message || "AI generation failed. Try again."
          );
          toast.error("AI generation failed");
        }
      } catch {
        // Network error — keep trying
      }
    }, 2000);
  };

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${project.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("project-uploads")
        .upload(path, file);

      if (!error) {
        const { data } = supabase.storage
          .from("project-uploads")
          .getPublicUrl(path);
        newUrls.push(data.publicUrl);
      }
    }

    if (newUrls.length > 0) {
      const allUrls = [...uploadUrls, ...newUrls];
      setUploadUrls(allUrls);
      await supabase
        .from("projects")
        .update({ upload_urls: allUrls })
        .eq("id", project.id);
      toast.success(`${newUrls.length} file(s) uploaded`);
    }
    setUploading(false);
    e.target.value = "";
  }, [uploadUrls, project.id]);

  const handleDeleteUpload = async (url: string) => {
    const supabase = createClient();
    const filtered = uploadUrls.filter((u) => u !== url);
    setUploadUrls(filtered);
    await supabase
      .from("projects")
      .update({ upload_urls: filtered })
      .eq("id", project.id);
    toast.success("File removed");
  };

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <Link href="/app" className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700">
          <ArrowLeft className="w-4 h-4" /> Projects
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <ChevronLeft className="w-3.5 h-3.5 mr-1" /> : <ChevronRight className="w-3.5 h-3.5 mr-1" />}
            {sidebarOpen ? "Hide" : "Details"}
          </Button>
          <Button size="sm" onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="w-3.5 h-3.5 mr-1" /> Generate</>
            )}
          </Button>
        </div>
      </div>

      {/* Project title + version chips */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-stone-900">
              {getClinicLabel(project.clinic_type)}
            </h1>
            <Badge variant="secondary" className={`text-[10px] ${PROJECT_STATUS_COLORS[project.status] ?? ""}`}>
              {project.status.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            {project.city ? `${project.city}, ` : ""}{project.province} &middot; {project.area_sqft.toLocaleString()} SF &middot; {getProvinceCode(project.province)}
          </p>
        </div>
        {/* Version chips */}
        {generations.length > 0 && (
          <div className="flex items-center gap-1">
            {generations.map((gen) => (
              <button
                key={gen.id}
                onClick={() => setActiveVersion(gen.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeVersion === gen.id
                    ? "bg-stone-900 text-white"
                    : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                }`}
              >
                v{gen.version}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Generation Progress Banner */}
      {generating && progressMsg && (
        <div className="mb-4 p-3 bg-gradient-to-r from-violet-50 to-blue-50 border border-violet-100 rounded-lg">
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-violet-600 animate-pulse" />
            <div>
              <p className="text-sm font-medium text-violet-900">{progressMsg}</p>
              <p className="text-xs text-violet-600 mt-0.5">AI-powered generation typically takes 10-20 seconds</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {generationError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-800">{generationError}</p>
            <Button variant="outline" size="sm" onClick={() => { setGenerationError(null); handleGenerate(); }}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
            </Button>
          </div>
        </div>
      )}

      {/* Main layout */}
      <div className="flex gap-4">
        {/* Collapsible sidebar */}
        {sidebarOpen && (
          <aside className="w-60 shrink-0 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xs font-medium text-stone-500">Project Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-stone-400" />
                  <span>{getClinicLabel(project.clinic_type)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  <span>{project.city ? `${project.city}, ` : ""}{project.province}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Maximize2 className="w-3.5 h-3.5 text-stone-400" />
                  <span>{project.area_sqft.toLocaleString()} SF</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-stone-400" />
                  <span>{getProvinceCode(project.province)}</span>
                </div>
                {project.notes && (
                  <>
                    <Separator />
                    <p className="text-stone-500">{project.notes}</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium text-stone-500">Uploads</CardTitle>
                  <label className="cursor-pointer">
                    <input type="file" accept=".pdf,.png,.jpg,.jpeg" multiple onChange={handleUpload} className="hidden" />
                    <Button variant="outline" size="sm" asChild disabled={uploading}>
                      <span className="text-xs">
                        {uploading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
                        Upload
                      </span>
                    </Button>
                  </label>
                </div>
              </CardHeader>
              <CardContent>
                {uploadUrls.length === 0 ? (
                  <p className="text-xs text-stone-400 text-center py-3">No files yet</p>
                ) : (
                  <div className="space-y-1.5">
                    {uploadUrls.map((url, i) => (
                      <div key={i} className="flex items-center justify-between p-1.5 bg-stone-50 rounded text-xs">
                        <div className="flex items-center gap-1.5 truncate">
                          <FileText className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                          <span className="truncate">File {i + 1}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteUpload(url)} className="h-5 w-5 p-0">
                          <Trash2 className="w-3 h-3 text-stone-400" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>
        )}

        {/* Main content — full width */}
        <main className="flex-1 min-w-0">
          {generating ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-14 h-14 bg-violet-100 rounded-full flex items-center justify-center mb-3">
                  <Brain className="w-7 h-7 text-violet-500 animate-pulse" />
                </div>
                <h3 className="font-semibold text-stone-900 mb-1">Generating concept package...</h3>
                <p className="text-sm text-stone-500 text-center max-w-xs">
                  {progressMsg || "Preparing generation pipeline..."}
                </p>
                <div className="w-48 h-1.5 bg-stone-100 rounded-full overflow-hidden mt-3">
                  <div className="h-full bg-violet-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
              </CardContent>
            </Card>
          ) : activeGeneration ? (
            <OutputRenderer generation={activeGeneration} />
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-14 h-14 bg-stone-100 rounded-full flex items-center justify-center mb-3">
                  <Sparkles className="w-7 h-7 text-stone-400" />
                </div>
                <h3 className="font-semibold text-stone-900 mb-1">No concept package yet</h3>
                <p className="text-sm text-stone-500 mb-4 text-center max-w-xs">
                  Generate your first concept package to see floor plans, room programs, and compliance analysis.
                </p>
                <Button onClick={handleGenerate} disabled={generating}>
                  <Sparkles className="w-4 h-4 mr-2" /> Generate Concept Package
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
