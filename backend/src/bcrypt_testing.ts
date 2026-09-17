import bcrypt from "bcrypt"

const saltRounds = 10
const plaintextPassword = "mySecretPassword342wr!"
const salt = bcrypt.genSaltSync(saltRounds)
const hashedPassword = bcrypt.hashSync(plaintextPassword, salt)
console.log("Hashed Password: ", hashedPassword)
console.log("Password Match: ", bcrypt.compareSync(plaintextPassword, hashedPassword))