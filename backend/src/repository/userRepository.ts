import dataSource from "../dataSource.js";
import { User } from "../entity/user.js";

const userRepository = dataSource.getRepository(User);
export default userRepository;