"use strict";
// src/bot.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const discord_js_1 = require("discord.js");
const axios_1 = __importDefault(require("axios"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const bignumber_js_1 = __importDefault(require("bignumber.js"));
dotenv_1.default.config();
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
const allowedOrigins = (_a = process.env.ALLOWED_ORIGINS) === null || _a === void 0 ? void 0 : _a.split(',');
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    optionsSuccessStatus: 200
}));
app.use(express_1.default.json());
const bot = new discord_js_1.Client({
    intents: [discord_js_1.Intents.FLAGS.GUILDS, discord_js_1.Intents.FLAGS.GUILD_MEMBERS, discord_js_1.Intents.FLAGS.GUILD_MESSAGES]
});
app.get('/', (req, res) => {
    res.send('Hello from Ferrum Authenticator!');
});
app.post('/authenticate', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { code, userAddress } = req.body;
    try {
        const tokenResponse = yield axios_1.default.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: DISCORD_REDIRECT_URL,
            scope: 'identify'
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        const discordToken = tokenResponse.data.access_token;
        // Use the access token to get the user's Discord info
        const userResponse = yield axios_1.default.get('https://discord.com/api/users/@me', {
            headers: {
                authorization: `Bearer ${discordToken}`
            }
        });
        const discordUserId = userResponse.data.id;
        const user = yield bot.users.fetch(discordUserId);
        if (!user) {
            throw new Error(`Discord user not found: ${discordUserId}`);
        }
        const guild = bot.guilds.cache.get(DISCORD_SERVER_GUILD_ID);
        const member = guild === null || guild === void 0 ? void 0 : guild.members.cache.get(user.id);
        const roleFrmHolder = guild === null || guild === void 0 ? void 0 : guild.roles.cache.find(role => role.name === "FRM Holder");
        const roleQualifiedVoter = guild === null || guild === void 0 ? void 0 : guild.roles.cache.find(role => role.name === "Qualified Voter");
        const roleGovernanceComittee = guild === null || guild === void 0 ? void 0 : guild.roles.cache.find(role => role.name === "Governance Committee");
        const roleQualifiedVoterProposalCreator = guild === null || guild === void 0 ? void 0 : guild.roles.cache.find(role => role.name === "Qualified Proposal Creator");
        // console.log(`Role: `, role);
        const channelId = DISCORD_SERVER_GUILD_CHANNEL_ID;
        const channel = guild === null || guild === void 0 ? void 0 : guild.channels.cache.get(channelId);
        // TODO: Continue with your existing logic
        try {
            const response = yield axios_1.default.get(`${API_URL_SNAP_HODL}/getSnapShotBySnapShotIdAndAddress/${SNAP_SHOT_ID}/${userAddress}`);
            const snapShotAddress = response.data.address;
            const snapShotBalance = new bignumber_js_1.default(response.data.snapShotBalance);
            console.log(`Snapshot balance for ${snapShotAddress}: ${snapShotBalance.toString()}`);
            let rolesToAdd = [];
            let roleNames = '';
            if (snapShotBalance.isGreaterThan(0) && snapShotBalance.isLessThan(420000)) {
                rolesToAdd = [roleFrmHolder, roleQualifiedVoter].filter(role => role !== undefined);
                roleNames = rolesToAdd.map(role => role.name).join(" & ");
            }
            else if (snapShotBalance.isGreaterThanOrEqualTo(420000) && snapShotBalance.isLessThan(450000)) {
                rolesToAdd = [roleFrmHolder, roleGovernanceComittee, roleQualifiedVoter].filter(role => role !== undefined);
                roleNames = rolesToAdd.map(role => role.name).join(", ");
            }
            else if (snapShotBalance.isGreaterThanOrEqualTo(450000)) {
                rolesToAdd = [roleFrmHolder, roleGovernanceComittee, roleQualifiedVoter, roleQualifiedVoterProposalCreator].filter(role => role !== undefined);
                roleNames = rolesToAdd.map(role => role.name).join(", ");
            }
            if (rolesToAdd.length > 0 && member) {
                for (const role of rolesToAdd) {
                    yield member.roles.add(role);
                }
                yield channel.send(`${user} has been assigned the ${roleNames} roles.`);
            }
            else {
                yield channel.send(`Error: User ${user} not found or role "FRM Holder" not found.`);
            }
        }
        catch (error) {
            console.error('Error getting snapshot balance:', error);
            yield channel.send(`Error occurred while verifying user ${user}'s wallet.`);
        }
    }
    catch (error) {
        console.error('Error verifying user:', error);
        res.status(500).json({ message: 'Error verifying user' });
    }
}));
app.listen(PORT, () => console.log(`Bot server listening on port ${PORT}`));
bot.once('ready', () => {
    var _a;
    console.log(`Logged in as ${(_a = bot.user) === null || _a === void 0 ? void 0 : _a.tag}!`);
    // ADD THIS CODE BELOW
    const channel = bot.channels.cache.get(DISCORD_SERVER_GUILD_BOT_CHANNEL_ID);
    const row = new discord_js_1.MessageActionRow()
        .addComponents(new discord_js_1.MessageButton()
        .setCustomId('verify')
        .setLabel('Verify me')
        .setStyle('PRIMARY'));
    channel.send({ content: 'To gain access to gated roles, you need to verify your holdings.\n\nThis is a readonly bot and connection.\n\nThere are no transactions or fees associated with validation. To begin validation click the button below.\n\nThen Login with Discord (make sure you verify the URL).\n\nOnce that is done you will be directed to a page to connect and verify your wallet so the Ferrum Authenticator can assign you the appropriate gated role.\n', components: [row] });
});
bot.on('interactionCreate', (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    if (!interaction.isButton())
        return;
    const buttonInteraction = interaction;
    const { customId } = buttonInteraction;
    if (customId === 'verify') {
        yield buttonInteraction.reply({ content: `Start the verification process by visiting: ${DISCORD_REDIRECT_URL}`, ephemeral: true });
    }
}));
bot.login(TOKEN);
