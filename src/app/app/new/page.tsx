"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Plus, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { CLINIC_TYPES, PROVINCES, BUDGET_RANGES, TIMELINES, BUILDING_TYPES, CEILING_TYPES, calculateOccupancy } from "@/lib/constants";
import { getDefaultRooms } from "@/lib/room-templates";
import { FileUpload } from "@/components/ui/file-upload";
import type { RoomConfig } from "@/types";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clinicType, setClinicType] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [areaSqft, setAreaSqft] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [timeline, setTimeline] = useState("");
  const [rooms, setRooms] = useState<RoomConfig[]>([]);
  const [notes, setNotes] = useState("");
  const [existingSpace, setExistingSpace] = useState(false);
  const [address, setAddress] = useState("");
  const [buildingType, setBuildingType] = useState("");
  const [ceilingType, setCeilingType] = useState("tbar");
  const [soundproof, setSoundproof] = useState(false);
  const [plumbingFixtures, setPlumbingFixtures] = useState("");
  const [equipmentNotes, setEquipmentNotes] = useState("");
  const [floorPlanUrls, setFloorPlanUrls] = useState<string[]>([]);
  const [logoUrl, setLogoUrl] = useState<string[]>([]);
  const [inspirationUrls, setInspirationUrls] = useState<string[]>([]);

  const area = parseInt(areaSqft) || 0;
  const occupancy = area > 0 && clinicType ? calculateOccupancy(area, clinicType) : null;

  const handleClinicTypeChange = (value: string) => {
    setClinicType(value);
    setRooms(getDefaultRooms(value));
  };

  const updateRoom = (index: number, field: keyof RoomConfig, value: string | number) => {
    setRooms(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const addRoom = () => {
    setRooms(prev => [...prev, { name: "", quantity: 1, area_sqft: 100 }]);
  };

  const removeRoom = (index: number) => {
    setRooms(prev => prev.filter((_, i) => i !== index));
  };

  const totalProgrammedArea = rooms.reduce((sum, r) => sum + (r.area_sqft ?? 0) * r.quantity, 0);
  const circulationArea = area - totalProgrammedArea;
  const circulationPercent = area > 0 ? ((circulationArea / area) * 100).toFixed(0) : "0";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicType || !province || !areaSqft || !budgetRange || !timeline || !buildingType) return;

    setLoading(true);

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clinic_type: clinicType,
        province,
        city,
        area_sqft: area,
        budget_range: budgetRange,
        timeline,
        rooms_json: rooms,
        notes,
        existing_space: existingSpace,
        address,
        building_type: buildingType,
        ceiling_type: ceilingType,
        soundproof,
        plumbing_fixtures: plumbingFixtures ? { count: parseInt(plumbingFixtures) || 0 } : {},
        equipment_notes: equipmentNotes,
        upload_urls: floorPlanUrls,
        logo_url: logoUrl[0] || null,
        inspiration_urls: inspirationUrls,
        status: "draft",
      }),
    });

    if (!res.ok) {
      console.error(await res.text());
      setLoading(false);
      return;
    }

    const data = await res.json();
    router.push(`/app/${data.id}`);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/app" className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to projects
      </Link>

      <h1 className="text-2xl font-bold tracking-tight text-stone-900 mb-2">New Project</h1>
      <p className="text-sm text-stone-500 mb-8">Define your space requirements and generate a full construction document package.</p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Clinic Type & Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Project Details</CardTitle>
            <CardDescription>Basic information about your project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Project Type *</Label>
                <Select value={clinicType} onValueChange={handleClinicTypeChange}>
                  <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                  <SelectContent>
                    {CLINIC_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Province *</Label>
                <Select value={province} onValueChange={setProvince}>
                  <SelectTrigger><SelectValue placeholder="Select province..." /></SelectTrigger>
                  <SelectContent>
                    {PROVINCES.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Building Type *</Label>
                <Select value={buildingType} onValueChange={setBuildingType}>
                  <SelectTrigger><SelectValue placeholder="Select building type..." /></SelectTrigger>
                  <SelectContent>
                    {BUILDING_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ceiling Type</Label>
                <Select value={ceilingType} onValueChange={setCeilingType}>
                  <SelectTrigger><SelectValue placeholder="Select ceiling..." /></SelectTrigger>
                  <SelectContent>
                    {CEILING_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Toronto" />
              </div>
              <div className="space-y-2">
                <Label>Total Area (SF) *</Label>
                <Input
                  type="number"
                  value={areaSqft}
                  onChange={e => setAreaSqft(e.target.value)}
                  placeholder="e.g. 2000"
                  min={100}
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Budget Range *</Label>
                <Select value={budgetRange} onValueChange={setBudgetRange}>
                  <SelectTrigger><SelectValue placeholder="Select budget..." /></SelectTrigger>
                  <SelectContent>
                    {BUDGET_RANGES.map(b => (
                      <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Timeline *</Label>
                <Select value={timeline} onValueChange={setTimeline}>
                  <SelectTrigger><SelectValue placeholder="Select timeline..." /></SelectTrigger>
                  <SelectContent>
                    {TIMELINES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Street address" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plumbing Fixtures (count)</Label>
                <Input
                  type="number"
                  value={plumbingFixtures}
                  onChange={e => setPlumbingFixtures(e.target.value)}
                  placeholder="e.g. 8"
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label>Equipment / Furniture Notes</Label>
                <Input value={equipmentNotes} onChange={e => setEquipmentNotes(e.target.value)} placeholder="Special equipment or furniture requirements" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="existing"
                  checked={existingSpace}
                  onChange={e => setExistingSpace(e.target.checked)}
                  className="rounded border-stone-300"
                />
                <Label htmlFor="existing" className="font-normal">Existing space (renovation)</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="soundproof"
                  checked={soundproof}
                  onChange={e => setSoundproof(e.target.checked)}
                  className="rounded border-stone-300"
                />
                <Label htmlFor="soundproof" className="font-normal">Soundproofing required</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Occupancy Stats */}
        {occupancy && (
          <Card className="bg-stone-900 text-white">
            <CardContent className="py-4">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{occupancy.occupancyLoad}</div>
                  <div className="text-xs text-stone-400">Occupant Load</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{occupancy.requiredExits}</div>
                  <div className="text-xs text-stone-400">Required Exits</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{occupancy.requiredWashrooms}</div>
                  <div className="text-xs text-stone-400">Washrooms</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{occupancy.areaM2.toFixed(0)}</div>
                  <div className="text-xs text-stone-400">Area (m&sup2;)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Room Program */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Room Program</CardTitle>
                <CardDescription>
                  {rooms.length > 0
                    ? `${totalProgrammedArea.toLocaleString()} SF programmed — ${circulationPercent}% circulation`
                    : "Select a project type above to load default rooms"}
                </CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addRoom}>
                <Plus className="w-4 h-4 mr-1" /> Add Room
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {rooms.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-8">
                Select a project type to auto-populate rooms, or add rooms manually.
              </p>
            ) : (
              <div className="space-y-3">
                {rooms.map((room, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Input
                      value={room.name}
                      onChange={e => updateRoom(i, "name", e.target.value)}
                      placeholder="Room name"
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={room.quantity}
                      onChange={e => updateRoom(i, "quantity", parseInt(e.target.value) || 1)}
                      className="w-20"
                      min={1}
                    />
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={room.area_sqft}
                        onChange={e => updateRoom(i, "area_sqft", parseInt(e.target.value) || 0)}
                        className="w-24"
                        min={0}
                      />
                      <span className="text-xs text-stone-400">SF</span>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeRoom(i)}>
                      <X className="w-4 h-4 text-stone-400" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {totalProgrammedArea > area && area > 0 && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                Room program exceeds available area by {(totalProgrammedArea - area).toLocaleString()} SF.
                Consider reducing room sizes.
              </div>
            )}

            {/* Feasibility Check */}
            {area > 0 && rooms.length > 0 && totalProgrammedArea <= area && (
              <div className={`mt-4 p-3 text-sm rounded-lg ${
                parseInt(circulationPercent) < 15
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : parseInt(circulationPercent) < 25
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}>
                <div className="font-medium mb-1">
                  {parseInt(circulationPercent) < 15
                    ? "Feasibility Warning — Program Too Tight"
                    : parseInt(circulationPercent) < 25
                    ? "Feasibility Caution — Circulation Is Tight"
                    : "Feasibility OK — Adequate Circulation"}
                </div>
                <div>
                  {circulationArea.toLocaleString()} SF ({circulationPercent}%) available for corridors, walls, and mechanical.
                  {parseInt(circulationPercent) < 15 && " Minimum 15% needed. Reduce room sizes or remove low-priority spaces."}
                  {parseInt(circulationPercent) >= 15 && parseInt(circulationPercent) < 25 && " 25-30% is typical for healthcare and commercial."}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* File Uploads */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Uploads</CardTitle>
            <CardDescription>Floor plans, branding, and inspiration images</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUpload
              label="Floor Plans (PDF/Image)"
              category="floorplan"
              accept=".pdf,.png,.jpg,.jpeg,.dwg"
              multiple
              urls={floorPlanUrls}
              onUrlsChange={setFloorPlanUrls}
            />
            <FileUpload
              label="Logo / Branding"
              category="logo"
              accept=".png,.jpg,.jpeg,.svg"
              urls={logoUrl}
              onUrlsChange={setLogoUrl}
            />
            <FileUpload
              label="Inspiration Images"
              category="inspiration"
              accept=".png,.jpg,.jpeg"
              multiple
              urls={inspirationUrls}
              onUrlsChange={setInspirationUrls}
            />
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any special requirements, constraints, or preferences..."
              rows={4}
            />
          </CardContent>
        </Card>

        <Separator />

        <div className="flex items-center justify-between">
          <Link href="/app">
            <Button type="button" variant="ghost">Cancel</Button>
          </Link>
          <Button
            type="submit"
            disabled={loading || !clinicType || !province || !areaSqft || !budgetRange || !timeline || !buildingType}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
            ) : (
              "Create Project"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
