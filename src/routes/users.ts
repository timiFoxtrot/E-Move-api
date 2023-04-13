import express from 'express';
import {
  bookTrip,
  tripHistoryByPassenger,
} from '../controller/user.controller';
import {
  forgotPassword,
  login,
  resetPassword,
  changePassword,
  register,
  verifyEmail,
  getAllRoutes,
  getRoute,
  initPayment,
  getReference,
  getTransaction,
} from '../controller/user.controller';
import { authMiddleware } from '../middlewares/auth';
const router = express.Router();

router.post('/register', register);
router.get('/verify/:id/:token', verifyEmail);
router.patch('/change-password', changePassword);
router.post('/login', login);
router.post('/forgotPassword', forgotPassword);
router.post('/password-reset/:userId/:token', resetPassword);
router.get('/getAllRoutes', getAllRoutes);
router.get('/getRoute/:id', getRoute);
router.post('/paystack/pay', authMiddleware, initPayment);
router.get('/paystack/callback', getReference);
router.get('/tripHistoryByPassenger', authMiddleware, tripHistoryByPassenger);
router.get('/transaction/:userId', getTransaction);
router.post('/booktrip/:routeId', authMiddleware, bookTrip);

export default router;
