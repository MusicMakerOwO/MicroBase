const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
	.setName('poke')
	.setDescription('Poke the bot'),
	async execute(interaction) {
		const button = new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder()
				.setCustomId('poke')
				.setLabel('Poke')
				.setStyle('Primary')
		);

		await interaction.reply({
			content: 'Poke the bot!',
			components: [button]
		});

		const collector = interaction.createCollector()
		collector.on('collect', async (buttonInteraction) => {
			await buttonInteraction.reply({
				content: 'Hey dont poke me!',
				ephemeral: true
			});
		});
	}
}