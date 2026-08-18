import { addDays, fromDateKey, isWeekend, startOfMonth, startOfWeek, toDateKey } from "@/lib/date";
import type { ScheduleEntry, ScheduleMap, WorkEntry } from "@/types/schedule";

export function getEntryHours(entry?: ScheduleEntry): number {
  if (!entry || entry.type === "off") return 0;
  if (entry.type === "pto") return isWeekend(fromDateKey(entry.date)) ? 0 : 8;

  const [startHour, startMinute] = entry.startTime.split(":").map(Number);
  const [endHour, endMinute] = entry.endTime.split(":").map(Number);
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  return Math.max(0, (end - start) / 60);
}

export function getWeeklyTotal(entries: ScheduleMap, weekDate: Date): number {
  const monday = startOfWeek(weekDate);
  return Array.from({ length: 7 }, (_, index) => entries[toDateKey(addDays(monday, index))])
    .reduce((total, entry) => total + getEntryHours(entry), 0);
}

export function getMonthlySummary(entries: ScheduleMap, monthDate: Date) {
  const monthStart = startOfMonth(monthDate);
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  let scheduledHours = 0;
  let ptoHours = 0;
  let workDays = 0;
  let offDays = 0;

  Object.values(entries).forEach((entry) => {
    const date = fromDateKey(entry.date);
    if (date.getFullYear() !== year || date.getMonth() !== month) return;
    if (entry.type === "work") {
      scheduledHours += getEntryHours(entry);
      workDays += 1;
    } else if (entry.type === "pto") {
      ptoHours += getEntryHours(entry);
    } else if (entry.type === "off") {
      offDays += 1;
    }
  });

  return { scheduledHours, ptoHours, workDays, offDays };
}

export function formatHours(hours: number): string {
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1).replace(/\.0$/, "");
}

export function copyWeek(entries: ScheduleMap, sourceWeekDate: Date): ScheduleMap {
  const result = { ...entries };
  const sourceMonday = startOfWeek(sourceWeekDate);

  for (let index = 0; index < 7; index += 1) {
    const sourceKey = toDateKey(addDays(sourceMonday, index));
    const targetKey = toDateKey(addDays(sourceMonday, index + 7));
    const source = entries[sourceKey];
    if (source) {
      result[targetKey] = { ...source, date: targetKey } as ScheduleEntry;
    } else {
      delete result[targetKey];
    }
  }

  return result;
}

export function repeatWeeklyEntry(entries: ScheduleMap, entry: ScheduleEntry, untilKey: string): ScheduleMap {
  const result = { ...entries };
  const start = fromDateKey(entry.date);
  const until = fromDateKey(untilKey);
  if (until < start) return result;

  for (let cursor = start; cursor <= until; cursor = addDays(cursor, 7)) {
    const key = toDateKey(cursor);
    result[key] = { ...entry, date: key } as ScheduleEntry;
  }

  return result;
}

export function isValidWorkEntry(entry: ScheduleEntry): entry is WorkEntry {
  return entry.type === "work" && getEntryHours(entry) > 0;
}
