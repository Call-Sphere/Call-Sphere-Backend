import { Request, Response } from 'express';

import { Area } from '../../../Models/Area';
import { Campaign } from '../../../Models/Campaign';
import { Client } from '../../../Models/Client';
import { log } from '../../../tools/log';
import { checkParameters, clearPhone, hashPasword, phoneNumberCheck } from '../../../tools/utils';

/**
 * Add a client to a campaign
 *
 * @example
 * body:{
 *	"adminCode": string,
 *	"area": mongoDBID,
 *	"phone": string,
 *	"campaign": mongoDBID,
 *	"allreadyhas
 * }
 *
 * @throws {400} - Missing parameters
 * @throws {400} - Wrong phone number
 * @throws {400} - bad hash for admin code
 * @throws {401} - Wrong admin code
 * @throws {404} - User not found
 * @throws {404} - Campaign not found
 * @throws {200} - User added to campaign
 * @throws {200} - User already in campaign
 */

export default async function addClientCampaign(req: Request<any>, res: Response<any>) {
	const ip = req.hostname;
	if (
		!checkParameters(
			req.body,
			res,
			[
				['campaign', 'string', true],
				['phone', 'string'],
				['adminCode', 'string'],
				['area', 'string'],
				['allreadyHased', 'boolean', true]
			],
			__filename
		)
	)
		return;

	const phone = clearPhone(req.body.phone);
	if (!phoneNumberCheck(phone)) {
		res.status(400).send({ message: 'Wrong phone number', OK: false });
		log(`Wrong phone number from ${ip}`, 'WARNING', __filename);
		return;
	}

	const password = hashPasword(req.body.adminCode, req.body.allreadyHased, res);
	if (!password) return;
	const area = await Area.findOne({ adminPassword: { $eq: password }, _id: { $eq: req.body.area } });
	if (!area) {
		res.status(401).send({ message: 'Wrong admin code', OK: false });
		log(`Wrong admin code from ` + ip, 'WARNING', __filename);
		return;
	}

	const client = await Client.findOne({ phone: { $eq: phone } });
	if (!client) {
		res.status(404).send({ message: 'User not found', OK: false });
		log(`User not found from ${area.name} (${ip})`, 'WARNING', __filename);
		return;
	}

	let campaign: InstanceType<typeof Campaign> | null = null;

	if (req.body.campaign) {
		campaign = await Campaign.findOne({ _id: { $eq: req.body.campaign }, area: area._id });
	} else {
		campaign = await Campaign.findOne({ area: area._id, active: true });
	}
	if (!campaign) {
		res.status(404).send({ message: 'Campaign not found', OK: false });
		log(`Campaign not found from ${area.name} (${ip})`, 'WARNING', 'addClientCampaign.ts');
		return;
	}
	if (client.campaigns.findIndex(c => c.toString() == campaign?._id.toString()) != -1) {
		res.status(200).send({ message: 'User already in campaign', OK: true });
		log(`User already in campaign from ${area.name} (${ip})`, 'WARNING', __filename);
		return;
	}

	client.campaigns.push(campaign._id);
	await client.save();

	res.status(200).send({ message: 'User added to campaign', OK: true });
	log(`User added to campaign from ${area.name} (${ip})`, 'INFO', __filename);
}
