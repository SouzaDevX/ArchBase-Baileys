const { PREFIX, TEMP_DIR } = require("../../config");
const { InvalidParameterError } = require("../../errors/InvalidParameterError");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");

module.exports = {
  name: "sticker",
  description: "Faço figurinhas de imagem/gif/vídeo",
  commands: ["s", "sticker", "fig", "f"],
  usage: `${PREFIX}sticker (marque a imagem/gif/vídeo) ou ${PREFIX}sticker (responda a imagem/gif/vídeo)`,
  handle: async ({
    isImage,
    isVideo,
    downloadImage,
    downloadVideo,
    webMessage,
    sendErrorReply,
    sendSuccessReact,
    sendStickerFromFile,
  }) => {
    if (!isImage && !isVideo) {
      throw new InvalidParameterError(
        "Você precisa marcar uma imagem/gif/vídeo ou responder a uma imagem/gif/vídeo"
      );
    }

    const outputPath = path.resolve(TEMP_DIR, "output.webp");

    if (isImage) {
      const inputPath = await downloadImage(webMessage, "input");

      exec(
        `ffmpeg -i ${inputPath} -vf scale=512:512 ${outputPath}`,
        async (error) => {
          if (error) {
            console.log(error);
            fs.unlinkSync(inputPath);
            throw new Error(error);
          }

          await sendSuccessReact();

          await sendStickerFromFile(outputPath);

          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);
        }
      );
    } else {
      const inputPath = await downloadVideo(webMessage, "input");

      const sizeInSeconds = 10;

      const seconds =
        webMessage.message?.videoMessage?.seconds ||
        webMessage.message?.extendedTextMessage?.contextInfo?.quotedMessage
          ?.videoMessage?.seconds;

      const haveSecondsRule = seconds <= sizeInSeconds;

      if (!haveSecondsRule) {
        fs.unlinkSync(inputPath);

        await sendErrorReply(`O vídeo que você enviou tem mais de ${sizeInSeconds} segundos!

Envie um vídeo menor!`);

        return;
      }

      exec(
        `ffmpeg -i ${inputPath} -vcodec libwebp -filter:v fps=fps=30 -crf 30 -loop 0 -preset default -an -vsync 0 -s 150:150 -fs 80M ${outputPath}`,
        async (error) => {
          if (error) {
            console.log(error);
            fs.unlinkSync(inputPath);

            throw new Error(error);
          }

          await sendSuccessReact();
          await sendStickerFromFile(outputPath);

          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);
        }
      );
    }
  },
};
