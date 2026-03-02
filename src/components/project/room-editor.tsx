"use client";

import { useState } from "react";
import { X, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZONE_PALETTE } from "./floor-plan-svg";
import type { FloorPlanRoom, OutputJSON } from "@/types";

const FINISH_CODES = ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8"];

const FINISH_LABELS: Record<string, string> = {
  F1: "F1 — General Clinical",
  F2: "F2 — Wet / Semi-Gloss",
  F3: "F3 — Admin / Carpet",
  F4: "F4 — Lab / Sheet Vinyl",
  F5: "F5 — Reception / LVP",
  F6: "F6 — Waiting / Warm",
  F7: "F7 — Utility / Rubber",
  F8: "F8 — Storage / Epoxy",
};

interface RoomEditorProps {
  roomNumber: string;
  output: OutputJSON;
  onClose: () => void;
  onSave: (updates: RoomUpdates) => void;
  saving: boolean;
}

export interface RoomUpdates {
  roomNumber: string;
  roomName?: string;
  width?: number;
  depth?: number;
  finishCode?: string;
}

export function RoomEditor({ roomNumber, output, onClose, onSave, saving }: RoomEditorProps) {
  const fp = output.floor_plan;
  const fpRoom = fp?.rooms.find(r => r.room_number === roomNumber);
  if (!fpRoom) return null;

  return <RoomEditorForm room={fpRoom} onClose={onClose} onSave={onSave} saving={saving} />;
}

function RoomEditorForm({
  room,
  onClose,
  onSave,
  saving,
}: {
  room: FloorPlanRoom;
  onClose: () => void;
  onSave: (updates: RoomUpdates) => void;
  saving: boolean;
}) {
  const [roomName, setRoomName] = useState(room.room_name);
  const [width, setWidth] = useState(room.width);
  const [depth, setDepth] = useState(room.depth);
  const [finishCode, setFinishCode] = useState(room.finish_code.toUpperCase());

  const zonePalette = ZONE_PALETTE[room.zone];
  const hasChanges =
    roomName !== room.room_name ||
    width !== room.width ||
    depth !== room.depth ||
    finishCode !== room.finish_code.toUpperCase();

  const handleSave = () => {
    const updates: RoomUpdates = { roomNumber: room.room_number };
    if (roomName !== room.room_name) updates.roomName = roomName;
    if (width !== room.width) updates.width = width;
    if (depth !== room.depth) updates.depth = depth;
    if (finishCode !== room.finish_code.toUpperCase()) updates.finishCode = finishCode;
    onSave(updates);
  };

  return (
    <div className="bg-white border-l border-stone-200 w-80 overflow-y-auto max-h-[calc(100vh-200px)] shadow-xl">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-stone-100 p-4 z-10">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-stone-900">{room.room_number}</span>
              {zonePalette && (
                <Badge variant="secondary" className="text-[10px]" style={{
                  backgroundColor: zonePalette.fill,
                  color: "#44403c",
                }}>
                  {zonePalette.label}
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-200">
                Edit
              </Badge>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-stone-100 rounded">
            <X className="w-4 h-4 text-stone-400" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Room Name */}
        <div>
          <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-1.5">
            Room Name
          </label>
          <input
            type="text"
            value={roomName}
            onChange={e => setRoomName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
          />
        </div>

        {/* Dimensions */}
        <div>
          <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-1.5">
            Dimensions (ft)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-stone-400 block mb-0.5">Width</label>
              <input
                type="number"
                value={width}
                onChange={e => setWidth(Number(e.target.value))}
                min={4}
                max={60}
                step={0.5}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-[10px] text-stone-400 block mb-0.5">Depth</label>
              <input
                type="number"
                value={depth}
                onChange={e => setDepth(Number(e.target.value))}
                min={4}
                max={60}
                step={0.5}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
              />
            </div>
          </div>
          <div className="text-[10px] text-stone-400 mt-1">
            Area: {Math.round(width * depth)} SF ({Math.round(width * depth * 0.093)} m²)
          </div>
        </div>

        {/* Finish Code */}
        <div>
          <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-1.5">
            Finish Code
          </label>
          <select
            value={finishCode}
            onChange={e => setFinishCode(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-white"
          >
            {FINISH_CODES.map(code => (
              <option key={code} value={code}>
                {FINISH_LABELS[code] ?? code}
              </option>
            ))}
          </select>
        </div>

        {/* Save button */}
        <Button
          className="w-full"
          onClick={handleSave}
          disabled={!hasChanges || saving}
        >
          {saving ? (
            <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-3.5 h-3.5 mr-1" /> Save Changes</>
          )}
        </Button>
      </div>
    </div>
  );
}
