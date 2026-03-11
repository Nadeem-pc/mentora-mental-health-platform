import { Router } from "express";
import verifyToken from "@/middlewares/verify-token.middleware";
import { requireRole } from "@/middlewares/require-role.middleware";
import { adminDashboardController } from "@/dependencies/admin/dashboard.di";

const dashboardRouter = Router();

dashboardRouter.get("/dashboard", verifyToken(), requireRole("admin"), adminDashboardController.getDashboard);

export default dashboardRouter;