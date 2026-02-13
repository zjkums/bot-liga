const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('perfil_equipo')
        .setDescription('🛡️ Plantilla oficial del club')
        .addRoleOption(o => o.setName('equipo').setDescription('Equipo a consultar').setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();
        const equipo = interaction.options.getRole('equipo');
        const presupuesto = await db.get(`presupuesto_${equipo.id}`) || 0;
        const miembros = await interaction.guild.members.fetch();
        const plantilla = miembros.filter(m => m.roles.cache.has(equipo.id));

        const lista = await Promise.all(plantilla.map(async m => {
            const c = await db.get(`contrato_${m.id}`) || 0;
            return `▫️ **${m.user.username}** — \`$${c.toLocaleString()}\``;
        }));

        const embed = new EmbedBuilder()
            .setTitle(`🛡️ Perfil: ${equipo.name}`)
            .setColor(equipo.color || '#3498db')
            .addFields(
                { name: '💰 Presupuesto', value: `\`$${presupuesto.toLocaleString()}\``, inline: true },
                { name: '👥 Jugadores', value: `\`${plantilla.size}/18\``, inline: true },
                { name: '🏃 Plantilla', value: lista.join('\n') || '*Vacío*' }
            )
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    }
};