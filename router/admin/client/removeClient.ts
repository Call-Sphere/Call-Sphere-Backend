import { Request, Response } from 'express';

import { Area } from '../../../Models/Area';
import { Call } from '../../../Models/Call';
import { Campaign } from '../../../Models/Campaign';
import { Client } from '../../../Models/Client';
import { log } from '../../../tools/log';
import { checkParameters, clearPhone, hashPasword, phoneNumberCheck } from '../../../tools/utils';
/**
 * remove one client from the database
 *
 * @example
 * body: {
 * 	phone: string,
 * 	adminCode: string,
 * 	area: string,
 *	"allreadyHased": boolean
 * 	CampaignId: string
 * }
 *
 * @throws {400} if missing parameters
 * @throws {400} bad hash for admin code
 * @throws {400} if wrong phone number
 * @throws {401} if wrong admin code
 * @throws {401} if wrong campaign id
 * @throws {404} if client not found
 * @throws {500} if error removing client
 * @throws {200} if OK
 */
export default async function removeClient(req: Request<any>, res: Response<any>) {
	//@ts-ignore
	const ip = req.headers['x-forwarded-for']?.split(',')?.at(0) ?? req.ip;
	if (
		!checkParameters(
			req.body,
			res,
			[
				['phone', 'string'],
				['adminCode', 'string'],
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
	req.body.phone = clearPhone(req.body.phone);
	if (!phoneNumberCheck(req.body.phone)) {
		res.status(400).send({ message: 'Wrong phone number', OK: false });
		log(`Wrong phone number from ${ip}`, 'WARNING', __filename);
		return;
	}

	const area = await Area.findOne({ adminPassword: { $eq: password }, _id: { $eq: req.body.area } });
	if (!area) {
		res.status(401).send({ message: 'Wrong admin code', OK: false });
		log(`Wrong admin code from ${ip}`, 'WARNING', __filename);
		return;
	}

	let campaign: InstanceType<typeof Campaign> | null = null;

	if (req.body.CampaignId) {
		campaign = await Campaign.findOne({ _id: { $eq: req.body.CampaignId }, area: { $eq: area._id } });
	} else {
		campaign = await Campaign.findOne({ area: area._id, active: true });
	}
	if (!campaign) {
		res.status(401).send({ message: 'Wrong campaign id', OK: false });
		log(`Wrong campaign id from ${area.name} (${ip})`, 'WARNING', __filename);
		return;
	}

	const output = await Client.findOne({ phone: { $eq: req.body.phone }, campaigns: { $eq: campaign._id } }, []);
	if (!output) {
		res.status(404).send({ message: 'Client not found', OK: false });
		log(`Client not found from ${area.name} (${ip})`, 'WARNING', __filename);
		return;
	}
	try {
		await Call.deleteOne({ client: { $eq: output._id }, Campaign: { $eq: campaign._id } });
		await Client.findByIdAndDelete(output._id);
	} catch (e) {
		res.status(500).send({ message: 'Error removing client', OK: false });
		log(`Error removing client from ${area.name} (${ip})`, 'ERROR', __filename);
		return;
	}
	res.status(200).send({ message: 'OK', OK: true });
	log(`Client removed from ${ip} (${area.name})`, 'INFO', __filename);
}
