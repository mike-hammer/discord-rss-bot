const Discord = require('discord.js');
const Parser  = require('rss-parser');
const fs      = require('fs').promises;

const client = new Discord.Client();
const rss    = new Parser();
const config = require('./config.json');

client.on('ready', () => {
    console.log('Client ready!');
    client.user.setActivity(config.botActivity);
    checkRssFeeds();
    setInterval(checkRssFeeds, config.checkInterval * 60 * 1000);
});

client.login(config.token);


async function checkRssFeeds(){
    const lastCheck = await getLastCheckTimestamp();

    for (const channel in config.channels){
        await parseChannel(channel, lastCheck);
    }

    await setLastCheckTimestamp();
}

async function parseChannel(channel, lastCheck){
    const { feed, channelId, type } = config.channels[channel];
    const discordChannel    = client.channels.cache.get(channelId);
    const rssFeed           = await rss.parseURL(feed);

    rssFeed.items.reverse().forEach(item => {
        const { title, link, isoDate} = item;
        if(lastCheck > getRecordPubTimestamp( isoDate )) return;

        sendEmbed(discordChannel, title, link, type);
    });
}

function sendEmbed(channel, title, description, footer){
    const embed = new Discord.MessageEmbed()
        .setTitle(title)
        .setColor(0x7d7d7d)
        .setDescription(description)
        .setFooter(footer);
    channel.send(embed);
}

async function getLastCheckTimestamp(){
    try {
        return await fs.readFile( __dirname + '/.lastcheck', 'utf8');
    } catch(e) {
        return Date.now();
    }
}

async function setLastCheckTimestamp(){
    try {
        return await fs.writeFile( __dirname + '/.lastcheck', Date.now().toString());
    } catch(e) {
        console.log(e);
    }
}

// Convert date 2020-05-23T10:00:16.000Z to timestamp in milliseconds
function getRecordPubTimestamp(isoDate){
    return Date.parse( isoDate );
}