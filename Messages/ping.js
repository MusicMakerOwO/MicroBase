module.exports = {
	name: 'ping',
	description: 'Pong!',
	cooldown: 5,
	execute(message, client, args) {
		if (args.length) return message.reply('No arguments allowed');
		message.reply('Pong.');
	}
};