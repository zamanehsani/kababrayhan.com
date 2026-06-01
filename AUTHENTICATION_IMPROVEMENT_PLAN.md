# Authentication & Session Management — Improvement Plan

## 🔴 Current Architecture Problems

### 1. **Hardcoded API Token (Critical Security Issue)**
```ts
// app/redux/api.ts, line 40
const ERP_API_AUTHORIZATION = "token eeae0e4d6d43b84:eb40ba11a8d0946";
```
- **Problem**: Everyone uses the same system-level token
- **Risk**: Token exposed in client-side code → anyone can make API calls
- **Impact**: No per-user permissions, audit trail impossible

### 2. **Frontend-Only Session (No Backend State)**
```ts
// app/lib/customerPortal.ts
localStorage.setItem(PHONE_KEY, phone);
localStorage.setItem(CUSTOMER_NAME_KEY, customerName);
```
- **Problem**: Session stored only in browser localStorage
- **Risk**: 
  - User can modify their own customer ID
  - No session across devices
  - No automatic expiration
  - Vulnerable to XSS attacks

### 3. **Manual Data Management**
- Phone, addresses, customer name all managed client-side
- No synchronization with ERPNext backend
- Addresses created but never fetched from backend

### 4. **Weak Logout**
```ts
export const clearCustomerPortalSession = () => {
  localStorage.removeItem(PHONE_KEY);
  localStorage.removeItem(CUSTOMER_NAME_KEY);
  // ...just clears frontend state
};
```
- Doesn't invalidate backend session (because there isn't one)
- User can still make API calls with the hardcoded token

---

## ✅ Recommended Architecture (ERPNext Session-Based Auth)

### **How ERPNext/Frappe Authentication Works**

ERPNext provides cookie-based session authentication:

1. **Login Flow**:
   ```
   POST /api/method/login
   Body: { usr: "customer@email.com", pwd: "password" }
   Response: Sets httpOnly session cookies (sid, user_id)
   ```

2. **Authenticated Requests**:
   - Session cookie automatically sent with each request
   - ERPNext validates session server-side
   - Returns 401 if session expired/invalid

3. **Logout**:
   ```
   POST /api/method/logout
   Response: Clears session cookies
   ```

### **But Wait — You're Using OTP, Not Password!**

Your app uses OTP verification, not email/password. Here's how to bridge this:

#### **Option A: OTP → ERPNext Session (Recommended)**

After successful OTP verification, create an ERPNext user session:

```typescript
// New endpoint needed in ERPNext backend (custom Frappe method)
// pizza_app.api.login_with_otp

@frappe.whitelist(allow_guest=True)
def login_with_otp(mobile, otp):
    # 1. Verify OTP (you already have this)
    if not verify_otp_code(mobile, otp):
        return {"status": "error", "message": "Invalid OTP"}
    
    # 2. Find or create Customer by mobile number
    customer = frappe.get_value("Customer", {"mobile_no": mobile}, "name")
    if not customer:
        return {"status": "error", "message": "Customer not found"}
    
    # 3. Find linked Contact with email (required for login)
    contact = frappe.get_value("Contact", {
        "link_doctype": "Customer",
        "link_name": customer
    }, ["email_id", "name"])
    
    if not contact or not contact.email_id:
        return {"status": "error", "message": "No email linked"}
    
    # 4. Create ERPNext session (login the user)
    from frappe.auth import LoginManager
    login_manager = LoginManager()
    login_manager.login_as(contact.email_id)
    
    # 5. Return customer info
    return {
        "status": "success",
        "customer": customer,
        "user": frappe.session.user
    }
```

Then on frontend:

```typescript
// app/redux/api.ts
loginWithOtp: builder.mutation<LoginResponse, { mobile: string; otp: string }>({
  query: (body) => ({
    url: `${ERP_API_METHOD_URL}pizza_app.api.login_with_otp`,
    method: "POST",
    body,
    credentials: "include", // ← Important: send/receive cookies
  }),
  transformResponse: (response: any) => response.message,
}),
```

#### **Option B: Keep Current Flow + Add Frappe Login (Simpler Short-Term)**

1. Verify OTP (current flow)
2. Auto-generate a password for the customer
3. Call standard `/api/method/login` with customer email + generated password
4. Store session in cookies

---

## 📋 Implementation Roadmap

### **Phase 1: Backend Setup (ERPNext/Frappe)**

#### 1.1. Create Customer Login Method
**File**: `apps/pizza_app/pizza_app/api.py`

```python
@frappe.whitelist(allow_guest=True)
def login_with_otp(mobile, otp):
    """
    Login customer after OTP verification.
    Creates ERPNext session and returns customer data.
    """
    # Verify OTP
    if not verify_otp_code(mobile, otp):
        frappe.throw("Invalid or expired OTP")
    
    # Find Customer
    customer_name = frappe.get_value("Customer", {"mobile_no": mobile}, "name")
    if not customer_name:
        frappe.throw("Customer not found")
    
    # Get Customer details + linked Contact
    customer = frappe.get_doc("Customer", customer_name)
    
    # Find email from linked Contact (required for Frappe user)
    contact = frappe.get_value("Dynamic Link", {
        "link_doctype": "Customer",
        "link_name": customer_name,
        "parenttype": "Contact"
    }, "parent")
    
    contact_email = None
    if contact:
        contact_email = frappe.get_value("Contact", contact, "email_id")
    
    # If no contact email, use placeholder (you may want to create proper user)
    if not contact_email:
        contact_email = f"{mobile}@customer.placeholder"
    
    # Create or get Frappe User for this customer
    if not frappe.db.exists("User", contact_email):
        user = frappe.get_doc({
            "doctype": "User",
            "email": contact_email,
            "first_name": customer.customer_name,
            "user_type": "Website User",
            "send_welcome_email": 0
        })
        user.insert(ignore_permissions=True)
    
    # Login (creates session)
    from frappe.auth import LoginManager
    login_manager = LoginManager()
    login_manager.login_as(contact_email)
    
    return {
        "status": "success",
        "customer_name": customer_name,
        "user": frappe.session.user,
        "full_name": customer.customer_name
    }

@frappe.whitelist()
def get_customer_addresses(customer_name):
    """
    Fetch all addresses linked to a customer.
    Requires authenticated session.
    """
    addresses = frappe.get_all("Address", filters={
        "link_doctype": "Customer",
        "link_name": customer_name
    }, fields=["name", "address_title", "address_type", "address_line1", 
               "city", "country", "phone", "is_primary_address"])
    
    return addresses

@frappe.whitelist()
def get_customer_profile():
    """
    Get current logged-in customer's profile.
    Requires authenticated session.
    """
    user = frappe.session.user
    if user == "Guest":
        frappe.throw("Not authenticated")
    
    # Find customer linked to this user
    contact = frappe.get_value("Contact", {"email_id": user}, "name")
    if not contact:
        frappe.throw("No customer profile found")
    
    customer_link = frappe.get_value("Dynamic Link", {
        "link_doctype": "Customer",
        "parenttype": "Contact",
        "parent": contact
    }, "link_name")
    
    if not customer_link:
        frappe.throw("No customer linked")
    
    customer = frappe.get_doc("Customer", customer_link)
    addresses = get_customer_addresses(customer_link)
    
    return {
        "customer_name": customer.name,
        "mobile_no": customer.mobile_no,
        "customer_display": customer.customer_name,
        "addresses": addresses
    }
```

#### 1.2. Update CORS Settings
**File**: `sites/kababrayhan.com/site_config.json`

```json
{
  "allow_cors": "*",
  "allow_credentials": true
}
```

---

### **Phase 2: Frontend Refactor**

#### 2.1. Update API Configuration

**File**: `app/redux/api.ts`

```typescript
// REMOVE hardcoded token
// const ERP_API_AUTHORIZATION = "token eeae0e4d6d43b84:eb40ba11a8d0946";

export const erpApi = createApi({
  reducerPath: "erpApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${ERP_API_BASE_URL}/api/`,
    credentials: "include", // ← Send cookies with every request
    prepareHeaders: (headers) => {
      headers.set("X-Frappe-Site-Name", "kababrayhan.com");
      // No more Authorization header with hardcoded token
      return headers;
    },
  }),
  endpoints: (builder) => ({
    // ... existing endpoints
  }),
});
```

#### 2.2. Add New Authentication Endpoints

```typescript
// app/redux/api.ts
endpoints: (builder) => ({
  // NEW: Login with OTP (replaces current verifyOtp flow)
  loginWithOtp: builder.mutation<LoginResponse, { mobile: string; otp: string }>({
    query: (body) => ({
      url: "method/pizza_app.api.login_with_otp",
      method: "POST",
      body,
    }),
    transformResponse: (response: any) => response.message,
  }),
  
  // NEW: Get current user's profile (from session)
  getCustomerProfile: builder.query<CustomerProfile, void>({
    query: () => ({
      url: "method/pizza_app.api.get_customer_profile",
      method: "GET",
    }),
    transformResponse: (response: any) => response.message,
  }),
  
  // NEW: Get addresses from backend
  getCustomerAddresses: builder.query<Address[], string>({
    query: (customerName) => ({
      url: "method/pizza_app.api.get_customer_addresses",
      method: "GET",
      params: { customer_name: customerName },
    }),
    transformResponse: (response: any) => response.message,
  }),
  
  // NEW: Logout
  logout: builder.mutation<void, void>({
    query: () => ({
      url: "method/logout",
      method: "POST",
    }),
  }),
  
  // Keep sendOtp (unchanged)
  sendOtp: builder.mutation<SendOtpResponse, SendOtpRequest>({
    query: (body) => ({
      url: "method/pizza_app.api.send_otp",
      method: "POST",
      body,
    }),
    transformResponse: (response: any) => response.message,
  }),
  
  // ... other endpoints
})
```

#### 2.3. Update Session Management

**File**: `app/lib/customerPortal.ts`

```typescript
// NEW: Fetch customer data from backend session instead of localStorage
export const initializeCustomerPortalSession = async () => {
  try {
    // Try to fetch profile from backend (validates session)
    const response = await fetch(`${ERP_API_BASE_URL}/api/method/pizza_app.api.get_customer_profile`, {
      credentials: "include",
      headers: {
        "X-Frappe-Site-Name": "kababrayhan.com",
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      const profile = data.message;
      
      // Sync backend data to Redux
      store.dispatch(hydrateSession({
        phone: profile.mobile_no,
        phoneStatus: "verified",
        customerName: profile.customer_name,
        isAuthenticated: true,
      }));
      
      return profile;
    } else {
      // No valid session, clear frontend state
      store.dispatch(clearSession());
    }
  } catch (error) {
    console.error("Session check failed:", error);
    store.dispatch(clearSession());
  }
  
  return null;
};

export const logout = async () => {
  try {
    await fetch(`${ERP_API_BASE_URL}/api/method/logout`, {
      method: "POST",
      credentials: "include",
      headers: {
        "X-Frappe-Site-Name": "kababrayhan.com",
      },
    });
  } catch (error) {
    console.error("Logout failed:", error);
  } finally {
    // Always clear frontend state
    store.dispatch(clearSession());
    localStorage.clear();
  }
};
```

#### 2.4. Update Phone Verification Flow

**File**: `app/components/home/modal/PhoneVerifyModal.tsx`

```typescript
const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
  e.preventDefault();
  const code = digits.join("");
  
  if (/^\d{4}$/.test(code)) {
    try {
      const mobile = phone.replace("+", "").replace(/^0+/, "");
      
      // NEW: Use loginWithOtp instead of verifyOtp
      const result = await loginWithOtp({ mobile, otp: code }).unwrap();
      
      if (result.status === "success") {
        // Session created, customer data returned
        // Redux state will auto-update from session
        setError("");
        onClose();
      } else {
        setError("Invalid code. Please try again.");
      }
    } catch (error) {
      console.error("Login failed", error);
      setError("Invalid code. Please try again.");
    }
  }
};
```

#### 2.5. Update Headers to Show Profile

**File**: `app/components/Header/MobileHeader.tsx`

```typescript
// Replace localStorage reads with backend query
const { data: profile, isLoading } = useGetCustomerProfileQuery();

const { data: salesOrders } = useGetCustomerSalesOrdersQuery(
  profile?.customer_name,
  { skip: !profile }
);

const { data: customerAvatar } = useGetCustomerAvatarQuery(
  profile?.customer_name,
  { skip: !profile }
);

const handleSignOut = async () => {
  await logout(); // Calls backend logout + clears local state
  router.push("/home");
};
```

---

## 🎯 Benefits of This Approach

| Feature | Before | After |
|---------|--------|-------|
| **Security** | Hardcoded token in client | httpOnly cookies, server-managed |
| **Session** | localStorage only | ERPNext backend session |
| **Cross-device** | ❌ Each device separate | ✅ Login from any device |
| **Logout** | Frontend only | Invalidates backend session |
| **Addresses** | Manually saved in localStorage | Fetched from ERPNext Address doctype |
| **Phone updates** | Complex localStorage logic | Single source of truth (ERPNext) |
| **Audit trail** | None | ERPNext tracks all user actions |
| **Session expiry** | Never (unless localStorage cleared) | Auto-expires (configurable in ERPNext) |

---

## 🚀 Migration Strategy

### **Step 1: Add Endpoints (No Breaking Changes)**
- Add new backend methods (`login_with_otp`, `get_customer_profile`, etc.)
- Keep existing `verify_otp` working
- Test new endpoints in isolation

### **Step 2: Feature Flag Toggle**
```typescript
// app/config.ts
export const USE_BACKEND_SESSION = process.env.NEXT_PUBLIC_USE_BACKEND_SESSION === "true";
```

Implement dual-mode support:
```typescript
if (USE_BACKEND_SESSION) {
  await loginWithOtp({ mobile, otp });
} else {
  await verifyOtp({ mobile, otp }); // Old flow
}
```

### **Step 3: Gradual Rollout**
1. Test with internal users (feature flag ON)
2. Monitor for issues
3. Enable for 10% of users
4. Full rollout
5. Remove old code

---

## 📝 Additional Improvements

### **1. Add Session Expiry UI**
```typescript
// Middleware to check session on route change
export async function middleware(request: NextRequest) {
  const response = await fetch(`${ERP_API_BASE_URL}/api/method/ping`, {
    credentials: "include",
  });
  
  if (!response.ok) {
    // Session expired, redirect to login
    return NextResponse.redirect(new URL("/home", request.url));
  }
  
  return NextResponse.next();
}
```

### **2. Remember Me (Extended Session)**
```python
# Backend: Set longer session timeout for remember_me
@frappe.whitelist(allow_guest=True)
def login_with_otp(mobile, otp, remember_me=False):
    # ... existing login logic
    
    if remember_me:
        frappe.local.cookie_manager.set_remember_me()
    
    return {"status": "success"}
```

### **3. Refresh Token Pattern (Optional)**
For even longer sessions without re-login:
- Short-lived access token (15 min)
- Long-lived refresh token (30 days)
- Auto-refresh on API calls

---

## ⚠️ Breaking Changes to Consider

1. **Cookies require HTTPS in production**
   - Ensure `portal.kababrayhan.com` uses HTTPS
   - Set `secure: true` on cookies in production

2. **CORS Configuration**
   - Frontend and backend must share cookie domain
   - If frontend is `app.kababrayhan.com` and backend is `portal.kababrayhan.com`, set cookie domain to `.kababrayhan.com`

3. **Logout Behavior**
   - Users will need to re-verify OTP after logout (expected)
   - Consider "Keep me logged in" option

---

## 🔧 Quick Wins (Can Do Today)

Even without full refactor:

### **1. Fetch Addresses from Backend**
```typescript
// Add this endpoint NOW (works with current auth)
getCustomerAddresses: builder.query<Address[], string>({
  query: (customerName) => ({
    url: `resource/Address`,
    params: {
      filters: JSON.stringify([
        ["link_doctype", "=", "Customer"],
        ["link_name", "=", customerName]
      ]),
      fields: JSON.stringify(["name", "address_title", "address_line1", "city"])
    },
  }),
  transformResponse: (response: { data: Address[] }) => response.data,
}),
```

Use in account profile:
```typescript
const { data: backendAddresses } = useGetCustomerAddressesQuery(getCustomerName());
```

### **2. Move API Token to Environment Variable**
```typescript
// .env.local
NEXT_PUBLIC_ERP_API_TOKEN=eeae0e4d6d43b84:eb40ba11a8d0946

// app/redux/api.ts
const ERP_API_AUTHORIZATION = `token ${process.env.NEXT_PUBLIC_ERP_API_TOKEN}`;
```

At least it's not hardcoded in source control.

### **3. Add Session Validation**
```typescript
// Check if stored customer still exists in backend
useEffect(() => {
  const customerName = getCustomerName();
  if (customerName) {
    // This will 404 if customer was deleted
    dispatch(erpApi.endpoints.getCustomer.initiate(customerName));
  }
}, []);
```

---

## 📚 Resources

- [Frappe Authentication Guide](https://frappeframework.com/docs/user/en/api/auth)
- [ERPNext REST API Docs](https://frappeframework.com/docs/user/en/api/rest)
- [Next.js Middleware for Auth](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---

## 💬 Questions to Answer

Before implementing:

1. **Do you want users to stay logged in across browser sessions?**
   - Yes → Implement remember_me with long session
   - No → Keep default (session cookie, cleared on browser close)

2. **Should logout be app-wide or device-specific?**
   - App-wide → Logout invalidates all sessions
   - Device-specific → Each device has independent session

3. **What happens to existing localStorage users?**
   - Migration flow: Detect old localStorage data, prompt to verify OTP once, create proper session

4. **Rate limiting on OTP?**
   - Currently no protection against OTP spam
   - Recommend: Max 3 OTP requests per phone per hour

---

**Next Steps**: Let me know which phase you want to start with, or if you want me to implement the "Quick Wins" first to see immediate improvement.
