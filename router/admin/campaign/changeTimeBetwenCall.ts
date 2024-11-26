import { Request, Response } from 'express';

import { Area } from '../../../Models/Area';
import { Campaign } from '../../../Models/Campaign';
import { log } from '../../../tools/log';
import { checkParameters, hashPasword } from '../../../tools/utils';

/**
 * Change the time between call for a campaign
 *
 * @example
 * body:{
 *	"adminCode": string,
 *	"area": mongoDBID,
 *	"newTimeBetweenCall": number,
 *	"CampaignId": mongoDBID,
 *	"allreadyHaseded": boolean
 * }
 *
 * @throws {400} - Missing parameters
 * @throws {400} - bad hash for admin code
 * @throws {401} - Wrong admin code
 * @throws {401} - Wrong campaign id
 * @throws {404} - Campaign not found
 * @throws {200} - OK
 */

export default async function changeTimeBetwenCall(req: Request<any>, res: Response<any>) {
	const ip =
		(Array.isArray(req.headers['x-forwarded-for'])
			? req.headers['x-forwarded-for'][0]
			: req.headers['x-forwarded-for']?.split(',')?.[0] ?? req.ip) ?? 'no IP';
	if (
		!checkParameters(
			req.body,
			res,
			[
				['adminCode', 'string'],
				['newTimeBetweenCall', 'number'],
				['area', 'string'],
				['CampaignId', 'string', true],
				['allreadyHaseded', 'boolean', true]
			],
			__filename
		)
	)
		return;
	const password = hashPasword(req.body.adminCode, req.body.allreadyHaseded, res);
	if (!password) return;
	const area = await Area.findOne({ _id: { $eq: req.body.area }, adminPassword: { $eq: password } });
	if (!area) {
		res.status(401).send({ message: 'Wrong admin code', OK: false });
		log(`Wrong admin code from ${ip}`, 'WARNING', __filename);
		return;
	}

	let campaign: InstanceType<typeof Campaign> | null;
	if (req.body.CampaignId) {
		campaign = await Campaign.findOne({ _id: { $eq: req.body.CampaignId }, area: area._id });
	} else {
		campaign = await Campaign.findOne({ area: area._id, active: true });
	}
	if (!campaign) {
		res.status(401).send({ message: 'Wrong campaign id', OK: false });
		log(`Wrong campaign id from ${area.name} (${ip})`, 'WARNING', __filename);
		return;
	}

	req.body.newTimeBetweenCall = parseInt(req.body.newTimeBetweenCall);

	if (isNaN(req.body.newTimeBetweenCall) || req.body.newTimeBetweenCall < 60_000) {
		res.status(400).send({ message: 'Invalid time between call', OK: false });
		log(`Invalid time between call from ${ip} (${area.name})`, 'WARNING', __filename);
		return;
	}

	const output = await Campaign.updateOne(
		{ _id: { $eq: campaign._id } },
		{ timeBetweenCall: req.body.newTimeBetweenCall }
	);
	if (output.matchedCount != 1) {
		res.status(404).send({ message: 'Campaign not found', OK: false });
		log(`Campaign not found from ${area.name} (${ip})`, 'WARNING', __filename);
		return;
	}

	res.status(200).send({ message: 'OK', OK: true });
	log(`time betwen call changed from ${ip} (${area.name})`, 'INFO', __filename);
}
