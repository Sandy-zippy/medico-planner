"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Upload, Sparkles, Loader2, FileText, Clock,
  Building2, MapPin, Maximize2, Shield, AlertTriangle,
  CheckCircle2, XCircle, AlertCircle, ArrowRight, Trash2,
} from "lucide-react";
import { PROJECT_STATUS_COLORS, getClinicLabel, getProvinceCode } from "@/lib/constants";
import { OutputRenderer } from "@/components/project/output-renderer";
import type { Project, Generation } from "@/types";
import { toast } from "sonner";

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
  const [uploading, setUploading] = useState(false);
  const [uploadUrls, setUploadUrls] = useState<string[]>(project.upload_urls ?? []);
  const [activeVersion, setActiveVersion] = useState<string>(
    initialGenerations[0]?.id ?? ""
  );

  const activeGeneration = generations.find((g) => g.id === activeVersion);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/generate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Generation failed");
      const gen = await res.json();
      setGenerations((prev) => [gen, ...prev]);
      setActiveVersion(gen.id);
      toast.success(`Version ${gen.version} generated`);
      router.refresh();
    } catch {
      toast.error("Failed to generate concept package");
    } finally {
      setGenerating(false);
    }
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
      <Link href="/app" className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to projects
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              {getClinicLabel(project.clinic_type)}
            </h1>
            <Badge variant="secondary" className={PROJECT_STATUS_COLORS[project.status] ?? ""}>
              {project.status.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-sm text-stone-500">
            {project.city ? `${project.city}, ` : ""}{project.province} &middot; {project.area_sqft.toLocaleString()} SF &middot; {getProvinceCode(project.province)}
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={generating}>
          {generating ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" /> Generate Concept Package</>
          )}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-stone-500">Project Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-stone-400" />
                <span>{getClinicLabel(project.clinic_type)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-stone-400" />
                <span>{project.city ? `${project.city}, ` : ""}{project.province}</span>
              </div>
              <div className="flex items-center gap-2">
                <Maximize2 className="w-4 h-4 text-stone-400" />
                <span>{project.area_sqft.toLocaleString()} SF</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-stone-400" />
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

          {/* Uploads */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-stone-500">Uploads</CardTitle>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    multiple
                    onChange={handleUpload}
                    className="hidden"
                  />
                  <Button variant="outline" size="sm" asChild disabled={uploading}>
                    <span>
                      {uploading ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 mr-1" />
                      )}
                      Upload
                    </span>
                  </Button>
                </label>
              </div>
            </CardHeader>
            <CardContent>
              {uploadUrls.length === 0 ? (
                <p className="text-sm text-stone-400 text-center py-4">
                  No files uploaded yet. Upload PDF, PNG, or JPG files.
                </p>
              ) : (
                <div className="space-y-2">
                  {uploadUrls.map((url, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-stone-50 rounded-lg text-sm">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-stone-400 flex-shrink-0" />
                        <span className="truncate">File {i + 1}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUpload(url)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-stone-400" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Version History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-stone-500">Version History</CardTitle>
            </CardHeader>
            <CardContent>
              {generations.length === 0 ? (
                <p className="text-sm text-stone-400 text-center py-4">
                  No versions yet. Click &ldquo;Generate&rdquo; to create v1.
                </p>
              ) : (
                <div className="space-y-2">
                  {generations.map((gen) => (
                    <button
                      key={gen.id}
                      onClick={() => setActiveVersion(gen.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm transition-colors ${
                        activeVersion === gen.id
                          ? "bg-stone-900 text-white"
                          : "bg-stone-50 hover:bg-stone-100 text-stone-700"
                      }`}
                    >
                      <span className="font-medium">Version {gen.version}</span>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 opacity-50" />
                        <span className="text-xs opacity-70">
                          {new Date(gen.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          {activeGeneration ? (
            <OutputRenderer generation={activeGeneration} />
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-stone-400" />
                </div>
                <h3 className="font-semibold text-stone-900 mb-1">No concept package yet</h3>
                <p className="text-sm text-stone-500 mb-6 text-center max-w-xs">
                  Generate your first concept package to see room programs, compliance analysis, and more.
                </p>
                <Button onClick={handleGenerate} disabled={generating}>
                  {generating ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Generate Concept Package</>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
