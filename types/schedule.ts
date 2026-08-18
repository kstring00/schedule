export type WorkEntry = {
  date: string;
  type: "work";
  startTime: string;
  endTime: string;
};

export type PtoEntry = {
  date: string;
  type: "pto";
};

export type OffEntry = {
  date: string;
  type: "off";
};

export type ScheduleEntry = WorkEntry | PtoEntry | OffEntry;
export type ScheduleMap = Record<string, ScheduleEntry>;
export type ScheduleView = "month" | "week" | "list";
