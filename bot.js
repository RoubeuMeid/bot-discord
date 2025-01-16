require('dotenv').config();

const { Client, GatewayIntentBits, ModalBuilder, TextInputBuilder, ActionRowBuilder, 
        TextInputStyle, ButtonBuilder, ButtonStyle } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Remplacez ces valeurs par vos propres IDs
const config = {
    TOKEN: 'MTMyODkzMTgyNzMxODEzMjc4Nw.Gevr5v.IwnufuObKTcL0eMoSwsztpkpt5a4iZDcxwgk1c',         // Le token copié depuis le portail développeur Discord
    GUILD_ID: '349989708635439104',  // Clic droit sur le serveur -> Copier l'ID
    VERIFICATION_CHANNEL_ID: '1328575869257646172', // ID du channel vérification
    UNVERIFIED_ROLE_ID: '1328549749015576688',  // ID du rôle Non vérifié
    MEMBER_ROLE_ID: '1328551399621136434',  // ID du rôle Membre
    MODERATOR_CHANNEL_ID: '1325808694658732085'  // ID du salon "moderator-only"
};

// Quand le bot démarre
client.on('ready', () => {
    console.log(`Bot connecté en tant que ${client.user.tag}`);
});

// Quand un nouveau membre rejoint
client.on('guildMemberAdd', async (member) => {
    try {
        // Attribuer le rôle "Non vérifié"
        await member.roles.add(config.UNVERIFIED_ROLE_ID);
        
        // Envoyer le message dans le canal "vérification"
        const verificationChannel = member.guild.channels.cache.get(config.VERIFICATION_CHANNEL_ID);
        if (verificationChannel) {
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('verify-button')
                        .setLabel('Vérifier mon pseudo WoW')
                        .setStyle(ButtonStyle.Primary)
                );

            await verificationChannel.send({
                content: `Bienvenue ${member}! Pour accéder au serveur, veuillez indiquer votre pseudo World of Warcraft.
Si vous n'êtes pas un joueur WOW laissez le pseudo que vous souhaitez.
Si vous êtes membre de la guilde Freedom Spirit ajoutez (FS), exemple : Mickey(FS).`,
                components: [row]
            });
        }
    } catch (error) {
        console.error('Erreur lors de l\'attribution du rôle:', error);
    }
});

// Quand quelqu'un clique sur le bouton
client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton() && interaction.customId === 'verify-button') {
        const modal = new ModalBuilder()
            .setCustomId('verify-modal')
            .setTitle('Vérification du pseudo WoW');

        const wowNameInput = new TextInputBuilder()
            .setCustomId('wowname')
            .setLabel('Votre pseudo World of Warcraft')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(wowNameInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
    }
    
    // Quand le formulaire est soumis
    if (interaction.isModalSubmit() && interaction.customId === 'verify-modal') {
        const wowName = interaction.fields.getTextInputValue('wowname');
        const member = interaction.member;

        try {
            // Changer le pseudo Discord
            await member.setNickname(wowName);
            
            // Retirer le rôle "Non vérifié"
            await member.roles.remove(config.UNVERIFIED_ROLE_ID);
            
            // Ajouter le rôle "Membre"
            await member.roles.add(config.MEMBER_ROLE_ID);

            // Envoi du message log dans le salon "moderator-only"
            const moderatorChannel = member.guild.channels.cache.get(config.MODERATOR_CHANNEL_ID);
            if (moderatorChannel) {
                await moderatorChannel.send(`Un nouvel arrivant au nom **${member.user.tag}** a changé son pseudo en **${wowName}**.`);
            }

            await interaction.reply({ 
                content: `Votre pseudo a été vérifié et changé en ${wowName}. Vous avez maintenant accès au serveur!`,
                ephemeral: true 
            });
        } catch (error) {
            console.error('Erreur lors de la vérification:', error);
            await interaction.reply({ 
                content: 'Une erreur est survenue lors de la vérification. Veuillez contacter un administrateur.',
                ephemeral: true 
            });
        }
    }
});

client.login(TOKEN);
