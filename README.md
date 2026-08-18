# My Schedule

A mobile-first personal work calendar built with Next.js, TypeScript, React, Tailwind CSS, and localStorage.

## Features

- Month, week, and schedule/list views
- Quick shift presets plus custom start/end times
- Monday–Sunday weekly hour totals
- Weekday PTO automatically counts as 8 hours; weekend PTO counts as 0
- Days off and PTO are visually distinct
- Repeat a shift weekly through a selected date
- Copy a Monday–Sunday week into the following week with confirmation
- Compact this-week, this-month, and next-week hour dashboard
- Monthly scheduled hours, PTO hours, work days, and off days
- Persistent browser storage behind a small storage abstraction that can later be replaced by Supabase
- Responsive Dune-inspired cosmic design

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Validate

```bash
npm run lint
npm run build
```

## Persistence

Schedule data is stored in the current browser using `localStorage` under the key `cosmic-schedule:v1`. Clearing browser storage will clear the schedule. There is no account sync or cloud backup yet.
