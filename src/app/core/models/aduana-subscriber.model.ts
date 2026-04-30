export interface AduanaSubscriberData {
  // User Data
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  dni: string;
  password?: string;

  // Company Data
  social_reason: string;
  rut: string;
  agent_name: string;
  agent_code: string;
  address?: string;
  phone?: string;
}

export interface AduanaSubscriberResponse {
  user_id: number;
  suscriptor_id: number;
  company_id: number;
  message?: string;
}
