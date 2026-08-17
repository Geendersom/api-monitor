import type { UptimeBarSegment } from "../types/api.js";

export const createUptimeBars = (
  length: number,
  issues: Array<{ index: number; type: "down" | "warning" }>,
): UptimeBarSegment[] => {
  const issueMap = new Map(issues.map((issue) => [issue.index, issue.type]));

  return Array.from({ length: length }, (_, index) => {
    const issue = issueMap.get(index);
    if (issue === "down") {
      return "down";
    }
    if (issue === "warning") {
      return "warning";
    }
    return "up";
  });
};

export const UPTIME_BAR_COUNT_7D = 14;
export const UPTIME_BAR_COUNT_30D = 30;

export const createDefaultUptimeBars = (length: number): UptimeBarSegment[] =>
  createUptimeBars(length, []);
