import type { Certificate } from "./types";

/**
 * ADD A CERTIFICATE: add one object to this list. The room grows a new glass frame for it.
 *
 * image: a Cloudinary public ID or a full URL of a photo or scan of the certificate.
 *        Leave it out and a clean generated certificate card is shown instead.
 * credentialUrl: an optional "verify this certificate" link, shown as a button in the viewer.
 *
 * The three below are PLACEHOLDERS. Replace them with your real certificates.
 */
export const CERTIFICATES: Certificate[] = [
  {
    id: "cert-1",
    title: "Your Certificate Title",
    issuer: "Issuing Organization",
    date: "2026",
    description:
      "Replace this with what the certificate was for and what you learned.",
    // image: "https://res.cloudinary.com/urvcfynq/image/upload/v0000000000/certificate-1.jpg",
    // credentialUrl: "https://example.com/verify/123",
    color: "#e8c477",
  },
  {
    id: "cert-2",
    title: "Another Certificate Or Award",
    issuer: "Another Organization",
    date: "2025",
    description: "Replace this with your own details.",
    color: "#e8c477",
  },
  {
    id: "cert-3",
    title: "A Third Achievement",
    issuer: "Institute Or Platform",
    date: "2025",
    description: "Replace this with your own details.",
    color: "#e8c477",
  },
];
