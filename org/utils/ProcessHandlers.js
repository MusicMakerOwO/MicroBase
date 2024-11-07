const log = require('./Logs.js');

module.exports = function () {

	// Crtl + C
	process.on('SIGINT', () => {
		console.log();
		log.error('SIGINT: Exiting...');
		process.reallyExit(0);
	});

	// Standard crash
	process.on('uncaughtException', (err) => {
		log.error(`UNCAUGHT EXCEPTION: ${err.stack}`);
	});

	// Killed process
	process.on('SIGTERM', () => {
		log.error('SIGTERM: Exiting...');
		process.reallyExit(0);
	});

	// Standard crash
	process.on('unhandledRejection', (err) => {
		log.error(`UNHANDLED REJECTION: ${err.stack}`);
	});

	// Deprecation warnings
	process.on('warning', (warning) => {
		log.warn(`WARNING: ${warning.name} : ${warning.message}`);
	});

	// Reference errors
	process.on('uncaughtReferenceError', (err) => {
		log.error(err.stack);
	});

};
