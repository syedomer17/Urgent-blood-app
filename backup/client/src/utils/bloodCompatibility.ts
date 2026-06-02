/**
 * Maps a donor's blood group → which recipient groups they CAN donate to.
 */
export const BLOOD_COMPATIBILITY: Record<string, string[]> = {
  "A+": ["A+", "AB+"],
  "A-": ["A+", "A-", "AB+", "AB-"],
  "B+": ["B+", "AB+"],
  "B-": ["B+", "B-", "AB+", "AB-"],
  "AB+": ["AB+"],
  "AB-": ["AB+", "AB-"],
  "O+": ["A+", "B+", "AB+", "O+"],
  "O-": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
};

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

/**
 * Check if a donor with `donorGroup` can donate to a recipient needing `recipientGroup`.
 */
export const canDonateTo = (donorGroup: string, recipientGroup: string): boolean => {
  return BLOOD_COMPATIBILITY[donorGroup]?.includes(recipientGroup) ?? false;
};
