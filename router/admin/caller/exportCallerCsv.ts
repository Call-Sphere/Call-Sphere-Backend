import * as csv from '@fast-csv/format';
import { Request, Response } from 'express';

import { checkParameters, hashPasword } from '../../../tools/utils';
import { Area } from '../../../Models/Area';
import { Call } from '../../../Models/Call';
import { Caller } from '../../../Models/Caller';
import { Campaign } from '../../../Models/Campaign';
import { log } from '../../../tools/log';

/**
 * Export all callers in a csv file
 *
 * @example
 * body:{
 * 	"adminCode": string,
 * 	"area": mongoDBID,
 * 	"curentCamaign": boolean
 * }
 *
 * @throws {400} - Missing parameters
 * @throws {400} - adminCode is not a hash
 * @throws {401} - Wrong admin code
 * @throws {200} - No campaign in progress
 * @throws {200} - OK
 */
export default async function exportCallerCsv(req: Request<any>, res: Response<any>) {
	const ip = req.hostname;
	if (
		!checkParameters(
			req.body,
			res,
			[
				['adminCode', 'string'],
				['area', 'ObjectId'],
				['curentCamaign', 'boolean', true],
				['allreadyHased', 'boolean', true]
			],
			__filename
		)
	)
		return;
	const password = hashPasword(req.body.adminCode, req.body.allreadyHased, res);
	if (!password) return;
	const area = await Area.findOne({ adminPassword: { $eq: password }, _id: { $eq: req.body.area } });
	if (!area) {
		res.status(401).send({ message: 'Wrong admin code', OK: false });
		log(`Wrong admin code from ${ip}`, 'WARNING', __filename);
		return;
	}
	let selector: {} = { area: area._id };

	const campaign = await Campaign.findOne({ area: area._id, active: true });
	if (req.body.curentCamaign) {
		if (!campaign) {
			res.status(400).send({ message: 'No campaign in progress', OK: false });
			log(`No campaign in progress from ${ip}`, 'WARNING', __filename);
			return;
		}
		selector = { $or: [{ campaigns: campaign._id }, { area: area._id }] };
	}

	const csvStream = csv.format({ headers: true, delimiter: ';' });
	csvStream.pipe(res);

	res.setHeader('Content-Disposition', 'attachment; filename=export.csv');
	res.setHeader('Content-Type', 'text/csv');

	let callerCounter = 0;
	await Caller.find(selector)
		.cursor()
		.eachAsync(async caller => {
			if (caller) {
				callerCounter++;
				const nbCall = await Call.countDocuments({ caller: caller._id });
				csvStream.write({
					phone: caller.phone,
					name: caller.name,
					createdAt: caller.createdAt,
					nbCall: nbCall
				});
			}
		});
	csvStream.end();

	log(`Exported ${callerCounter} callers from ${ip} (${area.name})`, 'INFO', __filename);
}
