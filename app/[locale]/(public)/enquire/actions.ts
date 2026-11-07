"use server";

import { createEnquiry } from "@/lib/leads/create-enquiry";
import type { EnquiryInput } from "@/lib/leads/enquiry-schema";

export async function submitEnquiry(input: EnquiryInput) {
  return createEnquiry(input);
}
