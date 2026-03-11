import { Router } from "express";
import { appointmentController } from "@/dependencies/therapist/appointment.di";

const appointmentRouter = Router();

appointmentRouter.get('/appointments', appointmentController.getAppointments);
appointmentRouter.get('/appointments/:appointmentId', appointmentController.getAppointmentDetail);
appointmentRouter.patch('/appointments/:appointmentId/notes', appointmentController.saveNotes);
appointmentRouter.patch('/appointments/:appointmentId/status', appointmentController.updateAppointmentStatus);

export default appointmentRouter;