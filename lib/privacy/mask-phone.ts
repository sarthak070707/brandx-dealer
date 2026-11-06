// "+919876543210" becomes "+91 ••••• ••210": enough for the owner to recognise, no more.
export function maskPhone(phone: string) {
  const match = /^\+91(\d{7})(\d{3})$/.exec(phone);
  return match ? `+91 ••••• ••${match[2]}` : "this number";
}
