/** Squarified treemap layout (Bruls et al. 2000) */

export interface TreemapInput {
  area: number;
  index: number;
}

export interface TreemapRect {
  roomIndex: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Container {
  x: number;
  y: number;
  w: number;
  h: number;
}

function worst(row: number[], sideLength: number, totalArea: number): number {
  if (row.length === 0) return Infinity;
  const s2 = totalArea * totalArea;
  const rMax = Math.max(...row);
  const rMin = Math.min(...row);
  return Math.max((sideLength * sideLength * rMax) / s2, s2 / (sideLength * sideLength * rMin));
}

function layoutRow(
  row: { area: number; index: number }[],
  container: Container,
  isHorizontal: boolean
): { rects: TreemapRect[]; remaining: Container } {
  const totalArea = row.reduce((s, r) => s + r.area, 0);
  const rects: TreemapRect[] = [];

  if (isHorizontal) {
    const rowWidth = totalArea / container.h;
    let y = container.y;
    for (const item of row) {
      const h = item.area / rowWidth;
      rects.push({ roomIndex: item.index, x: container.x, y, w: rowWidth, h });
      y += h;
    }
    return {
      rects,
      remaining: {
        x: container.x + rowWidth,
        y: container.y,
        w: container.w - rowWidth,
        h: container.h,
      },
    };
  } else {
    const rowHeight = totalArea / container.w;
    let x = container.x;
    for (const item of row) {
      const w = item.area / rowHeight;
      rects.push({ roomIndex: item.index, x, y: container.y, w, h: rowHeight });
      x += w;
    }
    return {
      rects,
      remaining: {
        x: container.x,
        y: container.y + rowHeight,
        w: container.w,
        h: container.h - rowHeight,
      },
    };
  }
}

export function squarify(items: TreemapInput[], container: Container): TreemapRect[] {
  if (items.length === 0) return [];

  // Normalize areas to fill container
  const totalInput = items.reduce((s, i) => s + i.area, 0);
  if (totalInput <= 0) return [];

  const containerArea = container.w * container.h;
  const normalized = items
    .map((item) => ({
      area: (item.area / totalInput) * containerArea,
      index: item.index,
    }))
    .sort((a, b) => b.area - a.area);

  const allRects: TreemapRect[] = [];
  let remaining = { ...container };
  let i = 0;

  while (i < normalized.length) {
    const isHorizontal = remaining.w >= remaining.h;
    const side = isHorizontal ? remaining.h : remaining.w;

    const row: { area: number; index: number }[] = [normalized[i]];
    let rowAreaSum = normalized[i].area;
    i++;

    while (i < normalized.length) {
      const candidate = normalized[i];
      const newRow = [...row.map((r) => r.area), candidate.area];
      const newSum = rowAreaSum + candidate.area;

      if (worst(newRow, side, newSum) <= worst(row.map((r) => r.area), side, rowAreaSum)) {
        row.push(candidate);
        rowAreaSum = newSum;
        i++;
      } else {
        break;
      }
    }

    const result = layoutRow(row, remaining, isHorizontal);
    allRects.push(...result.rects);
    remaining = result.remaining;
  }

  return allRects;
}
