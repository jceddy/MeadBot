const describeFetchError = require('../utils/describeFetchError.js');

const API_ROOT = process.env.MEADBOT_API_ROOT;
const API_KEY = process.env.CHAT_API_KEY;
const TOPUP_URL = process.env.BMAC_TOPUP_URL;

function formatUsd(amount) {
  const value = Number(amount);
  return value < 0 ? `-$${(-value).toFixed(2)}` : `$${value.toFixed(2)}`;
}

module.exports = {
  name: 'chatbudget',
  description: "Reports !chat's remaining Fireworks AI usage budget.",
  async execute(message) {
    if (!API_ROOT || !API_KEY) {
      await message.channel.send('Chat is not configured on this bot.');
      return;
    }

    await message.channel.sendTyping();

    let payload;
    try {
      const response = await fetch(`${API_ROOT}/api/v1/balance`, {
        headers: { 'X-Api-Key': API_KEY },
        signal: AbortSignal.timeout(15000),
      });
      payload = await response.json();
    } catch (error) {
      await message.channel.send('Failed to reach the chat API: ' + describeFetchError(error));
      return;
    }

    if (payload.error) {
      await message.channel.send('Chat budget error: ' + payload.errorMessage);
      return;
    }

    const { totalDepositsUsd, totalUsageUsd, balanceUsd } = payload.balance;
    let text = `Chat AI budget: ${formatUsd(balanceUsd)} remaining (${formatUsd(totalDepositsUsd)} deposited, ${formatUsd(totalUsageUsd)} used so far).`;
    if (balanceUsd <= 0 && TOPUP_URL) {
      text += `\nHelp keep !chat running: ${TOPUP_URL}`;
    }
    await message.channel.send(text);
  },
};
