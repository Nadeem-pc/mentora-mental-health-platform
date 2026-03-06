import { Router } from "express";
import jobsRouter from "./jobs.router";
import dashboardRouter from "./dashboard.router";
import userManagmentRouter from "./user-management.router";

const adminRouter = Router();

adminRouter.use('/', jobsRouter);
adminRouter.use('/', dashboardRouter);
adminRouter.use('/', userManagmentRouter);

export default adminRouter;