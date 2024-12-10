import { Request, Response } from 'express';

import { checkParameters, hashPasword, sanitizeString } from '../../../tools/utils';
import { Area } from '../../../Models/Area';
import { Campaign } from '../../../Models/Campaign';
import { log } from '../../../tools/log';

/**
 * Change the name of a campaign
 *
 * @example
 * body:{
 * 	"adminCode": string,
 * 	"newName": string,
 * 	"area": mongoDBID,
 * 	"CampaignId": mongoDBID,
 *	"allreadyHased": boolean
 * }
 *
 * @throws {400} - Missing parameters
 * @throws {400} - bad hash for admin code
 * @throws {400} - Campaign not found
 * @throws {400} - Name invalid
 * @throws {401} - Wrong admin code
 * @throws {401} - Wrong campaign id
 * @throws {200} - OK
 */

export default async function changeName(req: Request<any>, res: Response<any>) {
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
				['newName', 'string'],
				['area', 'ObjectId'],
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
		log(`[!${req.body.area}, ${ip}] Wrong admin code`, 'WARNING', __filename);
		return;
	}

	let campaign: InstanceType<typeof Campaign> | null = null;

	if (req.body.CampaignId) {
		campaign = await Campaign.findOne({ _id: { $eq: req.body.CampaignId }, area: area._id });
	} else {
		campaign = await Campaign.findOne({ area: area._id, active: true });
	}
	if (!campaign) {
		res.status(401).send({ message: 'Wrong campaign id', OK: false });
		log(`[${ip}, ${req.body.area}] Wrong campaign id`, 'WARNING', __filename);
		return;
	}

	if (
		req.body.newName.length < 4 ||
		req.body.newName.length > 20 ||
		req.body.newName != sanitizeString(req.body.newName)
	) {
		res.status(400).send({ message: 'Name invalid', OK: false });
		log(`[${ip}, ${req.body.area}] Name invalid`, 'WARNING', __filename);
		return;
	}

	const output = await Campaign.updateOne({ _id: campaign._id }, { name: req.body.newName });
	if (output.matchedCount != 1) {
		res.status(400).send({ message: 'Campaign not found', OK: false });
		log(`[${ip}, ${req.body.area}] Campaign not found`, 'WARNING', __filename);
		return;
	}

	res.status(200).send({ message: 'OK', OK: true });
	log(`[${ip}, ${req.body.area}] Campaign name changed`, 'INFO', __filename);
}
