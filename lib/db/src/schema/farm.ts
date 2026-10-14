import {
  boolean,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const farmPlots = pgTable("farm_plots", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  crop: text("crop").notNull(),
  location: text("location").notNull(),
  areaHectares: real("area_hectares").notNull(),
  moisturePct: real("moisture_pct").notNull(),
  temperatureC: real("temperature_c").notNull(),
  humidityPct: real("humidity_pct").notNull(),
  vpdKpa: real("vpd_kpa").notNull(),
  status: text("status").notNull(),
  nodeId: text("node_id").notNull(),
  nodeStatus: text("node_status").notNull(),
  lastSync: timestamp("last_sync", { withTimezone: true }).notNull(),
  pumpActive: boolean("pump_active").notNull().default(false),
  pumpDurationMinutes: integer("pump_duration_minutes").notNull().default(0),
  pumpUpdatedAt: timestamp("pump_updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const moistureReadings = pgTable("moisture_readings", {
  id: serial("id").primaryKey(),
  plotId: text("plot_id")
    .notNull()
    .references(() => farmPlots.id, { onDelete: "cascade" }),
  moisturePct: real("moisture_pct").notNull(),
  temperatureC: real("temperature_c").notNull(),
  humidityPct: real("humidity_pct").notNull(),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull(),
});

export const irrigationAlerts = pgTable("irrigation_alerts", {
  id: text("id").primaryKey(),
  plotId: text("plot_id")
    .notNull()
    .references(() => farmPlots.id, { onDelete: "cascade" }),
  severity: text("severity").notNull(),
  title: text("title").notNull(),
  detail: text("detail").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  acknowledged: boolean("acknowledged").notNull().default(false),
});

export const irrigationEvents = pgTable("irrigation_events", {
  id: serial("id").primaryKey(),
  plotId: text("plot_id")
    .notNull()
    .references(() => farmPlots.id, { onDelete: "cascade" }),
  command: text("command").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(0),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
});
