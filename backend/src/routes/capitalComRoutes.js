import express from 'express';
import { CapitalComController } from '../controllers/capitalComController';

const router = express.Router();
const capitalComController = new CapitalComController();

// Authentication routes
router.post('/login', capitalComController.login);
router.post('/logout', capitalComController.logout);

// Account information
router.get('/account', capitalComController.getAccountInfo);

// Market data
router.get('/market/:symbol', capitalComController.getMarketData);

// Trading operations
router.get('/positions', capitalComController.getPositions);
router.get('/history', capitalComController.getTradeHistory);
router.post('/trade', capitalComController.placeTrade);
router.put('/position/:dealId', capitalComController.modifyPosition);
router.delete('/position/:dealId', capitalComController.closePosition);

export default router;
