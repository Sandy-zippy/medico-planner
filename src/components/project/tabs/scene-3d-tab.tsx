"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html, Grid } from "@react-three/drei";
import type { Scene3DData } from "@/types";

function WallMesh({ wall }: { wall: Scene3DData["walls"][0] }) {
  return (
    <mesh position={wall.position}>
      <boxGeometry args={wall.size} />
      <meshStandardMaterial color={wall.color} />
    </mesh>
  );
}

function FloorTile({ floor }: { floor: Scene3DData["floors"][0] }) {
  return (
    <mesh
      position={floor.position}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={floor.size} />
      <meshStandardMaterial color={floor.color} />
    </mesh>
  );
}

function RoomLabel({ label }: { label: Scene3DData["labels"][0] }) {
  return (
    <Html
      position={label.position}
      center
      distanceFactor={15}
      style={{ pointerEvents: "none" }}
    >
      <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded shadow-sm border border-stone-200 whitespace-nowrap">
        <div className="text-[10px] font-bold text-stone-700">{label.room_number}</div>
        <div className="text-[9px] text-stone-500">{label.room_name}</div>
      </div>
    </Html>
  );
}

export function Scene3DTab({ scene }: { scene: Scene3DData }) {
  return (
    <div className="w-full h-[600px] bg-stone-50 rounded-lg border border-stone-200 overflow-hidden">
      <Canvas
        camera={{
          position: scene.camera.position,
          fov: 50,
          near: 0.1,
          far: 500,
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 15, 10]} intensity={0.8} castShadow />
        <directionalLight position={[-5, 10, -5]} intensity={0.3} />

        {/* Ground grid */}
        <Grid
          args={[100, 100]}
          position={[0, -0.01, 0]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#d4d4d4"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#a8a8a8"
          fadeDistance={50}
          infiniteGrid
        />

        {/* Floor tiles */}
        {scene.floors.map((floor) => (
          <FloorTile key={floor.room_number} floor={floor} />
        ))}

        {/* Walls */}
        {scene.walls.map((wall) => (
          <WallMesh key={wall.id} wall={wall} />
        ))}

        {/* Room labels */}
        {scene.labels.map((label) => (
          <RoomLabel key={label.room_number} label={label} />
        ))}

        {/* Controls */}
        <OrbitControls
          target={scene.camera.target}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={2}
          maxDistance={80}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>

      {/* Control hints */}
      <div className="absolute bottom-3 left-3 text-[10px] text-stone-400 bg-white/80 px-2 py-1 rounded">
        Drag: rotate &middot; Scroll: zoom &middot; Right-click: pan
      </div>
    </div>
  );
}
