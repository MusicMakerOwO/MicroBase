//////////////////////////////////////////////////////////////////////
// Welcome to MicroBase!											//
// This code is written in TypeScript and compiled using Sucrase	//
// For any issues, please report them on the GitHub repository		//
// https://github.com/MusicMakerOwO/MicroBase/issues				//
//////////////////////////////////////////////////////////////////////

"use strict";Object.defineProperty(exports, "__esModule", {value: true}); async function Prompt(question = '') {
    if (typeof question !== 'string') throw new Error('Question must be a string');

	process.stdin.resume();

    return new Promise(resolve => {
        const onData = (data) => {
			data = data.toString().trim();
			process.stdin.off('data', onData);
			process.stdin.pause();
			resolve(data);
        }
        process.stdin.on('data', onData);
		if (question) process.stdout.write(question);
    })
} exports.default = Prompt;
module.exports = exports.default;