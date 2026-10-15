import {
  AcknowledgeAlertParams,
  AcknowledgeAlertResponse,
  CreatePlotBody,
  CreatePlotResponse,
  ControlIrrigationBody,
  ControlIrrigationParams,
  ControlIrrigationResponse,
  GetFarmDashboardResponse,
  GetPlotTwinParams,
  GetPlotTwinResponse,
  GetWeeklyReportResponse,
  ListAlertsResponse,
  ListPlotsResponse,
  UpdatePlotBody,
  UpdatePlotParams,
  UpdatePlotResponse,
} from "@workspace/api-zod";
import {
  db,
  farmPlots,
  irrigationAlerts,
  irrigationEvents,
  moistureReadings,
} from "@workspace/db";
import { and, desc, eq, gte } from "drizzle-orm";
import { Router, type IRouter, type RequestHandler } from "express";
import { randomUUID } from "node:crypto";
import { requireFarmAdmin, requireFarmUser } from "../middlewares/farmAuth";

const router: IRouter = Router();
const dayMs = 24 * 60 * 60 * 1000;

function asPlot(row: typeof farmPlots.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    crop: row.crop,
    location: row.location,
    areaHectares: row.areaHectares,
    moisturePct: row.moisturePct,
    temperatureC: row.temperatureC,
    humidityPct: row.humidityPct,
    vpdKpa: row.vpdKpa,
    status: row.status,
    nodeId: row.nodeId,
    nodeStatus: row.nodeStatus,
    lastSync: row.lastSync?.toISOString() ?? null,
    pumpActive: row.pumpActive,
  };
}

router.use(requireFarmUser);

router.get("/farm/dashboard", async (_req, res): Promise<void> => {
  const plots = await db.select().from(farmPlots).orderBy(farmPlots.name);
  const alerts = await db
    .select()
    .from(irrigationAlerts)
    .where(eq(irrigationAlerts.acknowledged, false));
  const plotsWithNodes = plots.filter((plot) => plot.nodeId !== null);
  const onlineNodeCount = plotsWithNodes.filter(
    (plot) => plot.nodeStatus === "ONLINE",
  ).length;
  const moistureValues = plots
    .map((plot) => plot.moisturePct)
    .filter((moisture): moisture is number => moisture !== null);
  const averageMoisturePct = moistureValues.length
    ? moistureValues.reduce((sum, moisture) => sum + moisture, 0) /
      moistureValues.length
    : 0;

  res.json(
    GetFarmDashboardResponse.parse({
      generatedAt: new Date().toISOString(),
      activePlotCount: plots.length,
      averageMoisturePct: Number(averageMoisturePct.toFixed(1)),
      urgentAlertCount: alerts.filter(
        (alert) => alert.severity === "NEEDS_WATER",
      ).length,
      onlineNodeCount,
      totalNodeCount: plotsWithNodes.length,
      plots: plots.map(asPlot),
    }),
  );
});

router.get("/plots", async (_req, res): Promise<void> => {
  const plots = await db.select().from(farmPlots).orderBy(farmPlots.name);
  res.json(ListPlotsResponse.parse(plots.map(asPlot)));
});

router.post("/plots", async (req, res): Promise<void> => {
  const body = CreatePlotBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const plotDetails = {
    name: body.data.name.trim(),
    crop: body.data.crop.trim(),
    location: body.data.location.trim(),
    areaHectares: body.data.areaHectares,
  };
  if (!plotDetails.name || !plotDetails.crop || !plotDetails.location) {
    res.status(400).json({ error: "Plot name, crop, and location are required." });
    return;
  }

  const [plot] = await db
    .insert(farmPlots)
    .values({
      id: randomUUID(),
      ...plotDetails,
      moisturePct: null,
      temperatureC: null,
      humidityPct: null,
      vpdKpa: null,
      status: "NO_DATA",
      nodeId: null,
      nodeStatus: "OFFLINE",
      lastSync: null,
    })
    .returning();

  res.status(201).json(CreatePlotResponse.parse(asPlot(plot)));
});

router.patch(
  "/plots/:plotId",
  requireFarmAdmin,
  async (req, res): Promise<void> => {
    const params = UpdatePlotParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const body = UpdatePlotBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }

    const changes: {
      name?: string;
      crop?: string;
      location?: string;
      areaHectares?: number;
    } = {};
    for (const field of ["name", "crop", "location"] as const) {
      const value = body.data[field];
      if (value !== undefined) {
        const trimmed = value.trim();
        if (!trimmed) {
          res.status(400).json({ error: `${field} cannot be empty.` });
          return;
        }
        changes[field] = trimmed;
      }
    }
    if (body.data.areaHectares !== undefined) {
      changes.areaHectares = body.data.areaHectares;
    }
    if (Object.keys(changes).length === 0) {
      res.status(400).json({ error: "Provide at least one plot field to update." });
      return;
    }

    const [plot] = await db
      .update(farmPlots)
      .set(changes)
      .where(eq(farmPlots.id, params.data.plotId))
      .returning();
    if (!plot) {
      res.status(404).json({ error: "Plot not found." });
      return;
    }

    res.json(UpdatePlotResponse.parse(asPlot(plot)));
  },
);

router.get("/plots/:plotId/twin", async (req, res): Promise<void> => {
  const params = GetPlotTwinParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [plot] = await db
    .select()
    .from(farmPlots)
    .where(eq(farmPlots.id, params.data.plotId))
    .limit(1);
  if (!plot) {
    res.status(404).json({ error: "Plot not found." });
    return;
  }

  const readings = await db
    .select()
    .from(moistureReadings)
    .where(eq(moistureReadings.plotId, plot.id))
    .orderBy(desc(moistureReadings.recordedAt))
    .limit(24);
  const history = readings.reverse().map((reading) => ({
    time: reading.recordedAt.toISOString(),
    moisturePct: reading.moisturePct,
  }));
  const latest = history.at(-1);
  const oldest = history[0];
  const hoursObserved =
    latest && oldest
      ? Math.max(
          1,
          (new Date(latest.time).getTime() - new Date(oldest.time).getTime()) /
            (60 * 60 * 1000),
        )
      : 1;
  const observedDrop =
    latest && oldest ? oldest.moisturePct - latest.moisturePct : 0;
  const dryingRate = Math.max(0.2, observedDrop / hoursObserved);
  const currentMoisture = latest?.moisturePct ?? plot.moisturePct;
  if (currentMoisture === null) {
    res.json(
      GetPlotTwinResponse.parse({
        plot: asPlot(plot),
        hoursToWilting: null,
        forecastConfidence: null,
        history,
        forecast: [],
      }),
    );
    return;
  }
  const forecast = [12, 24, 48].map((hours) => ({
    time: new Date(Date.now() + hours * 60 * 60 * 1000).toISOString(),
    moisturePct: Math.max(
      0,
      Number((currentMoisture - dryingRate * hours).toFixed(1)),
    ),
  }));

  res.json(
    GetPlotTwinResponse.parse({
      plot: asPlot(plot),
      hoursToWilting:
        currentMoisture <= 20
          ? 0
          : Math.ceil((currentMoisture - 20) / dryingRate),
      forecastConfidence: Math.min(82, 55 + history.length),
      history,
      forecast,
    }),
  );
});

router.get("/alerts", async (_req, res): Promise<void> => {
  const rows = await db
    .select({ alert: irrigationAlerts, plotName: farmPlots.name })
    .from(irrigationAlerts)
    .innerJoin(farmPlots, eq(irrigationAlerts.plotId, farmPlots.id))
    .orderBy(desc(irrigationAlerts.createdAt));

  res.json(
    ListAlertsResponse.parse(
      rows.map(({ alert, plotName }) => ({
        id: alert.id,
        plotId: alert.plotId,
        plotName,
        severity: alert.severity,
        title: alert.title,
        detail: alert.detail,
        createdAt: alert.createdAt.toISOString(),
        acknowledged: alert.acknowledged,
      })),
    ),
  );
});

router.patch(
  "/alerts/:alertId/acknowledge",
  async (req, res): Promise<void> => {
    const params = AcknowledgeAlertParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [row] = await db
      .update(irrigationAlerts)
      .set({ acknowledged: true })
      .where(eq(irrigationAlerts.id, params.data.alertId))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Alert not found." });
      return;
    }

    const [plot] = await db
      .select({ name: farmPlots.name })
      .from(farmPlots)
      .where(eq(farmPlots.id, row.plotId))
      .limit(1);

    res.json(
      AcknowledgeAlertResponse.parse({
        id: row.id,
        plotId: row.plotId,
        plotName: plot?.name ?? "Farm plot",
        severity: row.severity,
        title: row.title,
        detail: row.detail,
        createdAt: row.createdAt.toISOString(),
        acknowledged: row.acknowledged,
      }),
    );
  },
);

router.put(
  "/plots/:plotId/irrigation",
  requireFarmAdmin,
  async (req, res): Promise<void> => {
    const params = ControlIrrigationParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const command = ControlIrrigationBody.safeParse(req.body);
    if (!command.success) {
      res.status(400).json({ error: command.error.message });
      return;
    }

    const pumpActive = command.data.command === "START";
    const durationMinutes = pumpActive
      ? (command.data.durationMinutes ?? 15)
      : 0;
    const updatedAt = new Date();
    const result = await db.transaction(async (tx) => {
      const [plot] = await tx
        .update(farmPlots)
        .set({ pumpActive, pumpDurationMinutes: durationMinutes, pumpUpdatedAt: updatedAt })
        .where(eq(farmPlots.id, params.data.plotId))
        .returning();
      if (!plot) {
        return undefined;
      }
      await tx.insert(irrigationEvents).values({
        plotId: plot.id,
        command: command.data.command,
        durationMinutes,
        occurredAt: updatedAt,
      });
      return plot;
    });
    if (!result) {
      res.status(404).json({ error: "Plot not found." });
      return;
    }

    res.json(
      ControlIrrigationResponse.parse({
        plotId: result.id,
        pumpActive: result.pumpActive,
        durationMinutes: result.pumpDurationMinutes,
        updatedAt: result.pumpUpdatedAt.toISOString(),
      }),
    );
  },
);

router.get("/reports/weekly", async (_req, res): Promise<void> => {
  const since = new Date(Date.now() - 6 * dayMs);
  since.setHours(0, 0, 0, 0);
  const readings = await db
    .select()
    .from(moistureReadings)
    .where(gte(moistureReadings.recordedAt, since));
  const events = await db
    .select()
    .from(irrigationEvents)
    .where(
      and(
        eq(irrigationEvents.command, "START"),
        gte(irrigationEvents.occurredAt, since),
      ),
    );

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(since.getTime() + index * dayMs);
    const dateKey = date.toISOString().slice(0, 10);
    const dayReadings = readings.filter(
      (reading) => reading.recordedAt.toISOString().slice(0, 10) === dateKey,
    );
    const dayEvents = events.filter(
      (event) => event.occurredAt.toISOString().slice(0, 10) === dateKey,
    );
    return {
      day: date.toLocaleDateString("en-GB", {
        weekday: "short",
        timeZone: "Africa/Freetown",
      }),
      averageMoisturePct: dayReadings.length
        ? Number(
            (
              dayReadings.reduce((sum, reading) => sum + reading.moisturePct, 0) /
              dayReadings.length
            ).toFixed(1),
          )
        : 0,
      irrigationMinutes: dayEvents.reduce(
        (sum, event) => sum + event.durationMinutes,
        0,
      ),
    };
  });
  const nonEmptyDays = days.filter((day) => day.averageMoisturePct > 0);
  const averageMoisturePct = nonEmptyDays.length
    ? nonEmptyDays.reduce((sum, day) => sum + day.averageMoisturePct, 0) /
      nonEmptyDays.length
    : 0;

  res.json(
    GetWeeklyReportResponse.parse({
      weekLabel: `${since.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Freetown" })} – ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Freetown" })}`,
      averageMoisturePct: Number(averageMoisturePct.toFixed(1)),
      readingsCount: readings.length,
      days,
    }),
  );
});

export default router;
