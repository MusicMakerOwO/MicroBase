const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	dev: true, // hide from all guilds except from config.json
	guilds: ['123456789012345678'], // guild whitelist via ID
	roles: ['123456789012345678'], // required to have one of the listed role IDs
	users: ['123456789012345678'], // user whitelist via ID
	cooldown: 5, // cooldown in seconds
	userPerms: ['ManageGuild'], // required user permissions
	clientPerms: ['Administrator'], // required bot permissions
	data: new SlashCommandBuilder()
		.setName('restricted')
		.setDescription('A restricted command')
		.addStringOption(x => x
			.setName('input')
			.setDescription('The input to echo back')
			.setRequired(true)
		),
	async execute(interaction) {
		const input = interaction.options.getString('input');
		await interaction.reply(`You provided: ${input}`);
	},
};