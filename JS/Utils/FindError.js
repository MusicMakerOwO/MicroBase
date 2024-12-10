//////////////////////////////////////////////////////////////////////
// Welcome to MicroBase!											//
// This code is written in TypeScript and compiled using Sucrase	//
// For any issues, please report them on the GitHub repository		//
// https://github.com/MusicMakerOwO/MicroBase/issues				//
//////////////////////////////////////////////////////////////////////

"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _nodefs = require('node:fs'); var _nodefs2 = _interopRequireDefault(_nodefs);
const STACK_TRACE_REGEX = /at\s+(?:.+)\s+\((.+):(\d+):(\d+)\)/;

// Take an error and resolve the corresponding file and lines
 function FindError (error)  {
	if (!error.stack) return;
	const stack = error.stack.split('\n');
	stack.shift(); // Remove the first line

	let file = '';
	let line = 0;
	let column = 0;
	for (let i = 0; i < stack.length; i++) {
		const match = stack[i].match(STACK_TRACE_REGEX);
		if (!match) continue;
		if (match[1].startsWith('node:')) continue;
		if (match[1].includes('node_modules')) continue;

		file = match[1];
		line = parseInt(match[2]);
		column = parseInt(match[3]);
		break;
	}

	if (!file) return;
	column; // unused

	const contents = _nodefs2.default.readFileSync(file, 'utf-8');
	if (!contents) return;

	const fileLines = contents.split('\n');

	const lines = [
		fileLines[line - 3] || '',
		fileLines[line - 2] || '',
		fileLines[line - 1] || '',
		(' '.repeat(column - 1)) + '^^^',
		fileLines[line] || '',
		fileLines[line + 1] || '',
		fileLines[line + 2] || '',
		fileLines[line + 3] || ''
	].filter(Boolean); // remove any empty lines

	return {
		message: error.message,
		stack,
		lines
	}
} exports.default = FindError;
module.exports = exports.default;