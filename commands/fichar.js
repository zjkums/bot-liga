const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { QuickDB } = require("quick.db");
const path = require("path");
const db = new QuickDB({ filePath: path.join(__dirname, "..", "data", "database.sqlite") });

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fichar')
        .setDescription('🤝 Enviar una propuesta formal de contrato a un jugador')
        .addUserOption(o => o.setName('jugador').setDescription('Jugador a contratar').setRequired(true))
        .addRoleOption(o => o.setName('equipo').setDescription('Equipo que representa').setRequired(true))
        .addIntegerOption(o => o.setName('valor').setDescription('Monto del contrato').setRequired(true)),

    async execute(interaction) {
        const config = await db.get(`config_roles_${interaction.guild.id}`);
        if (!config) return interaction.reply({ content: '❌ Usa `/configurar_liga` primero.', ephemeral: true });

        const isDT = interaction.member.roles.cache.has(config.dt) || interaction.member.roles.cache.has(config.subdt);
        if (!isDT) return interaction.reply({ content: '❌ No tienes autorización de la directiva para fichar.', ephemeral: true });

        const jugador = interaction.options.getUser('jugador');
        const equipo = interaction.options.getRole('equipo');
        const valor = interaction.options.getInteger('valor');

        if (equipo.members.size >= 16) return interaction.reply({ content: `❌ El equipo **${equipo.name}** ya tiene el cupo máximo (16/16).`, ephemeral: true });

        const saldoClub = await db.get(`presupuesto_${equipo.id}`) || 0;
        if (saldoClub < valor) return interaction.reply({ content: `❌ Fondos insuficientes. Presupuesto: **$${saldoClub.toLocaleString()}**.`, ephemeral: true });

        const embedOferta = new EmbedBuilder()
            .setTitle('📋 Propuesta de Contrato Profesional')
            .setColor('#2ecc71')
            .setThumbnail(jugador.displayAvatarURL({ dynamic: true }))
            .setDescription(`¡Atención ${jugador}! Has recibido una oferta para unirte a **${equipo.name}**.`)
            .addFields(
                { name: '🛡️ Club', value: `${equipo}`, inline: true },
                { name: '💰 Valor', value: `\`$${valor.toLocaleString()}\``, inline: true }
            )
            .setFooter({ text: 'La oferta expira en 60 segundos' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('f_si').setLabel('Firmar Contrato').setStyle(ButtonStyle.Success).setEmoji('✍️'),
            new ButtonBuilder().setCustomId('f_no').setLabel('Declinar').setStyle(ButtonStyle.Danger)
        );

        const msg = await interaction.reply({ content: `${jugador}`, embeds: [embedOferta], components: [row], fetchReply: true });
        const collector = msg.createMessageComponentCollector({ filter: i => i.user.id === jugador.id, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'f_si') {
                const miembro = await interaction.guild.members.fetch(jugador.id);
                await db.sub(`presupuesto_${equipo.id}`, valor);
                await db.add(`cartera_${jugador.id}`, valor);
                await db.set(`contrato_${jugador.id}`, valor);
                
                await miembro.roles.add(equipo);
                await miembro.roles.remove(config.libre).catch(() => {});

                const exito = new EmbedBuilder()
                    .setTitle('🎉 ¡Fichaje Oficializado!')
                    .setColor('#2ecc71')
                    .setDescription(`**${jugador.username}** se une oficialmente a la plantilla de **${equipo.name}**.`)
                    .addFields({ name: '💵 Inversión', value: `\`$${valor.toLocaleString()}\``, inline: true });

                await i.update({ content: '', embeds: [exito], components: [] });
            } else {
                await i.update({ content: '❌ Oferta rechazada.', embeds: [], components: [] });
            }
        });
    }
};