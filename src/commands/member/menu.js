const { PREFIX } = require("../../config");
const { menuMessage } = require("../../utils/messages");
const { proto } = require('@whiskeysockets/baileys')


/**
 * @type {import('../utils/types').Command}
 */
module.exports = {
  name: "menu",
  description: "Menu de comandos",
  commands: ["menu", "help"],
  usage: `${PREFIX}menu`,
  /**
   * @param {{socket: import('@whiskeysockets/baileys').WASocket, sendReply: import('@whiskeysockets/baileys').WASocket['sendMessage'], from: string}} param0
   */
  handle: async ({ socket, sendReply, remoteJid: from }) => {
    console.log(from)
    socket.relayMessage(
      from,
      {
        interactiveMessage: {
          body: {
            text: menuMessage(),
          },
          nativeFlowMessage: {
            buttons: [
              {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({ display_text: "Menu", id: "/menu", disabled: false }),
              },
            ],
          },
        },
      }, {}
    );
  },
};


