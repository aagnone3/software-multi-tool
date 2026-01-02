import type { sendEmail } from "@repo/mail";
import type {
	CancelSubscription,
	CreateCheckoutLink,
	CreateCustomerPortalLink,
	SetSubscriptionSeats,
	WebhookHandler,
} from "@repo/payments/types";
import { vi } from "vitest";

type PaymentsModule = typeof import("@repo/payments");
type SetCustomerIdToEntity = PaymentsModule["setCustomerIdToEntity"];
type GetCustomerIdFromEntity = PaymentsModule["getCustomerIdFromEntity"];

type MailFixture = {
	sendEmail: ReturnType<
		typeof vi.fn<Parameters<typeof sendEmail>, Promise<boolean>>
	>;
	reset: () => void;
};

type PaymentsFixture = {
	createCheckoutLink: ReturnType<
		typeof vi.fn<Parameters<CreateCheckoutLink>, Promise<string | null>>
	>;
	createCustomerPortalLink: ReturnType<
		typeof vi.fn<
			Parameters<CreateCustomerPortalLink>,
			Promise<string | null>
		>
	>;
	setSubscriptionSeats: ReturnType<
		typeof vi.fn<Parameters<SetSubscriptionSeats>, Promise<void>>
	>;
	cancelSubscription: ReturnType<
		typeof vi.fn<Parameters<CancelSubscription>, Promise<void>>
	>;
	webhookHandler: ReturnType<
		typeof vi.fn<Parameters<WebhookHandler>, Promise<Response>>
	>;
	setCustomerIdToEntity: ReturnType<
		typeof vi.fn<
			Parameters<SetCustomerIdToEntity>,
			ReturnType<SetCustomerIdToEntity>
		>
	>;
	getCustomerIdFromEntity: ReturnType<
		typeof vi.fn<
			Parameters<GetCustomerIdFromEntity>,
			Promise<string | null>
		>
	>;
	reset: () => void;
};

function createMailFixture(): MailFixture {
	const sendEmailMock = vi.fn<Parameters<typeof sendEmail>, Promise<boolean>>(
		async () => true,
	);

	return {
		sendEmail: sendEmailMock,
		reset: () => {
			sendEmailMock.mockReset();
			sendEmailMock.mockResolvedValue(true);
		},
	};
}

function createPaymentsFixture(): PaymentsFixture {
	const createCheckoutLinkMock = vi.fn<
		Parameters<CreateCheckoutLink>,
		Promise<string | null>
	>(async () => "https://payments.test/checkout");
	const createCustomerPortalLinkMock = vi.fn<
		Parameters<CreateCustomerPortalLink>,
		Promise<string | null>
	>(async () => "https://payments.test/portal");
	const setSubscriptionSeatsMock = vi.fn<
		Parameters<SetSubscriptionSeats>,
		Promise<void>
	>(async () => {});
	const cancelSubscriptionMock = vi.fn<
		Parameters<CancelSubscription>,
		Promise<void>
	>(async () => {});
	const webhookHandlerMock = vi.fn<
		Parameters<WebhookHandler>,
		Promise<Response>
	>(async () => new Response(null, { status: 200 }));
	const setCustomerIdToEntityMock = vi.fn<
		Parameters<SetCustomerIdToEntity>,
		ReturnType<SetCustomerIdToEntity>
	>(async () => undefined);
	const getCustomerIdFromEntityMock = vi.fn<
		Parameters<GetCustomerIdFromEntity>,
		Promise<string | null>
	>(async () => null);

	return {
		createCheckoutLink: createCheckoutLinkMock,
		createCustomerPortalLink: createCustomerPortalLinkMock,
		setSubscriptionSeats: setSubscriptionSeatsMock,
		cancelSubscription: cancelSubscriptionMock,
		webhookHandler: webhookHandlerMock,
		setCustomerIdToEntity: setCustomerIdToEntityMock,
		getCustomerIdFromEntity: getCustomerIdFromEntityMock,
		reset: () => {
			createCheckoutLinkMock.mockReset();
			createCustomerPortalLinkMock.mockReset();
			setSubscriptionSeatsMock.mockReset();
			cancelSubscriptionMock.mockReset();
			webhookHandlerMock.mockReset();
			setCustomerIdToEntityMock.mockReset();
			getCustomerIdFromEntityMock.mockReset();

			createCheckoutLinkMock.mockResolvedValue(
				"https://payments.test/checkout",
			);
			createCustomerPortalLinkMock.mockResolvedValue(
				"https://payments.test/portal",
			);
			setSubscriptionSeatsMock.mockResolvedValue(undefined);
			cancelSubscriptionMock.mockResolvedValue(undefined);
			webhookHandlerMock.mockResolvedValue(
				new Response(null, { status: 200 }),
			);
			setCustomerIdToEntityMock.mockResolvedValue(undefined);
			getCustomerIdFromEntityMock.mockResolvedValue(null);
		},
	};
}

const fixtures = vi.hoisted(() => ({
	mailFixture: createMailFixture(),
	paymentsFixture: createPaymentsFixture(),
}));

const mailFixture = fixtures.mailFixture;
const paymentsFixture = fixtures.paymentsFixture;

function mockMailModule() {
	return {
		sendEmail: mailFixture.sendEmail,
	};
}

function mockPaymentsModule() {
	return {
		createCheckoutLink: paymentsFixture.createCheckoutLink,
		createCustomerPortalLink: paymentsFixture.createCustomerPortalLink,
		setSubscriptionSeats: paymentsFixture.setSubscriptionSeats,
		cancelSubscription: paymentsFixture.cancelSubscription,
		webhookHandler: paymentsFixture.webhookHandler,
		setCustomerIdToEntity: paymentsFixture.setCustomerIdToEntity,
		getCustomerIdFromEntity: paymentsFixture.getCustomerIdFromEntity,
	};
}

function resetExternalServicesMocks() {
	mailFixture.reset();
	paymentsFixture.reset();
}

export {
	mailFixture,
	mockMailModule,
	mockPaymentsModule,
	paymentsFixture,
	resetExternalServicesMocks,
};
