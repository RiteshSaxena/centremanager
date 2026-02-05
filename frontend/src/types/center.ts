export interface Center {
  id: number;
  name: string;
  displayName?: string;
  address?: string;
  phone?: string;
  email?: string;
  booksEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCenterPayload {
  name?: string;
  displayName?: string;
  address?: string;
  phone?: string;
  email?: string;
  booksEnabled?: boolean;
}
