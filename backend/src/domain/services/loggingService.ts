import logger from "../../infra/logger/index.js";

class LoggingService {
    static error(err: Error | string | unknown) {
        if (err instanceof Error) {
            logger.error(err.message);
        } else {
            logger.error(String(err));
        }
    }
    static info(message: string) {
        logger.info(message);
    }
    static debug(message: string) {
        logger.debug(message);
    }
}

export default LoggingService;