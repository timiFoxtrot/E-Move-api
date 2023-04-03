import express from 'express';

import {
    deleteDriver,
    getAllDrivers,
    getOneDriver,
    registerDriver,
    updateDriver,
    getAllRoutes,
    getRoute,
    bookTrip,
    tripHistory,
    tripHistoryByPassenger,
} from '../controller/admin.controller';
import { upload } from '../utils/multer';
import { totalDrivers, getAllPassengers } from '../controller/admin.controller';

import { createRoute, updateRoutePrice } from "../controller/admin.controller";
import { authMiddleware } from '../middlewares/auth';

const router = express.Router();

router.post(
    '/register-driver',
    upload.fields([
        { name: 'driverId', maxCount: 1 },
        { name: 'photo', maxCount: 1 },
    ]),
    registerDriver
);

router.put(
    '/edit-driver/:id',
    upload.fields([
        { name: 'driverId', maxCount: 1 },
        { name: 'photo', maxCount: 1 },
    ]),
    updateDriver
);

router.get('/allDrivers', getAllDrivers);
router.get('/drivers/:id', getOneDriver);
router.delete('/drivers/:id', deleteDriver);
router.get('/totalSuccessfulRides/:id');
router.get('/totalPassengers', getAllPassengers);
router.get('/totalDrivers', totalDrivers);

router.get('/getAllRoutes', getAllRoutes);
router.get('/getRoute/:id', getRoute);

router.post('/createRoute', createRoute);
router.patch('/editRoute/:id', updateRoutePrice);
router.post('/booktrip/:routeId',authMiddleware, bookTrip);
router.get('/tripHistory', tripHistory);
router.get('/tripHistoryByPassenger',authMiddleware, tripHistoryByPassenger);


export default router;
