import { MicroClient } from "../typings";
import { Message } from "discord.js";

export default {
	name: 'ping',
	description: 'Pong!',
	cooldown: 5,
	execute(message: Message, client: MicroClient, args: string[]) {
		if (args.length) return message.reply('No arguments allowed');
		message.reply('Pong.');
	}
}
module.exports = exports.default;