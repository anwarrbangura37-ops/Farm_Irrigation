type UserEmailAddress = {
  emailAddress: string;
  verification?: { status?: string | null } | null;
};

const ADMIN_EMAILS = new Set([
  'koromajoel933@gmail.com',
  'ishmealfofanah2005@gmail.com',
]);

export function hasFarmAdminAccess(
  emailAddresses: readonly UserEmailAddress[] | null | undefined,
): boolean {
  return emailAddresses?.some((address) => (
    address.verification?.status === 'verified' &&
    ADMIN_EMAILS.has(address.emailAddress.trim().toLowerCase())
  )) ?? false;
}
