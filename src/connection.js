const path = require("path");
const { question, onlyNumbers, log } = require("./utils");
const color = require("cli-color")
const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");

const pino = require("pino");

exports.connect = async () => {
  const { state, saveCreds } = await useMultiFileAuthState(
    path.resolve(__dirname, "..", "assets", "auth", "baileys")
  );

  const { version } = await fetchLatestBaileysVersion();

  const socket = makeWASocket({
    printQRInTerminal: false,
    version,
    logger: pino({ level: "error" }),
    auth: state,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    markOnlineOnConnect: true,
  });

  if (!socket.authState.creds.registered) {
    const phoneNumber = await question(color.yellow("- Informe o seu número de telefone:  "));

    if (!phoneNumber) {
      throw new Error("Número de telefone inválido!");
    }

    const code = await socket.requestPairingCode(onlyNumbers(phoneNumber));

    console.log(`Seu código de conexão é: \n\n ${color.bold(code)}\n~>`);
    console.log(`Abra seu WhatsApp, vá em ${color.bold("Aparelhos Conectados > Conectar um novo Aparelho > Conectar usando Número.")}`)
  }

  socket.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;


      log("Conexão encerrada: " + lastDisconnect.error.output.payload.message, "error", "red");


      if (shouldReconnect) {
        this.connect();
      }
    }

    if (connection === "connecting") {
      log("Conectando...", "status", "yellow");
    }

    if (connection === "open") {
      log("Conectado com sucesso!", "status", "green");
    }
  });

  socket.ev.on("creds.update", saveCreds);

  return socket;
};
