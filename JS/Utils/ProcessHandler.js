//////////////////////////////////////////////////////////////////////
// Welcome to MicroBase!											//
// This code is written in TypeScript and compiled using Sucrase	//
// For any issues, please report them on the GitHub repository		//
// https://github.com/MusicMakerOwO/MicroBase/issues				//
//////////////////////////////////////////////////////////////////////

"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _Logs = require('./Logs'); var _Logs2 = _interopRequireDefault(_Logs);
const { PROCESS_HANDLER } = require('../../config.json') ;

( () => {
	if (!PROCESS_HANDLER) return;
	
	// Crtl + C
	process.on('SIGINT', () => {
		console.log();
		_Logs2.default.error('SIGINT: Exiting...');
		process.exit(0);
	});

	// Standard crash
	process.on('uncaughtException', (err) => {
		_Logs2.default.error(`UNCAUGHT EXCEPTION: ${err}`);
	});

	// Killed process
	process.on('SIGTERM', () => {
		_Logs2.default.error('SIGTERM: Exiting...');
		process.exit(0);
	});

	// Standard crash
	process.on('unhandledRejection', (err) => {
		_Logs2.default.error(`UNHANDLED REJECTION: ${err}`);
	});

	// Deprecation warnings
	process.on('warning', (warning) => {
		_Logs2.default.warn(`WARNING: ${warning.name} : ${warning.message}`);
	});

	// Reference errors
	process.on('uncaughtReferenceError', (err) => {
		_Logs2.default.error(err);
	});
})();