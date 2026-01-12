const authErrorMessages: Record<string, string> = {
	INVALID_EMAIL_OR_PASSWORD: "Your login credentials are incorrect.",
	USER_NOT_FOUND: "The user was not found.",
	FAILED_TO_CREATE_USER: "Failed to create user.",
	FAILED_TO_CREATE_SESSION: "Failed to create session.",
	FAILED_TO_UPDATE_USER: "Failed to update user.",
	FAILED_TO_GET_SESSION: "Failed to get session.",
	INVALID_PASSWORD: "The password is invalid.",
	INVALID_EMAIL: "The email is invalid.",
	INVALID_TOKEN: "The token is invalid.",
	CREDENTIAL_ACCOUNT_NOT_FOUND: "No credential account was found.",
	EMAIL_CAN_NOT_BE_UPDATED: "The email cannot be updated.",
	EMAIL_NOT_VERIFIED:
		"Your email address has not been verified. Please check your inbox for the verification email.",
	FAILED_TO_GET_USER_INFO: "Failed to get user info.",
	ID_TOKEN_NOT_SUPPORTED: "ID token is not supported.",
	PASSWORD_TOO_LONG: "Password is too long.",
	PASSWORD_TOO_SHORT: "Password is too short.",
	PROVIDER_NOT_FOUND: "Provider not found.",
	SOCIAL_ACCOUNT_ALREADY_LINKED: "Social account is already linked.",
	USER_EMAIL_NOT_FOUND: "User email not found.",
	USER_ALREADY_EXISTS: "User already exists.",
	INVALID_INVITATION: "The invitation is invalid.",
	SESSION_EXPIRED: "Session has expired.",
	FAILED_TO_UNLINK_LAST_ACCOUNT: "Failed to unlink last account.",
	ACCOUNT_NOT_FOUND: "Account not found.",
	INVALID_TWO_FACTOR_CODE: "The code you entered is incorrect.",
};

export function useAuthErrorMessages() {
	const getAuthErrorMessage = (errorCode: string | undefined) => {
		return (
			authErrorMessages[errorCode as keyof typeof authErrorMessages] ||
			"There was an error. Please try again later."
		);
	};

	return {
		getAuthErrorMessage,
	};
}
