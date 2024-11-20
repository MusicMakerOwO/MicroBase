import { MicroClient, AnySelectMenuInteraction } from "../typings";

export default {
	customID: 'select',
	execute: async function(client: MicroClient, interaction: AnySelectMenuInteraction) {
		const selected = interaction.values[0];

		await interaction.reply({
			content: `You selected: ${selected}`,
			ephemeral: true
		});
	}
}
module.exports = exports.default;