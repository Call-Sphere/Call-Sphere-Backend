import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';

import { Area } from '../../Models/Area';
import { Caller } from '../../Models/Caller';
import { Campaign } from '../../Models/Campaign';
import { Client } from '../../Models/Client';
import { log } from '../../tools/log';

export default async function callePerClient(req: Request<any>, res: Response<any>) {
	const ip = req.socket?.remoteAddress?.split(':').pop();
	if (
		!req.body ||
		typeof req.body.campaign != 'string' ||
		typeof req.body.adminCode != 'string' ||
		!ObjectId.isValid(req.body.campaign)
	) {
		res.status(400).send({ message: 'Missing parameters', OK: false });
		log(`Missing parameters from ${ip}`, 'WARNING', 'callePerClient.ts');
		return;
	}

	const area = await Area.findOne({ AdminPassword: req.body.adminCode });
	if (!area) {
		res.status(401).send({ message: 'Wrong admin code', OK: false });
		log(`Wrong admin code from ${ip}`, 'WARNING', 'callePerClient.ts');
		return;
	}
	const campaign = await Campaign.findOne({ _id: req.body.campaign });
	if (!campaign) {
		res.status(401).send({ message: 'Wrong campaign id', OK: false });
		log(`Wrong campaign id from ${area.name} (${ip})`, 'WARNING', 'callePerClient.ts');
		return;
	}
	const call = await Caller.find({ _id: { $in: campaign.callerList } })
		.lean()
		.select('timeInCall');

	const allTimeInCall = call.reduce((accumulator, current) => {
		return accumulator.concat((current as any).timeInCall);
	}, []);

	const totalClient = await Client.countDocuments({ data: { $elemMatch: { $eq: campaign._id.toString() } } });

	res.status(200).send({
		OK: true,
		data: {
			totalOfCall: allTimeInCall.length,
			totalOfClient: totalClient,
			totalOfKickUser: campaign.trashUser.length,
			callPerClient: allTimeInCall.length / totalClient
		},
		message: 'call per client: ' + allTimeInCall.length / totalClient
	});
	log(`number of caller get by ${area.name} (${ip})`, 'INFORMATION', 'callePerClient.ts');
}
