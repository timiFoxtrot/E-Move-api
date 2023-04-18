import express from 'express';
import {
  bookTrip,
  getPasswordReset,
  getUser,
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
router.get('/password-reset/:userId/:token', getPasswordReset);
router.post('/password-reset/:userId', resetPassword)
router.get('/getAllRoutes', getAllRoutes);
router.get('/getRoute/:id', getRoute);
router.post('/paystack/pay', authMiddleware, initPayment);
router.get('/paystack/callback', getReference);
router.get('/tripHistoryByPassenger', authMiddleware, tripHistoryByPassenger);
router.get('/transactions', authMiddleware, getTransaction);
router.post('/booktrip/:routeId', authMiddleware, bookTrip);
router.get('/getUser', authMiddleware, getUser)

export default router;
