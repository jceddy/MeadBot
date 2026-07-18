const { PermissionFlagsBits } = require('discord.js');
const CalculatorAPI = require('../calculator/CalculatorAPI.js');
const { countRecentMessages } = require('../jobs/eligibility.js');

const MESSAGE_THRESHOLD = 10;

function describeEligibility({ displayName, joinedAt, admin, professional, messageCount, isSelf }) {
  const months = CalculatorAPI.GetMonthsBetween(joinedAt, new Date(), false);
  const subject = isSelf ? 'you' : 'They';
  const verb = isSelf ? 'are' : 'is';
  const roleString = admin
    ? ` ${verb} an **Administrator** and`
    : professional
      ? ` ${verb} a **Professional** and`
      : '';
  const eligible = months > 0 && messageCount >= MESSAGE_THRESHOLD && !admin && !professional ? '' : 'not ';
  const displayCount = messageCount >= MESSAGE_THRESHOLD ? '>= ' + MESSAGE_THRESHOLD : messageCount;

  if (isSelf) {
    return (
      `**${displayName}**, ${subject}${roleString} have been a member for **${months}** month(s) and have posted ` +
      `**${displayCount}** messages in the last month.\nYou are **${eligible}eligible** for contests.`
    );
  }
  return (
    `**${displayName}**${roleString} has been a member for **${months}** month(s) and has posted ` +
    `**${displayCount}** messages in the last month.\n${subject} are **${eligible}eligible** for contests.`
  );
}

module.exports = {
  name: 'eligibility',
  description: "Checks a member's eligibility for contests based on tenure and activity.",
  async execute(message, args) {
    if (message.guild == null) {
      return;
    }

    if (args.length === 0) {
      const member = message.member;
      const messageCount = await countRecentMessages(message.guild, member, MESSAGE_THRESHOLD);
      message.channel.send(
        describeEligibility({
          displayName: member.displayName,
          joinedAt: member.joinedAt,
          admin: member.permissions.has(PermissionFlagsBits.Administrator),
          professional: member.roles.cache.some((role) => role.name === 'Professional'),
          messageCount,
          isSelf: true,
        })
      );
      return;
    }

    const members = await message.guild.members.fetch({ query: args[0], limit: 1 });
    const member = members.first();
    if (!member) {
      message.channel.send('Member ' + args[0] + ' not found.');
      return;
    }

    const messageCount = await countRecentMessages(message.guild, member, MESSAGE_THRESHOLD);
    message.channel.send(
      describeEligibility({
        displayName: member.displayName,
        joinedAt: member.joinedAt,
        admin: member.permissions.has(PermissionFlagsBits.Administrator),
        professional: member.roles.cache.some((role) => role.name === 'Professional'),
        messageCount,
        isSelf: false,
      })
    );
  },
};
