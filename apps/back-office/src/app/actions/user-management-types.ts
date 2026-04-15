export interface CreateUserData {
  email: string;
  password: string;
  role: 'owner' | 'admin' | 'catalog_manager' | 'sales' | 'partner_manager';
  firstName: string;
  lastName: string;
  phone: string;
  jobTitle: string;
}

export interface ActionResult {
  success: boolean;
  error?: string;
  data?: {
    user_id?: string;
    email?: string;
    role?: string;
  };
}

export interface UpdateUserProfileData {
  first_name?: string;
  last_name?: string;
  job_title?: string;
  role?: string;
}
