export interface MailableUser {
  id: string;
  full_name: string;
  personal_email: string;
  email: string | null;
  is_temp_email_active: boolean;
}