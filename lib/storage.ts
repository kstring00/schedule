import type { ScheduleMap } from "@/types/schedule";

const STORAGE_KEY = "cosmic-schedule:v1";

export interface ScheduleStorage {
  load(): ScheduleMap;
  save(entries: ScheduleMap): void;
  clear(): void;
}

export const localScheduleStorage: ScheduleStorage = {
  load() {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as ScheduleMap;
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  },
  save(entries) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
  },
};
