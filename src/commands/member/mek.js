const { PREFIX } = require("../../config");

module.exports = {
    name: "mek",
    description: "Comando do Mek",
    commands: ["mek"],
    usage: `${PREFIX}mek`,
    handle: async ({ sendReply, webMessage }) => {
        await sendReply(JSON.stringify(webMessage, null, 2));
    },
};

