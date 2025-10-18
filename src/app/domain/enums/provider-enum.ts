// Use a const value object + derived type to avoid unused-enum-member warnings
export const ProviderEnum = {
    // Use the capitalized provider string expected by the backend
    GOOGLE: 'Google',
} as const;

export type ProviderEnum = (typeof ProviderEnum)[keyof typeof ProviderEnum];
