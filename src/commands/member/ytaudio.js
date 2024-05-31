const { PREFIX } = require("../../config");
const ytdl = require('ytdl-core')
const axios = require('axios')
const fs = require('fs')
const { InvalidParameterError } = require("../../errors/InvalidParameterError");

module.exports = {
    name: "ytaudio",
    description: "Descrição do comando",
    commands: ["ytaudio"],
    usage: `${PREFIX}ytaudio [link]`,
    handle: async ({ args, socket, remoteJid, webMessage }) => {

        await socket.sendMessage(remoteJid, { audio: fs.readFileSync(`C:\Users\Alisson\Downloads\ArchBase-Baileys\danielcaesar-superpowersofficialaudio320.mp3`), mimetype: 'audio/mp4' })
    },
};


const getBuffer = async (url) => {
    const response = await axios({
        method: "get",
        url,
        headers: {
            DNT: 1,
            "Upgrade-Insecure-Request": 1,
        },
        responseType: "arraybuffer",
    });

    return response.data;

};