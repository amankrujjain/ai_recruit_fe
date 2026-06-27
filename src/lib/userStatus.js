export const UserStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  DISABLED: 'DISABLED',
};

export const userStatusLabel = {
  [UserStatus.PENDING]: 'Pending',
  [UserStatus.ACTIVE]: 'Active',
  [UserStatus.DISABLED]: 'Disabled',
};

export const userStatusVariant = {
  [UserStatus.PENDING]: 'warning',
  [UserStatus.ACTIVE]: 'success',
  [UserStatus.DISABLED]: 'muted',
};
