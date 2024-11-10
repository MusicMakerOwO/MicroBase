import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder } from '@discordjs/builders';
import { MicroClient, CommandInteraction, ButtonInteraction } from '../typings';

export default {
	data: new SlashCommandBuilder()
	.setName('poke')
	.setDescription('Poke the bot'),
	async execute(interaction: CommandInteraction, client: MicroClient) {
		const button = new ActionRowBuilder<ButtonBuilder>()
		.addComponents(
			new ButtonBuilder()
				.setCustomId('poke')
				.setLabel('Poke')
				// @ts-ignore - It says invalid but DJS checks internally :skull:
				.setStyle('Primary') // 1
		);

		await interaction.reply({
			content: 'Poke the bot!',
			components: [button]
		});

		const collector = interaction.createCollector()
		collector.on('collect', async (buttonInteraction: ButtonInteraction) => {
			await buttonInteraction.reply({
				content: 'Hey dont poke me!',
				ephemeral: true
			});
		});
	}
}
module.exports = exports.default;