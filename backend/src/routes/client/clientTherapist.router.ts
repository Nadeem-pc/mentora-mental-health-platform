import { Router } from "express";
import verifyToken from "@/middlewares/verify-token.middleware";
import { clientController } from "@/dependencies/client/clientTherapist.di";

const clientRouter = Router();
clientRouter.use(verifyToken());

clientRouter.get('/therapists', clientController.getTherapists);
clientRouter.get('/therapist/:therapistId', clientController.getTherapistDetails);
clientRouter.get('/therapist/:therapistId/slots', clientController.getTherapistSlots);
clientRouter.get('/therapist/:therapistId/slots/available', clientController.getAvailableSlots);
clientRouter.get('/therapist/:therapistId/reviews', clientController.getTherapistReviews);

export default clientRouter;