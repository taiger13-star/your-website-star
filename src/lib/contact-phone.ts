import { parsePhoneNumberFromString } from "libphonenumber-js/max";

export const CONTACT_PHONE_ERROR =
  "Укажите корректный номер телефона. Для зарубежного номера добавьте + и код страны.";

export function normalizeContactPhone(value: string): string | null {
  const phone = parsePhoneNumberFromString(value.trim(), {
    defaultCountry: "RU",
    extract: false,
  });

  return phone?.isValid() && !phone.ext ? phone.number : null;
}
