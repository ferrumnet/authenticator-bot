Ferrum Authenticator Bot
========================

The Ferrum Authenticator Bot is a Discord bot designed to verify user holdings and assign roles in the Ferrum Network's Discord server based on these verifications.

Features
--------

-   Interacts with the Discord API to verify user identities and assign roles.
-   Retrieves and verifies snapshot balance data from an API.
-   Includes a simple Express.js server that listens for authentication requests.

Setup
-----

### Prerequisites

-   Node.js and npm installed.
-   A Discord bot token, client secret, and client ID.
-   An API URL for retrieving snapshot data.
-   The ID of the Discord server (guild) and channel in which the bot will operate.
-   The bot should have appropriate permissions on the server.

### Steps

1.  Clone this repository.

2.  Run `npm install` to install the necessary dependencies.

3.  Create a `.env` file in the root directory and set the following variables:

    ```env

    BOT_TOKEN=<your-discord-bot-token>
    DISCORD_CLIENT_SECRET=<your-discord-client-secret>
    DISCORD_CLIENT_ID=<your-discord-client-id>
    SNAP_SHOT_ID=<snapshot-id>
    API_URL_SNAP_HODL=<api-url>
    DISCORD_REDIRECT_URL=<discord-redirect-url>
    PORT=<port-to-listen-on>
    DISCORD_SERVER_GUILD_ID=<discord-guild-id>
    DISCORD_SERVER_GUILD_CHANNEL_ID=<discord-channel-id>
    DISCORD_SERVER_GUILD_BOT_CHANNEL_ID=<discord-bot-channel-id>

4.  Start the bot using `node src/Bot.js`.

Usage
-----

The bot operates within a specified Discord server and channel. Users interact with the bot using a button, which initiates the verification process.

When the user clicks the button, the bot replies with an ephemeral message containing a verification URL. The user follows this URL to complete the verification process, and upon successful verification, the bot assigns the user's roles based on their holdings.

Contributing
------------

Please feel free to submit issues and pull requests.

License
-------

This project is licensed under [MIT License](/LICENSE).