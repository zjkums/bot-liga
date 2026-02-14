const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { QuickDB } = require("quick.db");
const path = require("path");
const db = new QuickDB({ filePath: path.join(__dirname, "..", "data", "database.sqlite") });

module.exports = {
    data: new SlashCommandBuilder()
        .setName('transferir')
        .setDescription('🤝 Traspaso oficial de un jugador entre clubes')
        .addUserOption(o => o.setName('jugador').setDescription('Jugador a mover').setRequired(true))
        .addRoleOption(o => o.setName('vendedor').setDescription('Equipo que vende').setRequired(true))
        .addRoleOption(o => o.setName('comprador').setDescription('Equipo que compra').setRequired(true))
        .addIntegerOption(o => o.setName('precio').setDescription('Precio acordado').setRequired(true)),

    async execute(interaction) {
        const config = await db.get(`config_roles_${interaction.guild.id}`);
        const isDT = interaction.member.roles.cache.has(config?.dt) || interaction.member.roles.cache.has(config?.subdt);
        if (!isDT && !interaction.member.permissions.has('Administrator')) return interaction.reply('❌ No tienes permiso.');

        const jugador = interaction.options.getUser('jugador');
        const rolV = interaction.options.getRole('vendedor');
        const rolC = interaction.options.getRole('comprador');
        const precio = interaction.options.getInteger('precio');

        const saldoC = await db.get(`presupuesto_${rolC.id}`) || 0;
        if (saldoC < precio) return interaction.reply('❌ El comprador no tiene fondos suficientes.');

        const embed = new EmbedBuilder()
            .setTitle('🤝 Acuerdo de Transferencia')
            .setColor('#f1c40f')
            .setDescription(`${jugador}, se ha llegado a un acuerdo para tu traspaso.\n\n**Origen:** ${rolV.name}\n**Destino:** ${rolC.name}\n**Costo:** $${precio.toLocaleString()}`)
            .setFooter({ text: 'El jugador debe confirmar la firma' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('t_si').setLabel('Confirmar Traspaso').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('t_no').setLabel('Rechazar').setStyle(ButtonStyle.Danger)
        );

        const msg = await interaction.reply({ content: `${jugador}`, embeds: [embed], components: [row], fetchReply: true });
        const col = msg.createMessageComponentCollector({ filter: i => i.user.id === jugador.id, time: 60000 });

        col.on('collect', async i => {
            if (i.customId === 't_si') {
                const miembro = await interaction.guild.members.fetch(jugador.id);
                await db.sub(`presupuesto_${rolC.id}`, precio);
                await db.add(`presupuesto_${rolV.id}`, precio);
                await db.set(`contrato_${jugador.id}`, precio);
                await miembro.roles.remove(rolV);
                await miembro.roles.add(rolC);
                await i.update({ content: `✅ **${jugador.username}** es nuevo jugador de **${rolC.name}**!`, embeds: [], components: [] });
            } else {
                await i.update({ content: '❌ Traspaso cancelado.', embeds: [], components: [] });
            }
        });
    }
};