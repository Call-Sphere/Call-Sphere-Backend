import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';

import { Area } from '../../Models/Area';
import { log } from '../../tools/log';
import { Campaign } from '../../Models/Campaign';

/**
 * Check if the admin code is correct and return the area name and the actual campaign
 * @example
 *
 * body: {
 * 	adminCode: 'adminCode',
 * 	area: 'areaId'
 * }
 *
 * response: {
 * 	message: 'OK',
 * 	data: {
 * 		areaName: 'areaName',
 * 		actualCampaignId: 'campaignId',
 * 		actualCampaignName: 'campaignName',
 * 		actualCampaignCallStart: 'HH:MM',
 * 		actualCampaignCallEnd: 'HH:MM',
 * 		actualCampaignMaxCall: 10,
 * 		actualCampaignScript: 'script',
 * 		actualCampaignTimeBetweenCall: 10
 * 	},
 * 	OK: true
 * }
 *
 * @throws 400 - Missing parameters
 * @throws 401 - Wrong admin code
 * @throws 500 - Internal error
 */
export default async function login(req: Request<any>, res: Response<any>) {
	const ip = req.hostname;
	if (!req.body || typeof req.body.adminCode != 'string' || !ObjectId.isValid(req.body.area)) {
		res.status(400).send({ message: 'Missing parameters', OK: false });
		log(`Missing parameters from ` + ip, 'WARNING', 'login.ts');
		return;
	}

	const area = await Area.findOne({ _id: { $eq: req.body.area }, adminPassword: { $eq: req.body.adminCode } });
	if (!area) {
		res.status(401).send({ message: 'Wrong admin code', OK: false });
		log(`Wrong admin code from ${ip}`, 'WARNING', 'login.ts');
		return;
	}

	let campaign = await Campaign.findOne({ area: area._id, active: true });

	res.status(200).send({
		message: 'OK',
		data: {
			areaName: area.name,
			actualCampaignId: campaign?._id ?? undefined,
			actualCampaignName: campaign?.name ?? undefined,
			actualCampaignCallStart: campaign?.callHoursStart ?? undefined,
			actualCampaignCallEnd: campaign?.callHoursEnd ?? undefined,
			actualCampaignMaxCall: campaign?.nbMaxCallCampaign ?? undefined,
			actualCampaignScript: campaign?.script ?? undefined,
			actualCampaignTimeBetweenCall: campaign?.timeBetweenCall ?? undefined
		},
		OK: true
	});
	log(`Login from ${area.name} (${ip})`, 'INFO', 'login.ts');
}
