import { Router } from 'express';

import addCallerCampaign from './router/addCallerCampaign';
import addClientCampaign from './router/addClientCampaign';
import getProgress from './router/getProgress';
import createClient from './router/createClient';
import createCaller from './router/createCaller';
import createCampaign from './router/createCampaign';
import getArea from './router/getArea';

const router = Router();

router.get('/createClient', createClient);
router.get('/CreateCaller', createCaller);
router.get('/createCampaign', createCampaign);
router.get('/addClientCampaign', addClientCampaign);
router.get('/addCallerCampaign', addCallerCampaign);
router.get('/getProgress', getProgress);
router.post('/getArea', getArea);
export default router;
