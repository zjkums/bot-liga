const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const path = require("path");
const db = new QuickDB({ filePath: path.join(__dirname, "..", "data", "database.sqlite") });

module.exports = {
    data: new SlashCommandBuilder()
        .setName('perfil_equipo')
        .setDescription('🛡️ Visualizar presupuesto y plantilla de un club')
        .addRoleOption(o => o.setName('equipo').setDescription('Equipo a consultar').setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();
        const equipo = interaction.options.getRole('equipo');
        const presupuesto = await db.get(`presupuesto_${equipo.id}`) || 0;
        
        const plantilla = equipo.members;
        const lista = await Promise.all(plantilla.map(async m => {
            const c = await db.get(`contrato_${m.id}`) || 0;
            return `▫️ **${m.user.username}** — \`$${c.toLocaleString()}\``;
        }));

        const embed = new EmbedBuilder()
            .setTitle(`🛡️ Perfil de Club: ${equipo.name}`)
            .setColor(equipo.color || '#3498db')
            .addFields(
                { name: '💰 Presupuesto Disponible', value: `\`$${presupuesto.toLocaleString()}\``, inline: true },
                { name: '👥 Plantilla', value: `\`${plantilla.size}/16\``, inline: true },
                { name: '📋 Jugadores Inscritos', value: lista.join('\n') || '*Sin jugadores*' }
            )
            .setThumbnail(interaction.guild.iconURL());

        await interaction.editReply({ embeds: [embed] });
    }
};