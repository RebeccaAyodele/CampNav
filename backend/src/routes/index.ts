import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { healthRouter } from "./health.routes.js";
import { logsRouter } from "./logs.routes.js";
import { lostPersonsRouter } from "./lost-persons.routes.js";
import { routeRouter } from "./route.routes.js";
import { shuttlesRouter } from "./shuttles.routes.js";
import { ussdRouter } from "./ussd.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/route", routeRouter);
apiRouter.use("/ussd", ussdRouter);
apiRouter.use("/shuttles", shuttlesRouter);
apiRouter.use("/lost-persons", lostPersonsRouter);
apiRouter.use("/logs", logsRouter);
apiRouter.use("/health", healthRouter);
