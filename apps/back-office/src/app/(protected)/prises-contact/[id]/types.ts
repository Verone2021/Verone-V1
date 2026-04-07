export type FormSubmission = {
  id: string;
  form_type: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  role: string | null;
  subject: string | null;
  message: string;
  source: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  sla_deadline: string | null;
  metadata: Record<string, unknown>;
  internal_notes: string | null;
};

export type FormType = {
  code: string;
  label: string;
  description: string | null;
  icon: string | null;
  sla_hours: number | null;
};
