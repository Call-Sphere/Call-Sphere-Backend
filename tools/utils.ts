function getFileName(filename: string) {
	return filename.split('\\').at(-1)?.split('/').at(-1) ?? 'error';
}

function clearPhone(phoneNumber: string): string {
	if (typeof phoneNumber != 'string') return '';
	phoneNumber = phoneNumber.trim();

	phoneNumber = phoneNumber.replaceAll(' ', '');
	phoneNumber = phoneNumber.replaceAll('.', '');
	phoneNumber = phoneNumber.replaceAll('-', '');
	phoneNumber = phoneNumber.replaceAll('o', '0');
	phoneNumber = phoneNumber.replaceAll('(', '');
	phoneNumber = phoneNumber.replaceAll(')', '');
	phoneNumber = phoneNumber.replaceAll('+', '');

	if (phoneNumber.startsWith('6') || phoneNumber.startsWith('7')) {
		phoneNumber = '0' + phoneNumber;
	}
	if (phoneNumber.startsWith('33') && phoneNumber.length == 11) {
		phoneNumber = '0' + phoneNumber.slice(2);
	}
	if (phoneNumber.startsWith('0')) {
		phoneNumber = phoneNumber.replace('0', '+33');
	}
	return phoneNumber;
}

function phoneNumberCheck(phone: string): boolean {
	if (typeof phone != 'string') return false;
	if (!phone.startsWith('+')) return false;

	const phoneArray = phone.split('');
	if (phone.length % 2 == 0) {
		phoneArray.splice(0, 3);
	} else {
		phoneArray.splice(0, 4);
	}
	phone = phoneArray.join('');
	if (phone.match(/^[0-9]{9}$/)) return true;
	return false;
}

function humainPhone(number: string) {
	const numberArray = number.split('');
	let newNumber = '';
	if (number.length % 2) {
		newNumber += numberArray.splice(0, 4).join('');
	} else {
		newNumber += numberArray.splice(0, 3).join('');
	}
	newNumber += ' ' + numberArray.splice(0, 1);
	for (let i = 0; i < numberArray.length; i = i + 2) {
		newNumber += ' ' + numberArray[i] + numberArray[i + 1];
	}

	if (newNumber.startsWith('+33 ')) {
		newNumber = newNumber.replace('+33 ', '0');
	}

	return newNumber;
}

function CleanStatus(status: 'In progress' | 'to recall' | 'Done' | 'deleted' | undefined) {
	switch (status) {
		case 'In progress':
			return 'En cours';
		case 'to recall':
			return 'Doit etre rappelé·e';
		case 'Done':
			return 'Applé·e';
		case 'deleted':
			return 'Supprimé·e';
		default:
			return 'Aucune info';
	}
}

function cleanSatisfaction(satisfaction: number | null | undefined) {
	switch (satisfaction) {
		case 0:
			return 'A voté';
		case 1:
			return 'Pas interessé·e';
		case 2:
			return 'Interessé·e';
		case 3:
			return 'Pas de réponse';
		case 4:
			return 'A retirer';
		default:
			return 'Aucune info';
	}
}

export { clearPhone, getFileName, phoneNumberCheck, humainPhone, CleanStatus, cleanSatisfaction };
