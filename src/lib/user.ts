export type UserIdentity = {
  name?: string | null;
  email?: string;
  personType?: string | null;
  tradeName?: string | null;
  companyName?: string | null;
};

const firstToken = (value?: string | null) => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const [first] = trimmed.split(/\s+/);
  return first ?? "";
};

export const getDisplayName = (user: UserIdentity | null | undefined, fallback = "Usuario") => {
  if (!user) return fallback;
  const personType = user.personType?.toUpperCase();
  if (personType === "CNPJ") {
    const trade = user.tradeName?.trim();
    if (trade) return trade;
    const company = user.companyName?.trim();
    if (company) return company;
  }
  const name = user.name?.trim();
  if (name) return firstToken(name) || fallback;
  return fallback;
};

export const sanitizeDisplayName = (value?: string | null, fallback = "Usuario") => {
  if (!value) return fallback;
  if (value.includes("@")) return fallback;
  return value.trim() || fallback;
};
