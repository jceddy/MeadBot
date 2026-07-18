const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const CalculatorAPI = require('../calculator/CalculatorAPI.js');
const config = require('../config.js');
const mediaPath = require('../utils/mediaPath.js');

// tracks the last time the "You're not my real father!" joke fired, reset on bot start
let fatherDate = new Date();
function resetFatherDate() {
  fatherDate = new Date();
}

const RANDOM_RESPONSES = [
  (message) => `Watchoo talkin' 'bout, ${message.author.toString()}?`,
  () => "Them's fightin' words!",
  () => 'Nuh-uh!',
  () => 'SMH',
  () => '🤦',
  () => '🤦‍♂️',
  () => '🤦‍♀️',
  () => 'That is some StatBot crap right there.',
  () => ({ embeds: [new EmbedBuilder().setImage('https://media0.giphy.com/media/l1J9u3TZfpmeDLkD6/giphy.gif')] }),
  () => 'That really chaps my hide.',
];

function isMeadHall(message) {
  return message.guild != null && message.guild.id === config.guilds.theMeadHall;
}

// Reacts/replies to keyword-triggered "vibe" messages. Mirrors the original bot's
// exclusive if/else-if chain: only the first matching rule fires per message.
// Only called for non-command messages.
async function handlePassiveReactions(message) {
  const messageLower = message.content.toLowerCase().replace(/ {2,}/g, ' ');

  if (messageLower.includes('chili') && isMeadHall(message)) {
    await message.react(messageLower.includes('bean') ? config.emoji.chiliBean : config.emoji.chiliNoBean);
  } else if ((messageLower.includes(' raisin ') || messageLower.includes(' raisins ')) && isMeadHall(message)) {
    if (CalculatorAPI.RandomInteger(300) === 1) {
      const embed = new EmbedBuilder().setImage(config.links.paddlinImage);
      await message.channel.send({ embeds: [embed] });
    } else {
      await message.react(config.emoji.raisin);
    }
  } else if (
    isMeadHall(message) &&
    (messageLower.includes(' thc ') ||
      messageLower.includes('psychadelic') ||
      messageLower.includes('mad honey') ||
      messageLower.includes('meat honey') ||
      (messageLower.includes(' weed ') && messageLower.includes('mead')))
  ) {
    await message.react('🤦');
    await message.react('🤦‍♂️');
    await message.react('🤦‍♀️');
  } else if (messageLower.includes('this is the way') || messageLower.includes('show you the way')) {
    const attachment = new AttachmentBuilder(mediaPath('mando.gif'), { name: 'mando.gif' });
    const embed = new EmbedBuilder().setImage('attachment://mando.gif');
    await message.channel.send({ embeds: [embed], files: [attachment] });
  } else if (isMeadHall(message) && (messageLower.includes('texas') || messageLower.includes(' tx '))) {
    await message.react(config.emoji.texas);
  } else if (
    isMeadHall(message) &&
    (messageLower.includes('minnesota') || messageLower.includes('minnesnowta') || messageLower.includes(' mn '))
  ) {
    await message.react(config.emoji.minnesota);
  } else if (isMeadHall(message) && messageLower.includes('ireland')) {
    await message.react('🇮🇪');
  } else if (isMeadHall(message) && (messageLower.includes('chicago') || messageLower.includes('chi-town'))) {
    await message.react(config.emoji.chicago);
  } else if (
    isMeadHall(message) &&
    (messageLower.includes('goddamn you') ||
      messageLower.includes('fuck off') ||
      messageLower.includes('i hate you')) &&
    (messageLower.includes(' bot') || messageLower.includes('meadbot'))
  ) {
    await message.react('😢');
    await message.channel.send('No you!');
  } else if (messageLower.includes('love you') && messageLower.includes('meadbot')) {
    await message.channel.send('😍');
  } else if (config.channels.banter.includes(message.channel.id)) {
    if (messageLower.includes('meadbot')) {
      if (CalculatorAPI.GetDaysBetween(fatherDate, new Date()) > 1) {
        resetFatherDate();
        await message.channel.send("You're not my real father!");
      }
    } else if (CalculatorAPI.RandomInteger(300) === 1) {
      const response = RANDOM_RESPONSES[CalculatorAPI.RandomInteger(10)](message);
      await message.channel.send(response);
    }
  } else if (
    messageLower.includes('fuck') &&
    message.channel.id !== config.channels.thunderDome &&
    isMeadHall(message)
  ) {
    if (CalculatorAPI.RandomInteger(300) === 1) {
      await message.channel.send(message.author.toString() + ' has baggy pants!');
    }
  } else if (message.author.id === config.easterEggUsers.yeah) {
    if (CalculatorAPI.RandomInteger(300) === 1) {
      await message.channel.send('yeah.');
    }
  } else if (config.easterEggUsers.reactOnly.includes(message.author.id)) {
    if (CalculatorAPI.RandomInteger(300) === 1) {
      await message.react(config.emoji.easterEggReact);
    }
  } else if (messageLower.includes(' esters')) {
    const ESTERS_IMAGES = {
      1: 'https://cdn.discordapp.com/attachments/808990352937451540/852913140068253727/image0.jpg',
      2: 'https://cdn.discordapp.com/attachments/808990352937451540/852924218130694224/image0.jpg',
      3: 'https://cdn.discordapp.com/attachments/808990352937451540/852931631575859212/image0.jpg',
      4: 'https://cdn.discordapp.com/attachments/808990352937451540/852949830962905088/esters.png',
      5: 'https://media.discordapp.net/attachments/628682183392886795/865649897112600606/esters-1.PNG',
      6: 'https://media.discordapp.net/attachments/628682183392886795/865649915718664222/esters-2.PNG',
    };
    const imageUrl = ESTERS_IMAGES[CalculatorAPI.RandomInteger(100)];
    if (imageUrl) {
      const embed = new EmbedBuilder().setImage(imageUrl);
      await message.channel.send({ embeds: [embed] });
    }
  }
}

module.exports = { handlePassiveReactions, resetFatherDate };
