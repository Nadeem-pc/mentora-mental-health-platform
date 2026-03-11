import { Router } from "express";
import { paymentController } from "@/dependencies/client/payment.di";
import verifyToken from "@/middlewares/verify-token.middleware";

const paymentRouter = Router();

paymentRouter.post('/webhook', paymentController.handleWebhook);
paymentRouter.post('/create-checkout-session', verifyToken(), paymentController.createCheckoutSession);
paymentRouter.post('/wallet-payment', verifyToken(), paymentController.payWithWallet);
paymentRouter.get('/receipt/:sessionId', verifyToken(), paymentController.getPaymentReceipt);

export default paymentRouter;