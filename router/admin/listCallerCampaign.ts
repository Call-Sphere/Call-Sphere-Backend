import { Request, Response } from 'express';
import { log } from '../../tools/log';
import { Area } from '../../Models/area';
import { Caller } from '../../Models/Caller';
import { Campaign } from '../../Models/Campaign';

export default async function listCallerCampaign(req: Request<any>, res: Response<any>) {
	const ip = req.socket?.remoteAddress?.split(':').pop();
	if (
		!req.body ||
		typeof req.body.adminCode != 'string' ||
		typeof req.body.CampaignId != 'string' ||
		(req.body.skip && typeof req.body.skip != 'number') ||
		(req.body.limit && typeof req.body.limit != 'number')
	) {
		res.status(400).send({ message: 'Missing parameters', OK: false });
		log('Missing parameters from: ' + ip, 'WARNING', 'listCallerCampaign.ts');
		return;
	}

	const area = await Area.findOne({ AdminPassword: req.body.adminCode });
	if (!area) {
		res.status(401).send({ message: 'Wrong admin code', OK: false });
		log('Wrong admin code from ' + ip, 'WARNING', 'listCallerCampaign.ts');
		return;
	}

	const campaign = await Campaign.findOne({ _id: req.body.CampaignId, Area: area._id });
	if (!campaign) {
		res.status(401).send({ message: 'Wrong campaign id', OK: false });
		log('Wrong campaign id from ' + ip, 'WARNING', 'listCallerCampaign.ts');
		return;
	}

	const callers = await Caller.find({ _id: { $in: campaign.userList } })
		.skip(req.body.skip ? req.body.skip : 0)
		.limit(req.body.limit ? req.body.limit : 50);
	if (!callers) {
		res.status(401).send({ message: 'No callers found', OK: false });
		log('No callers found from ' + ip, 'WARNING', 'listCallerCampaign.ts');
		return;
	}

	res.status(200).send({ message: 'OK', OK: true, data: { callers: callers } });
}
