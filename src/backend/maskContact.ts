export function maskContact(value: string) {
  return value
    .replace(/[\w.!#$%&'*+/=?^`{|}~-]+@[\w.-]+\.[a-z]{2,}/gi, '••••@••••')
    .replace(/\+?\d(?:[\d .()-]*\d){7,14}/g, '••••••••')
}
