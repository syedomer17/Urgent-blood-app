/**
 * Authentication Utilities
 * Helper functions for auth-related operations
 */

export interface AuthError {
  message: string;
  statusCode?: number;
  field?: string;
}

/**
 * Parse API error response
 */
export const parseAuthError = (error: any): string => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Check if user has required role
 */
export const hasRole = (userRole: string, requiredRoles: string[]): boolean => {
  return requiredRoles.includes(userRole);
};

/**
 * Check if user is admin
 */
export const isAdmin = (userRole?: string): boolean => {
  return userRole === 'admin';
};

/**
 * Check if user is donor
 */
export const isDonor = (userRole?: string): boolean => {
  return userRole === 'donor';
};

/**
 * Check if user is requester
 */
export const isRequester = (userRole?: string): boolean => {
  return userRole === 'requester';
};

/**
 * Format blood group for display
 */
export const formatBloodGroup = (bloodGroup: string): string => {
  return bloodGroup?.toUpperCase() || 'Unknown';
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * Minimum 8 characters
 */
export const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

/**
 * Get user display name
 */
export const getUserDisplayName = (user: { name?: string; email?: string }): string => {
  return user.name || user.email || 'User';
};

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
} as const;

/**
 * Get stored user
 */
export const getStoredUser = () => {
  try {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error parsing stored user:', error);
    return null;
  }
};

/**
 * Clear all auth-related storage
 */
export const clearAuthStorage = () => {
  localStorage.removeItem(STORAGE_KEYS.USER);
};

/**
 * Role display names
 */
export const ROLE_LABELS: Record<string, string> = {
  donor: 'Blood Donor',
  requester: 'Blood Requester',
  admin: 'Administrator',
};

/**
 * Get role display name
 */
export const getRoleLabel = (role: string): string => {
  return ROLE_LABELS[role] || role;
};

/**
 * Blood groups
 */
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

/**
 * Check if blood groups are compatible (donor -> recipient)
 */
export const areBloodGroupsCompatible = (donorGroup: string, recipientGroup: string): boolean => {
  const compatibility: Record<string, string[]> = {
    'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], // Universal donor
    'O+': ['O+', 'A+', 'B+', 'AB+'],
    'A-': ['A-', 'A+', 'AB-', 'AB+'],
    'A+': ['A+', 'AB+'],
    'B-': ['B-', 'B+', 'AB-', 'AB+'],
    'B+': ['B+', 'AB+'],
    'AB-': ['AB-', 'AB+'],
    'AB+': ['AB+'], // Universal recipient
  };

  return compatibility[donorGroup]?.includes(recipientGroup) || false;
};
