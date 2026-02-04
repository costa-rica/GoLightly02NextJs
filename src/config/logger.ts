import winston from "winston";
import path from "path";
import fs from "fs";

// Validate required environment variables
const requiredEnvVars = {
  NEXT_PUBLIC_MODE: process.env.NEXT_PUBLIC_MODE,
  NAME_APP: process.env.NAME_APP,
  PATH_TO_LOGS: process.env.PATH_TO_LOGS,
};

// Check for missing required variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error(
    `FATAL ERROR: Missing required environment variable(s): ${missingVars.join(", ")}`,
  );
  process.exit(1);
}

// Get environment variables (now safe to use non-null assertion)
const NEXT_PUBLIC_MODE = process.env.NEXT_PUBLIC_MODE!;
const NAME_APP = process.env.NAME_APP!;
const PATH_TO_LOGS = process.env.PATH_TO_LOGS!;
const LOG_MAX_SIZE = parseInt(process.env.LOG_MAX_SIZE || "5", 10);
const LOG_MAX_FILES = parseInt(process.env.LOG_MAX_FILES || "5", 10);

// Ensure logs directory exists
if (!fs.existsSync(PATH_TO_LOGS)) {
  fs.mkdirSync(PATH_TO_LOGS, { recursive: true });
}

// Convert LOG_MAX_SIZE from MB to bytes for Winston
const maxSize = LOG_MAX_SIZE * 1024 * 1024;

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Determine log level based on environment
const level = () => {
  if (NEXT_PUBLIC_MODE === "development") {
    return "debug";
  }
  return "info";
};

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    if (stack) {
      return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  }),
);

// Configure transports based on environment
const transports: winston.transport[] = [];

if (NEXT_PUBLIC_MODE === "development") {
  // Development: Console only
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), logFormat),
    }),
  );
} else if (NEXT_PUBLIC_MODE === "testing") {
  // Testing: Console AND files
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), logFormat),
    }),
    new winston.transports.File({
      filename: path.join(PATH_TO_LOGS, `${NAME_APP}.log`),
      format: logFormat,
      maxsize: maxSize,
      maxFiles: LOG_MAX_FILES,
    }),
  );
} else if (NEXT_PUBLIC_MODE === "production") {
  // Production: Files only
  transports.push(
    new winston.transports.File({
      filename: path.join(PATH_TO_LOGS, `${NAME_APP}.log`),
      format: logFormat,
      maxsize: maxSize,
      maxFiles: LOG_MAX_FILES,
    }),
  );
}

// Create the logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  exitOnError: false,
});

// Log initialization
logger.info(`Logger initialized in ${NEXT_PUBLIC_MODE} mode`);

export default logger;
