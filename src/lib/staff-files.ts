/** URL of a staff image; the timestamp busts the browser cache after a new upload. */
export function staffFileUrl(caregiverId: string, kind: "photo" | "aadhaar", uploadedAt: Date) {
  return `/admin/files/staff/${caregiverId}/${kind}?v=${uploadedAt.getTime()}`;
}
