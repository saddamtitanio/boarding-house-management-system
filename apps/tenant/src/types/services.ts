// Services
export interface Service {
  id: string;        // uuid
  name: string;      // text
  description: string; // text
  price: number;     // numeric
  duration_h: number; // int4
}

export type ServiceRequestStatus = "pending" | "in_progress" | "completed";

// Service Requests 
export interface ServiceRequest {
  id: string;           // uuid
  tenant_id: string;    // uuid → profiles.id
  service_id: string;   // uuid → services.id
  status: ServiceRequestStatus;
  requested_at: string; // timestamptz
  assigned_to: string | null; // uuid → profiles.id
  updated_at: string;   // timestamptz
  note?: string;        // for "other" category free text
}

//Request types 
export interface CreateServiceRequestRequest {
  service_id: string;
  note?: string; // required when service is "other"
}

// Response types 
export interface ServicesResponse {
  services: Service[];
}

export interface ServiceRequestsResponse {
  requests: ServiceRequest[];
  total: number;
  page: number;
  limit: number;
}
