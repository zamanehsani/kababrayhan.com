import {
  saveStoredCustomer,
  saveStoredCustomerProfile,
  type StoredCustomerProfile,
} from "@/app/components/customerStorage";
import { callErpApi } from "@/app/lib/erpServerAction";
import {
  saveCustomerName,
  writeDeliveryAddresses,
  type DeliveryAddressItem,
} from "@/app/lib/customerPortal";
import type {
  Address,
  CustomerContact,
  CustomerDetails,
} from "@/app/redux/apiType";

const CUSTOMER_RESOURCE_URL = "/api/resource/Customer";
const CONTACT_RESOURCE_URL = "/api/resource/Contact";
const ADDRESS_RESOURCE_URL = "/api/resource/Address";

const persistCustomer = (customer: CustomerDetails) => {
  saveCustomerName(customer.name);
  saveStoredCustomer(customer);
  return customer;
};

const readErrorMessage = (error: { status: number | string; data?: unknown }) => {
  const data = error.data as { exception?: string; message?: string } | undefined;
  return data?.exception || data?.message || `ERP request failed (${error.status})`;
};

const findCustomerByDocName = async (phone: string) => {
  const result = await callErpApi<{ data?: CustomerDetails }>({
    url: `${CUSTOMER_RESOURCE_URL}/${encodeURIComponent(phone)}`,
  });

  return result.data?.data ?? null;
};

const findCustomerByMobile = async (phone: string) => {
  const result = await callErpApi<{ data?: CustomerDetails[] }>({
    url: CUSTOMER_RESOURCE_URL,
    params: {
      filters: JSON.stringify([["mobile_no", "=", phone]]),
      fields: JSON.stringify(["*"]),
      limit_page_length: 1,
    },
  });

  if (result.error) {
    throw new Error(readErrorMessage(result.error));
  }

  return result.data?.data?.[0] ?? null;
};

const linkedToCustomerFilters = (customerName: string) =>
  JSON.stringify([
    ["Dynamic Link", "link_doctype", "=", "Customer"],
    ["Dynamic Link", "link_name", "=", customerName],
  ]);

export const toDeliveryAddressItem = (
  address: Address
): DeliveryAddressItem => ({
  title: address.address_title || address.address_type || "Saved Address",
  address: [address.address_line1, address.address_line2, address.city]
    .filter(Boolean)
    .join(", "),
  addressId: address.name,
  isDelivery: Boolean(address.is_shipping_address),
  isBilling: Boolean(address.is_primary_address),
  latitude: address.custom_latitude,
  longitude: address.custom_longitude,
});

export const fetchCustomerContact = async (
  customerName: string
): Promise<CustomerContact | null> => {
  const result = await callErpApi<{ data?: CustomerContact[] }>({
    url: CONTACT_RESOURCE_URL,
    params: {
      filters: linkedToCustomerFilters(customerName),
      fields: JSON.stringify([
        "name",
        "first_name",
        "last_name",
        "email_id",
        "mobile_no",
        "phone",
      ]),
      limit_page_length: 1,
    },
  });

  return result.data?.data?.[0] ?? null;
};

export const fetchCustomerAddresses = async (
  customerName: string
): Promise<Address[]> => {
  const result = await callErpApi<{ data?: Address[] }>({
    url: ADDRESS_RESOURCE_URL,
    params: {
      filters: JSON.stringify([
        ["Dynamic Link", "link_doctype", "=", "Customer"],
        ["Dynamic Link", "link_name", "=", customerName],
        ["disabled", "=", 0],
      ]),
      fields: JSON.stringify([
        "name",
        "address_title",
        "address_type",
        "address_line1",
        "address_line2",
        "city",
        "country",
        "phone",
        "is_primary_address",
        "is_shipping_address",
        "custom_latitude",
        "custom_longitude",
      ]),
      limit_page_length: 50,
    },
  });

  return result.data?.data ?? [];
};

/** Caches the customer together with its contact and linked addresses. */
export const loadCustomerProfile = async (
  customer: CustomerDetails
): Promise<StoredCustomerProfile> => {
  const [contact, addresses] = await Promise.all([
    fetchCustomerContact(customer.name),
    fetchCustomerAddresses(customer.name),
  ]);

  const profile: StoredCustomerProfile = { customer, contact, addresses };
  saveStoredCustomerProfile(profile);
  writeDeliveryAddresses(addresses.map(toDeliveryAddressItem));

  return profile;
};

/**
 * Returns the ERPNext Customer for a verified phone, creating it when missing,
 * and caches it locally as the active customer instance.
 */
export const ensureCustomerForPhone = async (
  phone: string
): Promise<StoredCustomerProfile> => {
  const existingByName = await findCustomerByDocName(phone);
  if (existingByName) {
    return loadCustomerProfile(persistCustomer(existingByName));
  }

  const existingByMobile = await findCustomerByMobile(phone);
  if (existingByMobile) {
    return loadCustomerProfile(persistCustomer(existingByMobile));
  }

  const created = await callErpApi<{ data: CustomerDetails }>({
    url: CUSTOMER_RESOURCE_URL,
    method: "POST",
    body: {
      customer_name: phone,
      customer_type: "Individual",
      customer_group: "Individual",
      customer_no: phone.replace(/\D/g, ""),
      first_name: phone,
      last_name: phone,
      mobile_no: phone,
    },
  });

  if (created.error || !created.data?.data) {
    throw new Error(
      created.error
        ? readErrorMessage(created.error)
        : "Customer creation returned no data."
    );
  }

  return loadCustomerProfile(persistCustomer(created.data.data));
};
