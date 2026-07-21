// How far back to walk a reply chain when reconstructing conversation history. Bounds both the
// number of Discord API calls this makes and the token cost/size of whatever uses the result.
const MAX_HISTORY_MESSAGES = 20;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// stripCommandPrefix(content, prefix) - remove a leading "<prefix>chat " / "<prefix>ask " (any
// case) from a message's raw (original-case) content, returning just the user-typed text after
// it. Used both for the invoking message and for reconstructing prior turns from a reply chain.
function stripCommandPrefix(content, prefix) {
  const pattern = new RegExp('^' + escapeRegExp(prefix) + '(chat|ask)\\s*', 'i');
  return content.replace(pattern, '').trim();
}

// looksLikeChatInvocation(content, prefix) - true if content starts with "<prefix>chat"/"<prefix>ask"
// (any case). Used to confirm a reply chain actually originated from a !chat/!ask invocation,
// rather than some other command's reply chain (e.g. !help also replies to its invoker).
function looksLikeChatInvocation(content, prefix) {
  const pattern = new RegExp('^' + escapeRegExp(prefix) + '(chat|ask)\\b', 'i');
  return pattern.test(content);
}

// buildChatHistory(message, client) - walks the Discord reply chain backwards from the message
// this command was invoked as a reply to (if any), reconstructing it as an OpenAI-style
// {role, content} message list, oldest first. Only plain text is preserved -- any tool-call
// plumbing behind an earlier assistant reply isn't recoverable from Discord alone, but the
// visible back-and-forth is enough context without it. Stops at the first message with no
// further reference (the start of the conversation), a referenced message that can't be fetched
// (deleted, etc.), or MAX_HISTORY_MESSAGES hops, whichever comes first.
//
// Also returns `root`, the last message successfully walked to (the earliest reachable point in
// the chain) -- used by callers that need to confirm the chain actually started from a !chat/!ask
// invocation (see looksLikeChatInvocation) rather than just reconstructing the conversation.
async function buildChatHistory(message, client) {
  const history = [];
  let current = message;
  let root = message;

  for (let i = 0; i < MAX_HISTORY_MESSAGES && current.reference; i++) {
    let parent;
    try {
      parent = await current.channel.messages.fetch(current.reference.messageId);
    } catch {
      break;
    }

    if (parent.author.id === client.user.id) {
      history.unshift({ role: 'assistant', content: parent.content });
    } else {
      history.unshift({ role: 'user', content: stripCommandPrefix(parent.content, client.prefix) });
    }

    current = parent;
    root = parent;
  }

  return { history, root };
}

module.exports = { buildChatHistory, stripCommandPrefix, looksLikeChatInvocation, MAX_HISTORY_MESSAGES };
