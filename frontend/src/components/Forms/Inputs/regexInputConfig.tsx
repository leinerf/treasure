export const regexInputConfig = {
    email: {
        regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        errorMessage: "Invalid email"
    },
    username: {
        regex: /^[a-zA-Z][a-zA-Z0-9_]{2,20}$/,
        errorMessage: [
            "Must start with a letter",
            "Can contain letters, numbers, and underscores",
            "Length between 3 and 21 characters"
        ]
    },
    password: {
        // 8 to 72 printable ASCII characters, no spaces: [!-~] is every character from ! to ~, which is
        // letters, digits and the 32 symbols. Each is one byte, so 72 characters is exactly the most
        // bcrypt uses; anything longer would be silently ignored. The symbol class is all 32 symbols.
        regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!-/:-@[-`{-~])[!-~]{8,72}$/,
        errorMessage: [
                    "At least one lowercase letter",
                    "At least one uppercase letter",
                    "At least one number",
                    "At least one symbol, such as ! @ # $ % ^ & * - _ .",
                    "No spaces",
                    "Between 8 and 72 characters"
                ]
    },
    verificationCode: {
        regex: /^\d{6}$/,
        errorMessage: "Required 6-digit verification code"
    }
};