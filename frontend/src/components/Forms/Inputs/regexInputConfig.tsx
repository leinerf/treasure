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
        regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        errorMessage: [
                    "At least one lowercase letter",
                    "At least one uppercase letter",
                    "At least one number",
                    "At least one special character",
                    "Minimum 8 characters"
                ]
    },
    verificationCode: {
        regex: /^\d{6}$/,
        errorMessage: "Required 6-digit verification code"
    }
};