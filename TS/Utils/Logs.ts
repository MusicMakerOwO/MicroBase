import { inspect } from 'node:util';

const color = {
	red: '\x1b[31m',
	orange: '\x1b[38;5;202m',
	yellow: '\x1b[33m',
	green: '\x1b[32m',
	blue: '\x1b[34m',
	pink: '\x1b[35m',
	purple: '\x1b[38;5;129m',
	cyan: '\x1b[36m',
	white: '\x1b[37m',
	reset: '\x1b[0m'
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

function parse(message: any) {
	if (typeof message === 'string') return message;

	const properties = inspect(message, { depth: 3 });

	const regex = /^\s*["'`](.*)["'`]\s*\+?$/gm;

	const response: string[] = [];
	for (const line of properties.split('\n')) {
		response.push( line.replace(regex, '$1') );
	}

	return response.join('\n');
}

function info(message: any) {
	console.log(`${color.yellow}[${getTimestamp()}]${color.reset} ${parse(message)}`);
}

function warn(message: any) {
	console.log(`${color.orange}[${getTimestamp()}]${color.reset} ${parse(message)}`);
}

function error(message: any) {
	console.log(`${color.red}[${getTimestamp()}] ${parse(message)}${color.reset}`);
}

function success(message: any) {
	console.log(`${color.green}[${getTimestamp()}]${color.reset} ${parse(message)}`);
}

function debug(message: any) {
	console.log(`${color.blue}[${getTimestamp()}]${color.reset} ${parse(message)}`);
}

function deleted(message: any) {
	console.log(`${color.pink}[${getTimestamp()}]${color.reset} ${parse(message)}`);
}

function updated(message: any) {
	console.log(`${color.purple}[${getTimestamp()}]${color.reset} ${parse(message)}`);
}

function created(message: any) {
	console.log(`${color.cyan}[${getTimestamp()}]${color.reset} ${parse(message)}`);
}

function custom(message: any, hexColor: string | number = 0x000000) {
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
	console.log(`${ansiRGB}[${getTimestamp()}]${color.reset} ${parse(message)}`);
}

export default { getTimestamp, info, warn, error, success, debug, deleted, updated, created, custom };
module.exports = exports.default;