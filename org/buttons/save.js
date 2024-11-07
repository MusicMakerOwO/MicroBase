module.exports = {
	customID: 'save',
	execute: async function(interaction) {
		const embed = {
			color: 0x00ff00,
			description: 'Your edits have been saved!'
		}

		await interaction.update({
			content: '',
			embeds: [embed],
			components: []
		})

		await new Promise(resolve => setTimeout(resolve, 1000 * 5));
		await interaction.deleteReply().catch( () => {} );
	}
}
