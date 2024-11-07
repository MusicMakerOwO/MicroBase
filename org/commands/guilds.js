const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	defer: false,
	data: new SlashCommandBuilder()
		.setName('guilds')
		.setDescription('List all guilds the bot is in'),
	async execute(interaction, client) {
		const guilds = await client.shards.fetchClientValue('guilds.cache.size'); // [ { shardID: 0, value: 10 }, { shardID: 1, value: 12 }, ... ]
		const totalGuilds = guilds.reduce((acc, val) => acc + val.value, 0);
		const shardCount = guilds.length;
		const shards = guilds.map((guild) => `Shard ${guild.shardID}: ${guild.value} guilds`).join('\n');

		await interaction.reply(`Total guilds: ${totalGuilds}\nShard count: ${shardCount}\n\n${shards}`);
	}
}