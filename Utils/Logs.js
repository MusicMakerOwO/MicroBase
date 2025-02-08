const { inspect } = require('node:util');

const COLOR = {
	RED: '\x1B[31m',
	ORANGE: '\x1B[38;5;202m',
	YELLOW: '\x1B[33m',
	GREEN: '\x1B[32m',
	BLUE: '\x1B[34m',
	PINK: '\x1B[35m',
	PURPLE: '\x1B[38;5;129m',
	CYAN: '\x1B[36m',
	WHITE: '\x1B[37m',
	RESET: '\x1B[0m'
}

function getTimestamp() {
	const date = new Date();
	const year = date.getFullYear();
	const month = date.getMonth() + 1;
	const day = date.getDate();
	const hours = date.getHours();
	const minutes = date.getMinutes();
	const seconds = date.getSeconds();
	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function parse(message) {
	if (typeof message === 'string') return message;

	const properties = inspect(message, { depth: 3 });

	const regex = /^\s*["'`](.*)["'`]\s*\+?$/gm;

	const response = [];
	for (const line of properties.split('\n')) {
		response.push( line.replace(regex, '$1') );
	}

	return response.join('\n');
}

function info(message) {
	console.log(`${COLOR.YELLOW}[${getTimestamp()}]${COLOR.RESET} ${parse(message)}`);
}

function warn(message) {
	console.log(`${COLOR.ORANGE}[${getTimestamp()}]${COLOR.RESET} ${parse(message)}`);
}

function error(message) {
	console.log(`${COLOR.RED}[${getTimestamp()}] ${parse(message)}${COLOR.RESET}`);
}

function success(message) {
	console.log(`${COLOR.GREEN}[${getTimestamp()}]${COLOR.RESET} ${parse(message)}`);
}

function debug(message) {
	console.log(`${COLOR.BLUE}[${getTimestamp()}]${COLOR.RESET} ${parse(message)}`);
}

function deleted(message) {
	console.log(`${COLOR.PINK}[${getTimestamp()}]${COLOR.RESET} ${parse(message)}`);
}

function updated(message) {
	console.log(`${COLOR.PURPLE}[${getTimestamp()}]${COLOR.RESET} ${parse(message)}`);
}

function created(message) {
	console.log(`${COLOR.CYAN}[${getTimestamp()}]${COLOR.RESET} ${parse(message)}`);
}

function custom(message, hexColor = COLOR.YELLOW) {
	switch (typeof hexColor) {
		case 'string':
			// conver to int
			hexColor = parseInt(hexColor.replace('#', ''), 16);
			break;
		case 'number':
			// do nothing
			break;
		default:
			hexColor = 0;
			break;
	}
	const rgb = [ (hexColor >> 16) & 0xFF, (hexColor >> 8) & 0xFF, hexColor & 0xFF ];
	const ansiRGB = `\x1b[38;2;${rgb[0]};${rgb[1]};${rgb[2]}m`;
	console.log(`${ansiRGB}[${getTimestamp()}]${COLOR.RESET} ${parse(message)}`);
}

module.exports = { getTimestamp, info, warn, error, success, debug, deleted, updated, created, custom };