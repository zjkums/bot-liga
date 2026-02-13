const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('transferir')
        .setDescription('🤝 Traspaso oficial de un jugador entre clubes')
        .addUserOption(o => o.setName('jugador').setDescription('Jugador a mover').setRequired(true))
        .addRoleOption(o => o.setName('vendedor').setDescription('Equipo que vende').setRequired(true))
        .addRoleOption(o => o.setName('comprador').setDescription('Equipo que compra').setRequired(true))
        .addIntegerOption(o => o.setName('precio').setDescription('Precio acordado').setRequired(true)),

    async execute(interaction) {
        const jugador = interaction.options.getUser('jugador');
        const rolV = interaction.options.getRole('vendedor');
        const rolC = interaction.options.getRole('comprador');
        const precio = interaction.options.getInteger('precio');
        const config = await db.get(`config_${interaction.guild.id}`);

        const esStaff = config?.staffRoles?.some(id => interaction.member.roles.cache.has(id));
        const esVendedor = interaction.member.roles.cache.has(config?.dtRole) && interaction.member.roles.cache.has(rolV.id);

        if (!esStaff && !esVendedor) return interaction.reply({ content: "❌ No tienes autoridad para negociar este traspaso.", ephemeral: true });

        const embed = new EmbedBuilder()
            .setTitle('🤝 Acuerdo de Transferencia Profesional')
            .setColor('#f1c40f')
            .setThumbnail(jugador.displayAvatarURL({ dynamic: true }))
            .setDescription(`Se ha llegado a un acuerdo de mercado para el movimiento del siguiente jugador.`)
            .addFields(
                { name: '🏃 Jugador en Venta', value: `${jugador}\n(\`${jugador.tag}\`)`, inline: false },
                { name: '📤 Club de Origen', value: `${rolV}`, inline: true },
                { name: '📥 Club de Destino', value: `${rolC}`, inline: true },
                { name: '💰 Valor de Operación', value: `\`$${precio.toLocaleString()}\``, inline: false },
                { name: '📅 Fecha de Acuerdo', value: `<t:${Math.floor(Date.now() / 1000)}:d>`, inline: true }
            )
            .setFooter({ text: 'El jugador debe aceptar para oficializar el cambio' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('t_si').setLabel('Confirmar Firma').setStyle(ButtonStyle.Success).setEmoji('🤝'),
            new ButtonBuilder().setCustomId('t_no').setLabel('Rechazar').setStyle(ButtonStyle.Danger)
        );

        const msg = await interaction.reply({ content: `${jugador}`, embeds: [embed], components: [row], fetchReply: true });
        const collector = msg.createMessageComponentCollector({ filter: i => i.user.id === jugador.id, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 't_si') {
                const miembro = await interaction.guild.members.fetch(jugador.id);
                await db.sub(`presupuesto_${rolC.id}`, precio);
                await db.add(`presupuesto_${rolV.id}`, precio);
                await db.set(`contrato_${jugador.id}`, precio);
                await miembro.roles.remove(rolV);
                await miembro.roles.add(rolC);

                const exito = new EmbedBuilder()
                    .setTitle('✅ ¡Traspaso Completado!')
                    .setColor('#2ecc71')
                    .setDescription(`**${jugador.username}** ha firmado exitosamente con su nuevo club: **${rolC.name}**.`);
                await i.update({ content: '', embeds: [exito], components: [] });
            } else {
                await i.update({ content: '❌ El traspaso ha sido cancelado por el jugador.', embeds: [], components: [] });
            }
        });
    }
};