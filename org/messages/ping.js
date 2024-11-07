module.exports = {
	name: 'ping',
	description: 'Pong!',
	cooldown: 5,
	execute(message, client, args) {
		if (args.length) return message.channel.send('No arguments allowed');
		message.channel.send('Pong.');
	}
}