"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  formatCompactTime,
  formatDateTitle,
  formatMonthName,
  formatMonthYear,
  formatShortDay,
  formatTime,
  formatWeekRange,
  fromDateKey,
  getMonthGrid,
  sameDay,
  startOfWeek,
  toDateKey,
  weeksForMonth,
} from "@/lib/date";
import {
  copyWeek,
  formatHours,
  getEntryHours,
  getMonthlySummary,
  getWeeklyTotal,
  isValidWorkEntry,
  repeatWeeklyEntry,
} from "@/lib/schedule";
import { localScheduleStorage } from "@/lib/storage";
import type { ScheduleEntry, ScheduleMap, ScheduleView } from "@/types/schedule";

const PRESETS = [
  ["2–5 PM", "14:00", "17:00"],
  ["1–5 PM", "13:00", "17:00"],
  ["8:30 AM–5 PM", "08:30", "17:00"],
  ["10 AM–3 PM", "10:00", "15:00"],
  ["9 AM–2 PM", "09:00", "14:00"],
] as const;

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function entryLabel(entry?: ScheduleEntry, compact = false): string {
  if (!entry) return "—";
  if (entry.type === "off") return "OFF";
  if (entry.type === "pto") return "PTO";
  if (compact) return `${formatCompactTime(entry.startTime)}–${formatCompactTime(entry.endTime)}`;
  return `${formatTime(entry.startTime)}–${formatTime(entry.endTime)}`;
}

function StatusPill({ entry, compact = false }: { entry?: ScheduleEntry; compact?: boolean }) {
  if (!entry) return null;
  const base = "inline-flex max-w-full items-center truncate rounded-full border px-2 py-1 text-[10px] font-semibold tracking-wide sm:text-xs";
  if (entry.type === "pto") {
    return <span className={`${base} border-solar/45 bg-solar/20 text-ember`}>PTO</span>;
  }
  if (entry.type === "off") {
    return <span className={`${base} border-smoky/30 bg-smoky/15 text-stardust/70`}>OFF</span>;
  }
  return <span className={`${base} border-ember/20 bg-ember/5 text-stardust`}>{entryLabel(entry, compact)}</span>;
}

export default function ScheduleApp() {
  const [mounted, setMounted] = useState(false);
  const [today, setToday] = useState(new Date(2000, 0, 1));
  const [cursorDate, setCursorDate] = useState(new Date(2000, 0, 1));
  const [entries, setEntries] = useState<ScheduleMap>({});
  const [view, setView] = useState<ScheduleView>("month");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [draftStart, setDraftStart] = useState("08:30");
  const [draftEnd, setDraftEnd] = useState("17:00");
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [repeatUntil, setRepeatUntil] = useState("");
  const [copyOpen, setCopyOpen] = useState(false);

  useEffect(() => {
    const now = new Date();
    setToday(now);
    setCursorDate(now);
    setEntries(localScheduleStorage.load());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) localScheduleStorage.save(entries);
  }, [entries, mounted]);

  const displayedMonthSummary = useMemo(() => getMonthlySummary(entries, cursorDate), [entries, cursorDate]);
  const thisWeekHours = useMemo(() => getWeeklyTotal(entries, today), [entries, today]);
  const nextWeekHours = useMemo(() => getWeeklyTotal(entries, addDays(startOfWeek(today), 7)), [entries, today]);
  const actualMonthSummary = useMemo(() => getMonthlySummary(entries, today), [entries, today]);
  const actualMonthHours = actualMonthSummary.scheduledHours + actualMonthSummary.ptoHours;

  const selectedDate = selectedKey ? fromDateKey(selectedKey) : null;
  const selectedEntry = selectedKey ? entries[selectedKey] : undefined;

  function openEditor(date: Date) {
    const key = toDateKey(date);
    const entry = entries[key];
    setSelectedKey(key);
    setRepeatWeekly(false);
    setRepeatUntil(toDateKey(addMonths(date, 1)));
    if (entry?.type === "work") {
      setDraftStart(entry.startTime);
      setDraftEnd(entry.endTime);
    } else {
      setDraftStart("08:30");
      setDraftEnd("17:00");
    }
  }

  function closeEditor() {
    setSelectedKey(null);
    setRepeatWeekly(false);
  }

  function saveEntry(entry: ScheduleEntry) {
    if (entry.type === "work" && !isValidWorkEntry(entry)) return;
    setEntries((current) => {
      if (repeatWeekly && repeatUntil) return repeatWeeklyEntry(current, entry, repeatUntil);
      return { ...current, [entry.date]: entry };
    });
    closeEditor();
  }

  function clearSelectedDay() {
    if (!selectedKey) return;
    setEntries((current) => {
      const next = { ...current };
      delete next[selectedKey];
      return next;
    });
    closeEditor();
  }

  function movePeriod(amount: number) {
    if (view === "week") {
      setCursorDate((date) => addDays(date, amount * 7));
    } else {
      setCursorDate((date) => addMonths(date, amount));
    }
  }

  function goToday() {
    const now = new Date();
    setToday(now);
    setCursorDate(now);
  }

  function confirmCopyWeek() {
    setEntries((current) => copyWeek(current, cursorDate));
    setCopyOpen(false);
    setCursorDate((date) => addDays(startOfWeek(date), 7));
  }

  if (!mounted) {
    return (
      <main className="min-h-screen px-4 py-8 text-stardust sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl animate-pulse rounded-3xl border border-stardust/10 bg-nebula/20 p-8">
          <div className="h-10 w-56 rounded bg-stardust/10" />
          <div className="mt-8 h-[560px] rounded-2xl bg-stardust/5" />
        </div>
      </main>
    );
  }

  const periodTitle = view === "week" ? `Week of ${formatWeekRange(startOfWeek(cursorDate))}` : formatMonthYear(cursorDate);

  return (
    <main className="min-h-screen px-3 py-4 text-stardust sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-col gap-4 lg:mb-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="cosmic-kicker">PERSONAL WORK CALENDAR</p>
            <h1 className="dune-title mt-2 text-4xl font-medium sm:text-5xl">My Schedule</h1>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-3">
            <StatCard label="This Week" value={`${formatHours(thisWeekHours)} hrs`} />
            <StatCard label="This Month" value={`${formatHours(actualMonthHours)} hrs`} />
            <StatCard label="Next Week" value={`${formatHours(nextWeekHours)} hrs`} />
          </div>
        </header>

        <section className="cosmic-panel overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-stardust/10 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center justify-between gap-2 sm:justify-start">
              <button className="icon-button" onClick={() => movePeriod(-1)} aria-label="Previous period">←</button>
              <div className="min-w-0 text-center sm:min-w-56">
                <p className="dune-heading truncate text-lg sm:text-xl">{periodTitle}</p>
              </div>
              <button className="icon-button" onClick={() => movePeriod(1)} aria-label="Next period">→</button>
              <button className="secondary-button ml-1" onClick={goToday}>Today</button>
            </div>

            <div className="view-switcher" aria-label="Calendar view">
              {(["month", "week", "list"] as ScheduleView[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setView(item)}
                  className={view === item ? "view-button view-button-active" : "view-button"}
                >
                  {item === "list" ? "Schedule" : item.charAt(0).toUpperCase() + item.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {view === "month" && (
            <MonthView
              cursorDate={cursorDate}
              today={today}
              entries={entries}
              selectedKey={selectedKey}
              onSelect={openEditor}
            />
          )}

          {view === "week" && (
            <WeekView
              cursorDate={cursorDate}
              today={today}
              entries={entries}
              onSelect={openEditor}
              onCopy={() => setCopyOpen(true)}
            />
          )}

          {view === "list" && <ListView cursorDate={cursorDate} entries={entries} onSelect={openEditor} />}
        </section>

        {view === "month" && (
          <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard label="Scheduled Hours" value={`${formatHours(displayedMonthSummary.scheduledHours)} hrs`} />
            <SummaryCard label="PTO Hours" value={`${formatHours(displayedMonthSummary.ptoHours)} hrs`} />
            <SummaryCard label="Work Days" value={String(displayedMonthSummary.workDays)} />
            <SummaryCard label="Days Off" value={String(displayedMonthSummary.offDays)} />
          </section>
        )}

        <footer className="py-6 text-center text-xs tracking-wide text-stardust/40">
          {formatMonthName(cursorDate)} · Monday–Sunday work weeks · Weekday PTO counts as 8 hours
        </footer>
      </div>

      {selectedDate && selectedKey && (
        <DayEditor
          date={selectedDate}
          entry={selectedEntry}
          draftStart={draftStart}
          draftEnd={draftEnd}
          repeatWeekly={repeatWeekly}
          repeatUntil={repeatUntil}
          onDraftStart={setDraftStart}
          onDraftEnd={setDraftEnd}
          onRepeatWeekly={setRepeatWeekly}
          onRepeatUntil={setRepeatUntil}
          onSave={saveEntry}
          onClear={clearSelectedDay}
          onClose={closeEditor}
        />
      )}

      {copyOpen && (
        <CopyWeekDialog
          cursorDate={cursorDate}
          entries={entries}
          onCancel={() => setCopyOpen(false)}
          onConfirm={confirmCopyWeek}
        />
      )}
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stardust/10 bg-nebula/25 px-3 py-3 shadow-glow sm:min-w-32 sm:px-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-stardust/45">{label}</p>
      <p className="mt-1 text-base font-semibold text-ember sm:text-lg">{value}</p>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stardust/10 bg-nebula/20 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-stardust/45">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-stardust">{value}</p>
    </div>
  );
}

function MonthView({
  cursorDate,
  today,
  entries,
  selectedKey,
  onSelect,
}: {
  cursorDate: Date;
  today: Date;
  entries: ScheduleMap;
  selectedKey: string | null;
  onSelect: (date: Date) => void;
}) {
  const days = getMonthGrid(cursorDate);

  return (
    <div className="p-2 sm:p-4">
      <div className="grid grid-cols-7 border-b border-stardust/10 pb-2">
        {WEEKDAYS.map((day) => (
          <div key={day} className="px-1 text-center text-[10px] font-semibold tracking-[0.16em] text-stardust/40 sm:text-xs">
            {day}
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1 sm:gap-2">
        {days.map((date) => {
          const key = toDateKey(date);
          const entry = entries[key];
          const inMonth = date.getMonth() === cursorDate.getMonth();
          const isToday = sameDay(date, today);
          const isSelected = selectedKey === key;
          return (
            <button
              key={key}
              onClick={() => onSelect(date)}
              className={`calendar-day ${inMonth ? "" : "calendar-day-muted"} ${isToday ? "calendar-day-today" : ""} ${isSelected ? "calendar-day-selected" : ""}`}
            >
              <span className="flex items-center justify-between">
                <span className={`text-xs font-semibold sm:text-sm ${isToday ? "text-ember" : "text-stardust/75"}`}>{date.getDate()}</span>
                {entry?.type === "work" && <span className="hidden text-[9px] text-solar/70 lg:inline">{formatHours(getEntryHours(entry))}h</span>}
              </span>
              <span className="mt-auto block min-w-0 pt-2 text-left">
                <StatusPill entry={entry} compact />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({
  cursorDate,
  today,
  entries,
  onSelect,
  onCopy,
}: {
  cursorDate: Date;
  today: Date;
  entries: ScheduleMap;
  onSelect: (date: Date) => void;
  onCopy: () => void;
}) {
  const monday = startOfWeek(cursorDate);
  const days = Array.from({ length: 7 }, (_, index) => addDays(monday, index));
  const total = getWeeklyTotal(entries, monday);

  return (
    <div className="p-3 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="cosmic-kicker">WEEK TOTAL</p>
          <p className="mt-1 text-3xl font-semibold text-ember">{formatHours(total)} hrs</p>
        </div>
        <button className="secondary-button" onClick={onCopy}>Copy Week →</button>
      </div>
      <div className="grid gap-2 md:grid-cols-7">
        {days.map((date) => {
          const key = toDateKey(date);
          const entry = entries[key];
          return (
            <button
              key={key}
              onClick={() => onSelect(date)}
              className={`week-day-card ${sameDay(date, today) ? "calendar-day-today" : ""}`}
            >
              <div>
                <p className="text-[10px] font-semibold tracking-[0.16em] text-stardust/40">{formatShortDay(date)}</p>
                <p className="mt-1 text-2xl font-semibold text-stardust">{date.getDate()}</p>
              </div>
              <div className="mt-5">
                <StatusPill entry={entry} />
                <p className="mt-2 text-xs text-stardust/40">{entry ? `${formatHours(getEntryHours(entry))} hrs` : "Tap to add"}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ListView({ cursorDate, entries, onSelect }: { cursorDate: Date; entries: ScheduleMap; onSelect: (date: Date) => void }) {
  const weeks = weeksForMonth(cursorDate);
  return (
    <div className="space-y-3 p-3 sm:p-5">
      {weeks.map((monday) => {
        const total = getWeeklyTotal(entries, monday);
        return (
          <article key={toDateKey(monday)} className="rounded-2xl border border-stardust/10 bg-velvet/45 p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-4 border-b border-stardust/10 pb-3">
              <h2 className="dune-heading text-sm sm:text-base">Week of {formatWeekRange(monday)}</h2>
              <p className="whitespace-nowrap text-sm font-semibold text-ember">{formatHours(total)} hrs</p>
            </div>
            <div className="divide-y divide-stardust/5">
              {Array.from({ length: 7 }, (_, index) => addDays(monday, index)).map((date) => {
                const entry = entries[toDateKey(date)];
                return (
                  <button key={toDateKey(date)} onClick={() => onSelect(date)} className="grid w-full grid-cols-[48px_36px_1fr_auto] items-center gap-2 py-2 text-left hover:text-ember">
                    <span className="text-xs font-semibold tracking-wider text-stardust/45">{formatShortDay(date)}</span>
                    <span className="text-sm text-stardust/70">{date.getDate()}</span>
                    <span className="truncate text-sm text-stardust/85">{entryLabel(entry)}</span>
                    <span className="text-xs text-stardust/35">{entry ? `${formatHours(getEntryHours(entry))}h` : ""}</span>
                  </button>
                );
              })}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function DayEditor({
  date,
  entry,
  draftStart,
  draftEnd,
  repeatWeekly,
  repeatUntil,
  onDraftStart,
  onDraftEnd,
  onRepeatWeekly,
  onRepeatUntil,
  onSave,
  onClear,
  onClose,
}: {
  date: Date;
  entry?: ScheduleEntry;
  draftStart: string;
  draftEnd: string;
  repeatWeekly: boolean;
  repeatUntil: string;
  onDraftStart: (value: string) => void;
  onDraftEnd: (value: string) => void;
  onRepeatWeekly: (value: boolean) => void;
  onRepeatUntil: (value: string) => void;
  onSave: (entry: ScheduleEntry) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const key = toDateKey(date);
  const draftEntry: ScheduleEntry = { date: key, type: "work", startTime: draftStart, endTime: draftEnd };
  const draftHours = getEntryHours(draftEntry);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={onClose}>
      <section className="editor-sheet" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-stardust/10 p-5">
          <div>
            <p className="cosmic-kicker">EDIT DAY</p>
            <h2 className="dune-heading mt-2 text-xl">{formatDateTitle(date)}</h2>
            {entry && <p className="mt-2 text-sm text-stardust/50">Current: {entryLabel(entry)} · {formatHours(getEntryHours(entry))} hrs</p>}
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close editor">×</button>
        </div>

        <div className="max-h-[72vh] space-y-6 overflow-y-auto p-5">
          <div>
            <p className="section-label">Quick entry</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PRESETS.map(([label, start, end]) => (
                <button key={label} className="preset-button" onClick={() => onSave({ date: key, type: "work", startTime: start, endTime: end })}>{label}</button>
              ))}
              <button className="preset-button border-smoky/35 text-stardust/70" onClick={() => onSave({ date: key, type: "off" })}>OFF</button>
              <button className="preset-button border-solar/45 bg-solar/10 text-ember" onClick={() => onSave({ date: key, type: "pto" })}>PTO</button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className="section-label">Custom shift</p>
              <span className="text-sm font-semibold text-ember">{formatHours(draftHours)} hrs</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="field-label">Start<input className="time-input" type="time" value={draftStart} onChange={(event) => onDraftStart(event.target.value)} /></label>
              <label className="field-label">End<input className="time-input" type="time" value={draftEnd} onChange={(event) => onDraftEnd(event.target.value)} /></label>
            </div>
          </div>

          <div className="rounded-2xl border border-stardust/10 bg-nebula/20 p-4">
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <span>
                <span className="block text-sm font-semibold text-stardust">Repeat Shift</span>
                <span className="mt-1 block text-xs text-stardust/45">Repeat this exact entry every {formatDateTitle(date).split(",")[0]}.</span>
              </span>
              <input type="checkbox" checked={repeatWeekly} onChange={(event) => onRepeatWeekly(event.target.checked)} className="h-5 w-5 accent-[#E07A2E]" />
            </label>
            {repeatWeekly && (
              <label className="field-label mt-4">Repeat until<input className="time-input" type="date" min={key} value={repeatUntil} onChange={(event) => onRepeatUntil(event.target.value)} /></label>
            )}
          </div>

          <button className="primary-button w-full" disabled={draftHours <= 0} onClick={() => onSave(draftEntry)}>Save Custom Shift</button>
          {entry && <button className="danger-button w-full" onClick={onClear}>Clear Day</button>}
        </div>
      </section>
    </div>
  );
}

function CopyWeekDialog({
  cursorDate,
  entries,
  onCancel,
  onConfirm,
}: {
  cursorDate: Date;
  entries: ScheduleMap;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const monday = startOfWeek(cursorDate);
  const targetMonday = addDays(monday, 7);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm" onMouseDown={onCancel}>
      <section className="w-full max-w-lg rounded-3xl border border-ember/20 bg-velvet p-5 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <p className="cosmic-kicker">COPY WEEK</p>
        <h2 className="dune-heading mt-2 text-xl">{formatWeekRange(monday)} → {formatWeekRange(targetMonday)}</h2>
        <p className="mt-2 text-sm text-stardust/50">The next week will be replaced with this Monday–Sunday schedule.</p>
        <div className="my-5 divide-y divide-stardust/5 rounded-2xl border border-stardust/10 px-4">
          {Array.from({ length: 7 }, (_, index) => addDays(monday, index)).map((date) => (
            <div key={toDateKey(date)} className="flex items-center justify-between py-2 text-sm">
              <span className="text-stardust/55">{formatShortDay(date)}</span>
              <span>{entryLabel(entries[toDateKey(date)])}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="secondary-button flex-1" onClick={onCancel}>Cancel</button>
          <button className="primary-button flex-1" onClick={onConfirm}>Copy Week</button>
        </div>
      </section>
    </div>
  );
}
