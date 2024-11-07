module.exports = {
	customID: 'select',
	execute: async function(interaction, client, args) {
		const selected = interaction.values[0];

		await interaction.reply({
			content: `You selected: ${selected}`,
			ephemeral: true
		});
	}
}