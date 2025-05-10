const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	cache: true,
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('List all commands and their descriptions')
		.addStringOption(x => x
			.setName('command')
			.setDescription('The command to get help for')
			.setRequired(true)
			.setAutocomplete(true)
		),
	autocomplete: async function (interaction, client) {
		// thanks DJS, fuck you for being so convoluted
		const commandList = Array.from(client.commands.values())
			.map(x => ({ name: x.data.name, value: x.data.name }))
			.sort((a, b) => a.name.localeCompare(b.name))

		const focusedValue = interaction.options.getFocused();
		if (!focusedValue) {
			await interaction.respond(commandList);
			return;
		}
		const filtered = commandList.filter(x => x.name.startsWith(focusedValue))
		await interaction.respond(filtered);
	},
	execute: async function (interaction, client) {
		const command = interaction.options.getString('command');

		// we know the command exists because the autocomplete reads the values directly from cache
		// Only way this would break is hot reload deletes it within the 0.01ms window lmfao
		const data = client.commands.get(command).data;

		const embed = {
			color: 0xff7900,
			title: `Help - /${data.name}`,
			description: data.description
		}

		await interaction.reply({
			embeds: [embed],
			ephemeral: true
		});
	}
}