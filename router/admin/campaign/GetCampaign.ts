import { Request, Response } from 'express';

import { Area } from '../../../Models/Area';
import { Campaign } from '../../../Models/Campaign';
import { log } from '../../../tools/log';
import { checkParameters, hashPasword } from '../../../tools/utils';

/**
 * get a campaign
 *
 * @example
 * body:{
 * 	"adminCode": string,
 * 	"area": mongoDBID,
 * 	"CampaignId": mongoDBID,
 * 	"allreadyHaseded": boolean
 * }
 *
 * @throws {400} - Missing parameters
 * @throws {400} - bad hash for admin code
 * @throws {401} - Wrong admin code
 * @throws {404} - no campaign
 * @throws {200} - OK
 */
export default async function getCampaign(req: Request<any>, res: Response<any>) {
	const ip = req.hostname;

	if (
		!checkParameters(
			req.body,
			res,
			[
				['adminCode', 'string'],
				['CampaignId', 'string'],
				['area', 'string'],
				['allreadyHaseded', 'boolean', true]
			],
			__filename
		)
	)
		return;

	const password = hashPasword(req.body.adminCode, req.body.allreadyHaseded, res);
	if (!password) return;
	const area = await Area.findOne({ adminPassword: { $eq: password }, _id: { $eq: req.body.area } }, ['_id', 'name']);
	if (!area) {
		res.status(401).send({ message: 'Wrong admin code', OK: false });
		log(`Wrong admin code from ` + ip, 'WARNING', __filename);
		return;
	}
	const campaign = await Campaign.findOne({ area: area._id, _id: { $eq: req.body.CampaignId } }, [
		'_id',
		'name',
		'active',
		'callHoursStart',
		'callHoursEnd',
		'timeBetweenCall',
		'numberMaxCall',
		'script',
		'callPermited',
		'nbMaxCallCampaign',
		'satisfactions',
		'status'
	]);
	if (!campaign) {
		res.status(404).send({ message: 'no campaign', OK: false });
		log(`no campaign from ${area.name} (${ip})`, 'WARNING', __filename);
		return;
	}

	res.status(200).send({ message: 'OK', OK: true, data: campaign });
	log(`list campaign from ${area.name} (${ip})`, 'INFO', __filename);
}
