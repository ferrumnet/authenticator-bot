// discord-bot/src/Bot.ts

import dotenv from 'dotenv';
import { Client, Intents, Message, Role, TextChannel, ButtonInteraction, MessageActionRow, MessageButton } from "discord.js";
import axios from 'axios';
import express from 'express';
import cors from 'cors';

dotenv.config();

const TOKEN = process.env.BOT_TOKEN;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const SNAP_SHOT_ID = process.env.SNAP_SHOT_ID;
const API_URL_SNAP_HODL = process.env.API_URL_SNAP_HODL;
const DISCORD_REDIRECT_URL = process.env.DISCORD_REDIRECT_URL;
const PORT = process.env.PORT;
const DISCORD_SERVER_GUILD_ID = process.env.DISCORD_SERVER_GUILD_ID;
const DISCORD_SERVER_GUILD_CHANNEL_ID = process.env.DISCORD_SERVER_GUILD_CHANNEL_ID;
const DISCORD_SERVER_GUILD_BOT_CHANNEL_ID = process.env.DISCORD_SERVER_GUILD_BOT_CHANNEL_ID;

console.log("Bot is starting...");

const bot = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES]
});

const app = express();

app.use(cors());
app.use(express.json());

app.post('/authenticate', async (req, res) => {
    const { code, userAddress } = req.body;

    try {
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: CLIENT_ID!,
            client_secret: CLIENT_SECRET!,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: DISCORD_REDIRECT_URL!,
            scope: 'identify'
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });


        const discordToken = tokenResponse.data.access_token;

        // Use the access token to get the user's Discord info
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: {
                authorization: `Bearer ${discordToken}`
            }
        });

        const discordUserId = userResponse.data.id;
        const user = await bot.users.fetch(discordUserId);
        if (!user) {
            throw new Error(`Discord user not found: ${discordUserId}`);
        }

        const guild = bot.guilds.cache.get(DISCORD_SERVER_GUILD_ID!);
        const member = guild?.members.cache.get(user.id);
        const roleFrmHolder = guild?.roles.cache.find(role => role.name === "FRM Holder");
        const roleQualifiedVoter = guild?.roles.cache.find(role => role.name === "Qualified Voter");
        const roleGovernanceComittee = guild?.roles.cache.find(role => role.name === "Governance Committee");
        const roleQualifiedVoterProposalCreator = guild?.roles.cache.find(role => role.name === "Qualified Proposal Creator");
        // console.log(`Role: `, role);

        const channelId = DISCORD_SERVER_GUILD_CHANNEL_ID!;
        const channel = guild?.channels.cache.get(channelId) as TextChannel;

        // TODO: Continue with your existing logic
        try {
            const response = await axios.get(`${API_URL_SNAP_HODL}/getSnapShotBySnapShotIdAndAddress/${SNAP_SHOT_ID}/${userAddress}`);
            const snapShotBalance = parseFloat(response.data.snapShotBalance);
            console.log(`Snapshot balance: ${snapShotBalance}`);

            let rolesToAdd: Role[] = [];
            let roleNames = '';

            if (snapShotBalance > 0 && snapShotBalance < 450000) {
                rolesToAdd = [roleFrmHolder, roleQualifiedVoter].filter(role => role !== undefined) as Role[];
                roleNames = rolesToAdd.map(role => role.name).join(" & ");
            } else if (snapShotBalance >= 450000) {
                rolesToAdd = [roleFrmHolder, roleGovernanceComittee, roleQualifiedVoter, roleQualifiedVoterProposalCreator].filter(role => role !== undefined) as Role[];
                roleNames = rolesToAdd.map(role => role.name).join(", ");
            }

            if (rolesToAdd.length > 0 && member) {
                for (const role of rolesToAdd) {
                    await member.roles.add(role);
                }
                await channel.send(`${user} has been assigned the ${roleNames} roles.`);
            } else {
                await channel.send(`Error: User ${user} not found or role "FRM Holder" not found.`);
            }
        } catch (error) {
            console.error('Error getting snapshot balance:', error);
            await channel.send(`Error occurred while verifying user ${user}'s wallet.`);
        }
    } catch (error) {
        console.error('Error verifying user:', error);
        res.status(500).json({ message: 'Error verifying user' });
    }
});

app.listen(PORT, () => console.log(`Bot server listening on port ${PORT}`));

bot.once('ready', () => {
    console.log(`Logged in as ${bot.user?.tag}!`);

    // ADD THIS CODE BELOW
    const channel = bot.channels.cache.get(DISCORD_SERVER_GUILD_BOT_CHANNEL_ID!) as TextChannel;

    const row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('verify')
                .setLabel('Verify me')
                .setStyle('PRIMARY'),
        );

    channel.send({ content: 'To gain access to gated roles, you need to verify your holdings.\n\nThis is a readonly bot and connection.\n\nThere are no transactions or fees associated with validation. To begin validation click the button below.\n\nThen Login with Discord (make sure you verify the URL).\n\nOnce that is done you will be directed to a page to connect and verify your wallet so the Ferrum Authenticator can assign you the appropriate gated role.\n', components: [row] });
});

bot.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    const buttonInteraction = interaction as ButtonInteraction;

    const { customId } = buttonInteraction;

    if (customId === 'verify') {
        await buttonInteraction.reply({ content: `Start the verification process by visiting: ${DISCORD_REDIRECT_URL}`, ephemeral: true });
    }
});

bot.login(TOKEN);