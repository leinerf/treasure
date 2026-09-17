import { EmailVerificationCode } from "../entity/emailVerificationCode.js";
import { Repository } from "typeorm";
import dataSource from "../dataSource.js"

const emailVerificationRepository: Repository<EmailVerificationCode> = dataSource.getRepository(EmailVerificationCode);
export default emailVerificationRepository;