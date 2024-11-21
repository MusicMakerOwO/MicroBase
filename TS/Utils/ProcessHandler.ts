import Log from './Logs';
const { PROCESS_HANDLER } = require('../../config.json') as { PROCESS_HANDLER: boolean };

( () => {
	if (!PROCESS_HANDLER) return;
	
	// Crtl + C
	process.on('SIGINT', () => {
		console.log();
		Log.error('SIGINT: Exiting...');
		process.exit(0);
	});

	// Standard crash
	process.on('uncaughtException', (err) => {
		Log.error(`UNCAUGHT EXCEPTION: ${err}`);
	});

	// Killed process
	process.on('SIGTERM', () => {
		Log.error('SIGTERM: Exiting...');
		process.exit(0);
	});

	// Standard crash
	process.on('unhandledRejection', (err) => {
		Log.error(`UNHANDLED REJECTION: ${err}`);
	});

	// Deprecation warnings
	process.on('warning', (warning) => {
		Log.warn(`WARNING: ${warning.name} : ${warning.message}`);
	});

	// Reference errors
	process.on('uncaughtReferenceError', (err) => {
		Log.error(err);
	});
})();