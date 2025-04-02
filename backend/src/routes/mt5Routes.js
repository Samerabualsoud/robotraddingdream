import express from 'express';
import { MT5Controller } from '../controllers/mt5Controller';

const router = express.Router();
const mt5Controller = new MT5Controller();

// Authentication routes
router.post('/login', mt5Controller.login);
router.post('/logout', mt5Controller.logout);

// Account information
router.get('/account', mt5Controller.getAccountInfo);

// Market data
router.get('/market/:symbol', mt5Controller.getMarketData);

// Trading operations
router.get('/positions', mt5Controller.getPositions);
router.get('/history', mt5Controller.getTradeHistory);
router.post('/trade', mt5Controller.placeTrade);
router.put('/position/:ticket', mt5Controller.modifyPosition);
router.delete('/position/:ticket', mt5Controller.closePosition);

export default router;
