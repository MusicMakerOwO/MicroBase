// const { SlashCommandBuilder } = require('@discordjs/builders');
import { SlashCommandBuilder } from '@discordjs/builders';
import { MicroClient, CommandInteraction } from '../typings';

export default {
	defer: false,
	data: new SlashCommandBuilder()
		.setName('guilds')
		.setDescription('List all guilds the bot is in'),
	async execute(interaction: CommandInteraction, client: MicroClient) {
		const guilds = await client.shards.fetchClientValue('guilds.cache.size'); // [ { shardID: 0, value: 10 }, { shardID: 1, value: 12 }, ... ]
		const totalGuilds = guilds.reduce((acc, val) => acc + val.value, 0);
		const shardCount = guilds.length;
		const shards = guilds.map((guild) => `Shard ${guild.shardID}: ${guild.value} guilds`).join('\n');

		await interaction.reply(`Total guilds: ${totalGuilds}\nShard count: ${shardCount}\n\n${shards}`);
	}
}
module.exports = exports.default;