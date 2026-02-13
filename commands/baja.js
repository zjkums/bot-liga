const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('baja')
        .setDescription('📉 Abandonar un equipo o tramitar baja de jugador')
        .addRoleOption(o => o.setName('equipo').setDescription('Equipo actual del jugador').setRequired(true))
        .addUserOption(o => o.setName('jugador').setDescription('Jugador (vacío si eres tú)').setRequired(false)),

    async execute(interaction) {
        const equipo = interaction.options.getRole('equipo');
        const usuario = interaction.options.getUser('jugador') || interaction.user;
        const config = await db.get(`config_${interaction.guild.id}`);
        const valorC = await db.get(`contrato_${usuario.id}`);
        const esAutoBaja = usuario.id === interaction.user.id;

        const miembro = await interaction.guild.members.fetch(usuario.id);
        const reembolso = valorC ? Math.floor(valorC * 0.5) : 0;

        if (esAutoBaja) {
            const cd = await db.get(`cooldown_baja_${usuario.id}`);
            if (cd && Date.now() < cd) {
                const dias = Math.ceil((cd - Date.now()) / (1000 * 60 * 60 * 24));
                return interaction.reply({ content: `⚠️ Sanción activa. Debes esperar **${dias} días** para darte de baja nuevamente.`, ephemeral: true });
            }
            await db.set(`cooldown_baja_${usuario.id}`, Date.now() + (7 * 24 * 60 * 60 * 1000));
        }

        await miembro.roles.remove(equipo);
        await db.add(`presupuesto_${equipo.id}`, reembolso);
        await db.delete(`contrato_${usuario.id}`);

        const embed = new EmbedBuilder()
            .setTitle(esAutoBaja ? '🚪 Salida Voluntaria de Plantilla' : '📉 Baja Administrativa de Jugador')
            .setColor('#e74c3c')
            .setThumbnail(usuario.displayAvatarURL({ dynamic: true }))
            .setDescription(`Se ha procesado la desvinculación oficial del jugador.`)
            .addFields(
                { name: '👤 Jugador Saliente', value: `${usuario}\n(\`${usuario.tag}\`)`, inline: true },
                { name: '🛡️ Club Anterior', value: `${equipo.name}`, inline: true },
                { name: '💰 Reembolso al Club', value: `\`$${reembolso.toLocaleString()}\``, inline: true },
                { name: '📅 Fecha y Hora', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
            )
            .setFooter({ text: 'Sistema de Gestión de Plantillas' })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};