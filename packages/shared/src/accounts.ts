export const AccountTypes = {
  USER_WALLET: "USER_WALLET",
  PLATFORM_CLEARING: "PLATFORM_CLEARING",
  PLATFORM_REVENUE: "PLATFORM_REVENUE",
  PROVIDER_EXPENSE: "PROVIDER_EXPENSE",
  DEVELOPER_PAYABLE: "DEVELOPER_PAYABLE"
} as const;

export type AccountType = keyof typeof AccountTypes;

export function formatAccountIdentifier(type: AccountType, id?: string): string {
  return id ? `${type}:${id}` : type;
}
