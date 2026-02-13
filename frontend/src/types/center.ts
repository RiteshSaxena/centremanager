export interface Center {
  id: number;
  name: string;
  displayName?: string | null;
  region?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  isFeedbackNotification?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCenterPayload {
  name?: string;
  displayName?: string;
  region?: string;
  email?: string | null;
  phoneNumber?: string | null;
  isFeedbackNotification?: boolean;
}
