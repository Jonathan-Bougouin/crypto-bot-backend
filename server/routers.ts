import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  alerts: router({
    list: publicProcedure.query(async () => {
      const { getRecentAlerts } = await import("./db");
      const alerts = await getRecentAlerts(50);
      return alerts.map(alert => ({
        ...alert,
        indicatorsTriggered: JSON.parse(alert.indicatorsTriggered)
      }));
    }),
    byAsset: publicProcedure
      .input(z.object({ asset: z.string() }))
      .query(async ({ input }) => {
        const { getAlertsByAsset } = await import("./db");
        const alerts = await getAlertsByAsset(input.asset, 50);
        return alerts.map(alert => ({
          ...alert,
          indicatorsTriggered: JSON.parse(alert.indicatorsTriggered)
        }));
      }),
    generate: publicProcedure.mutation(async () => {
      // Appel du script Python pour générer des alertes
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);
      
      try {
        const { stdout, stderr } = await execAsync(
          "python3 server/generate_alerts.py",
          { cwd: process.cwd() }
        );
        console.log(stdout);
        if (stderr) console.error(stderr);
        return { success: true, message: "Alertes générées avec succès" };
      } catch (error) {
        console.error("Erreur lors de la génération d'alertes:", error);
        return { success: false, message: "Erreur lors de la génération d'alertes" };
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
