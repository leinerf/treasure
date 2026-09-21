import { EmailVerificationCode } from "../entity/emailVerificationCode.js";
import { Repository } from "typeorm";
import dataSource from "../../infra/dataSource.js"

const emailVerificationRepository: Repository<EmailVerificationCode> = dataSource.getRepository(EmailVerificationCode);
export default emailVerificationRepository;