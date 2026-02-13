const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cartera')
        .setDescription('💰 Consulta el saldo de tu billetera personal')
        .addUserOption(o => o.setName('usuario').setDescription('Ver la cartera de otro usuario').setRequired(false)),

    async execute(interaction) {
        const usuario = interaction.options.getUser('usuario') || interaction.user;
        const saldo = await db.get(`cartera_${usuario.id}`) || 0;

        const embed = new EmbedBuilder()
            .setTitle('💰 Estado de Cuenta Personal')
            .setColor('#f1c40f')
            .setThumbnail(usuario.displayAvatarURL({ dynamic: true }))
            .setDescription(`Resumen detallado de los activos financieros del usuario.`)
            .addFields(
                { name: '👤 Titular de Cuenta', value: `${usuario}\n(\`${usuario.tag}\`)`, inline: true },
                { name: '💵 Saldo Disponible', value: `\`$${saldo.toLocaleString()}\``, inline: true },
                { name: '📅 Fecha de Consulta', value: `<t:${Math.floor(Date.now() / 1000)}:d>`, inline: false }
            )
            .setFooter({ text: 'Liga de Voleibol - Sistema Económico' })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};