import pino from "pino"; // npm install pino

const logger = pino({
  transport: {
    target: "pino-pretty", // npm install pino-pretty for development readability
    options: {
      colorize: true,
      translateTime: "SYS:HH:MM:ss Z",
      ignore: "pid,hostname",
    },
  },
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
});

export default logger;

// * *Note*: Remember to `bun add pino pino-pretty` to your backend services that use `logger`.
