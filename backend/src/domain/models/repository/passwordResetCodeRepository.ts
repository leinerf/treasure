import { PasswordResetCode } from "../entity/passwordResetCode.js";
import dataSource from "../../../infra/dataSource.js";

const passwordResetCodeRepository = dataSource.getRepository(PasswordResetCode);

export default passwordResetCodeRepository;