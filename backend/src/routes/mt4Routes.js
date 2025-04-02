import express from 'express';
import { MT4Controller } from '../controllers/mt4Controller';

const router = express.Router();
const mt4Controller = new MT4Controller();

// Authentication routes
router.post('/login', mt4Controller.login);
router.post('/logout', mt4Controller.logout);

// Account information
router.get('/account', mt4Controller.getAccountInfo);

// Market data
router.get('/market/:symbol', mt4Controller.getMarketData);

// Trading operations
router.get('/positions', mt4Controller.getPositions);
router.get('/history', mt4Controller.getTradeHistory);
router.post('/trade', mt4Controller.placeTrade);
router.put('/position/:ticket', mt4Controller.modifyPosition);
router.delete('/position/:ticket', mt4Controller.closePosition);

export default router;
