import { Router } from "express";
import {
  getNearest,
  searchPlaces,
  createDirections,
  createEmergencyRoute,
  createSupplyRoute
} from "../controllers/route.controller.js";

export const routeRouter = Router();

routeRouter.post("/directions", createDirections);
routeRouter.get("/nearest", getNearest);
routeRouter.get("/search", searchPlaces);
routeRouter.post("/emergency", createEmergencyRoute);
routeRouter.post("/supply", createSupplyRoute);
