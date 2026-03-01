import type { FloorPlanGeometry } from "@/types";

const FINISH_FILLS: Record<string, string> = {
  F1: "#F5F0E8", F2: "#E0EBF0", F3: "#D9E8D9", F4: "#DCE8F0",
  F5: "#F0ECD8", F6: "#F5E8D8", F7: "#E0DCD5", F8: "#EDE8E0",
};
const CORRIDOR_FILL = "#F5F5F0";
const DEFAULT_FILL = "#E8E4DE";

export function FloorPlanThumbnail({
  floorPlan,
  className,
}: {
  floorPlan: FloorPlanGeometry;
  className?: string;
}) {
  const fp = floorPlan;
  const scale = 4; // smaller scale for thumbnail
  const pad = 4;
  const svgW = fp.envelope.width * scale + pad * 2;
  const svgH = fp.envelope.depth * scale + pad * 2;

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      className={`w-full h-full ${className ?? ""}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <rect x={0} y={0} width={svgW} height={svgH} fill="#fafaf9" />
      <g transform={`translate(${pad}, ${pad})`}>
        {/* Corridor */}
        <rect
          x={fp.corridor.x * scale} y={fp.corridor.y * scale}
          width={fp.corridor.width * scale} height={fp.corridor.depth * scale}
          fill={CORRIDOR_FILL}
        />

        {/* Room fills */}
        {fp.rooms.map(room => {
          const key = room.finish_code.toUpperCase().replace(/\s/g, "");
          return (
            <rect
              key={room.room_number}
              x={room.x * scale} y={room.y * scale}
              width={room.width * scale} height={room.depth * scale}
              fill={FINISH_FILLS[key] ?? DEFAULT_FILL}
            />
          );
        })}

        {/* Walls — thin lines for thumbnail */}
        {fp.walls.map(wall => {
          const isExterior = wall.wall_type === "W1" || wall.wall_type === "W2";
          return (
            <line
              key={wall.id}
              x1={wall.x1 * scale} y1={wall.y1 * scale}
              x2={wall.x2 * scale} y2={wall.y2 * scale}
              stroke={isExterior ? "#1c1917" : "#9ca3af"}
              strokeWidth={isExterior ? 2 : 1}
            />
          );
        })}
      </g>
    </svg>
  );
}
