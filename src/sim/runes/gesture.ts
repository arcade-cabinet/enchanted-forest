import type { RuneType } from "@/sim/grove/types";

/**
 * Classify a normalized-coordinate gesture polyline into one of the
 * three runes (shield = circular, heal = upward trace, purify = zigzag)
 * or null when the gesture is too short or ambiguous. Pure — no state,
 * no side effects.
 */
export function analyzeRuneGesture(points: { x: number; y: number }[]): RuneType | null {
  if (points.length < 20) return null;

  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const width = maxX - minX;
  const height = maxY - minY;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const distances = points.map((point) => Math.hypot(point.x - centerX, point.y - centerY));
  const avgDistance = distances.reduce((sum, distance) => sum + distance, 0) / distances.length;
  const distanceVariance =
    distances.reduce((sum, distance) => sum + (distance - avgDistance) ** 2, 0) / distances.length;
  const isCircular = distanceVariance < 0.003 && width > 0.15 && height > 0.15;
  const startY = points.slice(0, 5).reduce((sum, point) => sum + point.y, 0) / 5;
  const endY = points.slice(-5).reduce((sum, point) => sum + point.y, 0) / 5;
  const isUpward = startY - endY > 0.2 && height > 0.25;
  let directionChanges = 0;
  let verticalDirectionChanges = 0;
  let lastDirection = 0;
  let lastVerticalDirection = 0;
  let pathLength = 0;

  for (let index = 1; index < points.length; index++) {
    const previous = points[index - 1];
    const current = points[index];
    if (previous && current) {
      pathLength += Math.hypot(current.x - previous.x, current.y - previous.y);
    }
  }

  for (let index = 10; index < points.length; index += 5) {
    const previous = points[index - 10];
    const current = points[index];
    if (!previous || !current) continue;

    const dx = current.x - previous.x;
    const currentDirection = dx > 0.02 ? 1 : dx < -0.02 ? -1 : 0;
    if (currentDirection !== 0 && currentDirection !== lastDirection && lastDirection !== 0) {
      directionChanges++;
    }
    if (currentDirection !== 0) lastDirection = currentDirection;

    const dy = current.y - previous.y;
    const currentVerticalDirection = dy > 0.02 ? 1 : dy < -0.02 ? -1 : 0;
    if (
      currentVerticalDirection !== 0 &&
      currentVerticalDirection !== lastVerticalDirection &&
      lastVerticalDirection !== 0
    ) {
      verticalDirectionChanges++;
    }
    if (currentVerticalDirection !== 0) lastVerticalDirection = currentVerticalDirection;
  }

  const pathRatio = pathLength / Math.max(0.001, Math.hypot(width, height));
  const isZigzag =
    directionChanges + verticalDirectionChanges >= 2 && width > 0.2 && pathRatio > 2.4;

  if (isCircular) return "shield";
  if (isUpward) return "heal";
  if (isZigzag) return "purify";

  return null;
}
