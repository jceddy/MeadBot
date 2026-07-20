const TOPUP_URL = process.env.BMAC_TOPUP_URL;

module.exports = {
  name: 'topup',
  description: "Links to a way to help fund !chat's AI usage budget.",
  execute(message) {
    if (!TOPUP_URL) {
      message.channel.send('Topping up is not configured on this bot.');
      return;
    }
    message.channel.send(`Help keep !chat running by topping up its AI usage budget: ${TOPUP_URL}`);
  },
};
