require('dotenv').config(); // Carga las variables del archivo .env
const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const fs = require('fs');
// const revisarPrestamos = require('./utils/revisarPrestamos'); 

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// Leemos la ID del canal desde el archivo .env
const CANAL_MERCADO_ID = process.env.CANAL_MERCADO_ID;

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

// Carga de comandos
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

client.once('ready', () => {
    console.log(`🤖 Bot conectado como ${client.user.tag}`);
    console.log(`🏦 Sistema de economía y mercado de pases listo.`);
    // if (typeof revisarPrestamos === 'function') revisarPrestamos();
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);

        // --- SISTEMA DE LOGS PARA EL CANAL DE MERCADO ---
        const comandosMercado = ['fichar', 'baja', 'transferir', 'prestamo'];
        
        if (comandosMercado.includes(interaction.commandName)) {
            const canalMercado = interaction.guild.channels.cache.get(CANAL_MERCADO_ID);
            
            // Si el canal existe y el comando ya respondió
            if (canalMercado && (interaction.replied || interaction.deferred)) {
                // Esperamos un momento para capturar el embed final
                setTimeout(async () => {
                    try {
                        const mensajeOriginal = await interaction.fetchReply();
                        if (mensajeOriginal.embeds.length > 0) {
                            await canalMercado.send({ 
                                content: `📦 **Registro Oficial de Mercado**`, 
                                embeds: [mensajeOriginal.embeds[0]] 
                            });
                        }
                    } catch (e) {
                        console.log("No se pudo enviar el log al canal de mercado:", e.message);
                    }
                }, 2500);
            }
        }

    } catch (error) {
        console.error("Error detectado en el comando:", error);
        
        const respuestaError = { content: '❌ Hubo un error ejecutando el comando.', ephemeral: true };
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(respuestaError).catch(() => {});
        } else {
            await interaction.reply(respuestaError).catch(() => {});
        }
    }
});

// Login usando la variable de entorno
client.login(process.env.DISCORD_TOKEN);