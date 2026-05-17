// --- Customer and Address Creation Types ---
export interface CreateCustomerRequest {
  customer_name: string;
  customer_type: string;
  mobile_no: string;
  territory: string;
}

export interface CreateCustomerResponse {
  data: {
    name: string;
    customer_name: string;
    mobile_no: string;
    territory: string;
    [key: string]: any;
  };
}

export interface CreateAddressRequest {
  address_title: string;
  address_type: string;
  address_line1: string;
  country: string;
  city: string;
  links: Array<{
    link_doctype: string;
    link_name: string;
  }>;
}

export interface CreateAddressResponse {
  data: {
    name: string;
    address_title: string;
    address_type: string;
    address_line1: string;
    city: string;
    country: string;
    links: Array<any>;
    [key: string]: any;
  };
}
// --- OTP Verification Types ---
export interface VerifyOtpRequest {
  mobile: string;
  otp: string;
}

export interface VerifyOtpResponse {
  status: string; // 'success' expected
}
// --- OTP Types ---
export interface SendOtpRequest {
  mobile: string;
}

export interface SendOtpResponse {
  status: string; // 'success' expected
}

export interface Item {
  name: string;
  item_name: string;
  item_code: string;
  item_group: string;
  standard_rate: number;
  image?: string;
  description?: string;
  max_discount : string;
}

export interface OrderCartItem {
  itemCode: string;
  name: string;
  price: number;
  qty: number;
}

export interface CreateSalesOrderItem {
  item_code: string;
  qty: number;
  rate: number;
}

export interface CreateSalesOrderRequest {
  customer: string;
  delivery_date: string;
  items: CreateSalesOrderItem[];
}

export interface CreateCustomerRequest {
  customer_name: string;
  email_id: string; // Required for Login
  mobile_no?: string;
  customer_type: "Individual" | "Company";
  customer_group: "All Customer Groups" | string; // Use your default group
  territory: "All Territories" | string; // Use your default territory
}

export interface UpdateCustomerRequest {
  customerName: string;
  customer_name?: string;
  territory?: string;
}

export interface SetCustomerInfoRequest {
  customerName: string;
  fieldname: "email_id" | "mobile_no";
  value: string;
}

export interface UploadedFile {
  name: string;
  file_name: string;
  file_url: string;
  attached_to_doctype?: string;
  attached_to_name?: string;
  attached_to_field?: string;
  is_private?: number;
}

export interface UploadCustomerAvatarRequest {
  customerName: string;
  file: File;
}

export interface AttachFileRequest {
  filename: string;
  filedata: string;
  doctype: string;
  docname: string;
  folder?: string;
  is_private?: 0 | 1;
  decode_base64?: 0 | 1;
  docfield?: string;
}

export interface Customer {
  name: string;
  customer_name: string;
  customer_type: "Individual" | "Company";
  customer_group: string;
  territory: string;
}

export interface ContactEmail {
  email_id: string;
  is_primary?: 0 | 1;
}

export interface ContactPhone {
  phone: string;
  is_primary_phone?: 0 | 1;
  is_primary_mobile_no?: 0 | 1;
}

export interface ContactLink {
  link_doctype: string;
  link_name: string;
  link_title?: string;
}

export interface Contact {
  name: string;
  first_name: string;
  middle_name?: string;
  last_name?: string;
  email_ids?: ContactEmail[];
  phone_nos?: ContactPhone[];
  links?: ContactLink[];
  is_primary_contact?: 0 | 1;
}

export interface CreateContactRequest {
  first_name: string;
  last_name?: string;
  is_primary_contact?: 0 | 1;
  links: ContactLink[];
  email_ids?: ContactEmail[];
  phone_nos?: ContactPhone[];
}

export interface UpdateContactRequest {
  contactName: string;
  first_name?: string;
  last_name?: string;
  email_ids?: ContactEmail[];
  phone_nos?: ContactPhone[];
  is_primary_contact?: 0 | 1;
}

export interface CustomerDetails extends Customer {
  owner: string;
  creation: string;
  modified: string;
  modified_by: string;
  docstatus: number;
  idx: number;
  naming_series: string;
  customer_primary_contact?: string;
  email_id?: string;
  mobile_no?: string;
  first_name?: string;
  last_name?: string;
  is_internal_customer: number;
  image?: string;
  language: string;
  default_commission_rate: number;
  so_required: number;
  dn_required: number;
  is_frozen: number;
  disabled: number;
  doctype: "Customer";
  companies: unknown[];
  sales_team: unknown[];
  accounts: unknown[];
  credit_limits: unknown[];
  portal_users: unknown[];
}

export interface SalesOrderItem {
  name: string;
  item_code: string;
  item_name: string;
  description?: string;
  image?: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface SalesOrderSummary {
  name: string;
  transaction_date: string;
  grand_total: number;
  status: string;
}

export interface SalesOrderDetails {
  name: string;
  owner: string;
  creation: string;
  modified: string;
  modified_by: string;
  customer: string;
  customer_name: string;
  transaction_date: string;
  delivery_date: string;
  currency: string;
  total_qty: number;
  grand_total: number;
  rounded_total: number;
  status: string;
  delivery_status: string;
  billing_status: string;
  items: SalesOrderItem[];
}

export interface SalesOrder {
  name: string;
  customer: string;
  customer_name: string;
  delivery_date: string;
  status: string;
  grand_total: number;
  rounded_total: number;
  items: SalesOrderItem[];
}

export interface CreatePaymentIntentRequest {
  amount: number;
  currency?: string;
  sales_order?: string;
}

export interface PaymentIntentResponse {
  client_secret: string;
  id: string;
}