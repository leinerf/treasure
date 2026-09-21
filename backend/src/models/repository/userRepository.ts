import dataSource from "../../infra/dataSource.js";
import { User } from "../entity/user.js";

const userRepository = dataSource.getRepository(User);
export default userRepository;