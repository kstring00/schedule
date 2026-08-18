import { SEEDED_SCHEDULE } from "@/lib/seed-schedule";
import type { ScheduleMap } from "@/types/schedule";

const STORAGE_KEY = "cosmic-schedule:v2";
const LEGACY_STORAGE_KEY = "cosmic-schedule:v1";

export interface ScheduleStorage {
  load(): ScheduleMap;
  save(entries: ScheduleMap): void;
  clear(): void;
}

function parseSchedule(raw: string | null): ScheduleMap | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ScheduleMap;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export const localScheduleStorage: ScheduleStorage = {
  load() {
    if (typeof window === "undefined") return {};

    const current = parseSchedule(window.localStorage.getItem(STORAGE_KEY));
    if (current) return current;

    const legacy = parseSchedule(window.localStorage.getItem(LEGACY_STORAGE_KEY)) ?? {};
    return { ...SEEDED_SCHEDULE, ...legacy };
  },
  save(entries) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({}));
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  },
};
