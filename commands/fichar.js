const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fichar')
        .setDescription('📝 Iniciar una propuesta de contrato profesional')
        .addUserOption(o => o.setName('jugador').setDescription('Jugador a contratar').setRequired(true))
        .addRoleOption(o => o.setName('equipo').setDescription('Equipo oficial').setRequired(true))
        .addIntegerOption(o => o.setName('valor').setDescription('Costo del contrato').setRequired(true)),

    async execute(interaction) {
        const jugador = interaction.options.getUser('jugador');
        const equipo = interaction.options.getRole('equipo');
        const valor = interaction.options.getInteger('valor');
        const config = await db.get(`config_${interaction.guild.id}`);
        
        const cooldown = await db.get(`cooldown_baja_${jugador.id}`);
        if (cooldown && Date.now() < cooldown) {
            return interaction.reply({ content: "❌ Este jugador tiene una sanción activa por auto-baja y no puede fichar aún.", ephemeral: true });
        }

        const saldo = await db.get(`presupuesto_${equipo.id}`) || 0;
        if (saldo < valor) return interaction.reply(`❌ Fondos insuficientes. El club solo tiene **$${saldo.toLocaleString()}**.`);

        const embedOferta = new EmbedBuilder()
            .setTitle('📋 Propuesta de Contrato Profesional')
            .setColor('#2ecc71')
            .setThumbnail(jugador.displayAvatarURL({ dynamic: true }))
            .setDescription(`¡Atención ${jugador}! Has recibido una oferta formal para unirte a las filas de un club oficial.`)
            .addFields(
                { name: '🏃 Jugador Destino', value: `${jugador}\n(\`${jugador.tag}\`)`, inline: true },
                { name: '🛡️ Club Interesado', value: `${equipo}`, inline: true },
                { name: '💰 Valor Contrato', value: `\`$${valor.toLocaleString()}\``, inline: true },
                { name: '🕒 Oferta Vence', value: 'En 60 segundos', inline: false }
            )
            .setFooter({ text: 'Liga de Voleibol - Mercado de Pases', iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('f_si').setLabel('Aceptar Contrato').setStyle(ButtonStyle.Success).setEmoji('✍️'),
            new ButtonBuilder().setCustomId('f_no').setLabel('Declinaro').setStyle(ButtonStyle.Danger)
        );

        const msg = await interaction.reply({ content: `${jugador}`, embeds: [embedOferta], components: [row], fetchReply: true });
        
        const collector = msg.createMessageComponentCollector({ filter: i => i.user.id === jugador.id, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'f_si') {
                const miembro = await interaction.guild.members.fetch(jugador.id);
                await db.sub(`presupuesto_${equipo.id}`, valor);
                await db.set(`contrato_${jugador.id}`, valor);
                await miembro.roles.add(equipo);

                const exito = new EmbedBuilder()
                    .setTitle('🎉 ¡Fichaje Oficializado!')
                    .setColor('#2ecc71')
                    .setThumbnail(jugador.displayAvatarURL())
                    .setDescription(`El contrato ha sido firmado. **${jugador.username}** ahora es parte de **${equipo.name}**.`)
                    .addFields(
                        { name: '💵 Inversión Final', value: `\`$${valor.toLocaleString()}\``, inline: true },
                        { name: '📅 Fecha de Firma', value: `<t:${Math.floor(Date.now() / 1000)}:d>`, inline: true }
                    )
                    .setFooter({ text: 'Operación Registrada Exitosamente' });

                await i.update({ content: '', embeds: [exito], components: [] });
            } else {
                await i.update({ content: `❌ La oferta de **${equipo.name}** fue rechazada por el jugador.`, embeds: [], components: [] });
            }
        });
    }
};