export interface AduanaSubscriberData {
  // User Data
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  dni: string;
  password?: string;

  // Plan Data (obligatorio: sólo planes con módulo Aduana incluido)
  plan_id: number;

  // Company Data
  social_reason: string;
  rut: string;
  aduana_anexo51_agent_id: number;
  agent_name?: string;
  agent_code?: string;
  address?: string;
  phone?: string;
}

export interface AduanaSubscriberResponse {
  user_id: number;
  suscriptor_id: number;
  company_id: number;
  message?: string;
}

export interface AduanaAgent {
  id: number;
  code: string;
  name: string;
}
