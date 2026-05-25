# Login & Authentication Testing Guide

## Issues Found & Fixed

### ✅ FIXED: Incorrect Login Redirect
**Issue:** The login page was redirecting to `/protected` which doesn't exist.
**Fix:** Updated login to redirect based on user role:
- Students → `/dashboard/student`
- Teachers → `/dashboard/teacher`
- Admins → `/dashboard/admin`

The fixed login redirects dynamically based on the user's role stored in the database.

---

## Quick Login Test Steps

### Test 1: Try Wrong Credentials (Should Fail)
1. Go to http://localhost:3000/auth/login
2. Enter:
   - Email: `test@test.com`
   - Password: `wrongpassword`
3. Click "Login"
4. **Expected:** Error message appears: "Invalid login credentials"

### Test 2: Try Non-Existent User (Should Fail)
1. Go to http://localhost:3000/auth/login
2. Enter:
   - Email: `nonexistent@test.com`
   - Password: `Test@1234`
3. Click "Login"
4. **Expected:** Error message appears

### Test 3: Test Email Field Validation
1. Go to http://localhost:3000/auth/login
2. Try to submit with invalid email: `notanemail`
3. **Expected:** Browser HTML5 validation error

---

## Complete Authentication Flow

### Step 1: Sign Up First
Since you need a user account to login, follow these steps:

**URL:** http://localhost:3000/auth/sign-up

**Form Fields:**
- Full Name: `Alice Student`
- Email: `alice@test.com`
- Role: `Student` (dropdown)
- Password: `Test@1234`
- Repeat Password: `Test@1234`

**What Happens After Sign Up:**
1. Supabase creates a new auth user
2. Database trigger auto-creates a user profile with:
   - Email: `alice@test.com`
   - Name: `Alice Student`
   - Role: `student` (from dropdown)
   - Status: `active`

**Next Page:** Typically redirects to success page or auto-login

---

### Step 2: Login with the Created Account
**URL:** http://localhost:3000/auth/login

**Form Fields:**
- Email: `alice@test.com`
- Password: `Test@1234`

**Login Flow:**
1. Sends credentials to Supabase Auth
2. If valid, gets user session
3. Queries database for user role
4. Redirects to appropriate dashboard:
   - `/dashboard/student` ← For students
   - `/dashboard/teacher` ← For teachers
   - `/dashboard/admin` ← For admins

---

## How to Create Test Users for Each Role

### Method 1: Sign Up (Frontend)
1. Go to http://localhost:3000/auth/sign-up
2. Create user with desired role from dropdown
3. Role options: Student, Teacher (Admin must be created via SQL)

### Method 2: Manual SQL (Advanced)
Connect to Supabase dashboard and run:

```sql
-- Create a teacher user
UPDATE public.users SET role = 'teacher' 
WHERE email = 'alice@test.com';

-- Create an admin user
UPDATE public.users SET role = 'admin' 
WHERE email = 'admin@test.com';
```

### Test Users Recommended
- **Student:** alice@test.com / Test@1234
- **Teacher:** bob@test.com / Test@1234
- **Admin:** admin@test.com / Test@1234

---

## Login Response Handling

### Successful Login
```
User logs in → Supabase validates → Role fetched from DB → Redirect to dashboard
```

**What the login does:**
1. Calls `supabase.auth.signInWithPassword(email, password)`
2. If error, displays error message to user
3. If successful:
   - Gets authenticated user ID
   - Queries `users` table for that user's role
   - Redirects to `/dashboard/{role}`

### Failed Login (Wrong Password)
```
Error: "Invalid login credentials" displayed in red text
```

### Failed Login (User Doesn't Exist)
```
Error: "Invalid login credentials" displayed in red text
(Supabase doesn't distinguish for security)
```

---

## Code: Login Implementation

### Location: `/app/auth/login/page.tsx`

**Key Login Handler:**
```typescript
const handleLogin = async (e: React.FormEvent) => {
  // Sign in with Supabase Auth
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) throw error
  
  // Get user role from database
  const { data: { user } } = await supabase.auth.getUser()
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  
  // Redirect based on role
  const role = userData?.role || 'student'
  router.push(`/dashboard/${role}`)
}
```

---

## Troubleshooting

### Problem: Login button doesn't respond
**Solution:**
1. Check browser console (F12) for errors
2. Verify Supabase env vars are set
3. Try refreshing the page

### Problem: "Invalid login credentials" even with correct password
**Possible Causes:**
1. User hasn't verified email (development mode may auto-verify)
2. Email is case-sensitive in Supabase
3. User account doesn't exist yet

### Problem: Redirects to wrong dashboard
**Cause:** User role is not set correctly in database
**Fix:** Update user role manually:
```sql
UPDATE public.users SET role = 'teacher' WHERE email = 'bob@test.com';
```

### Problem: Page stays on login after clicking
**Cause:** Supabase client initialization failed
**Debug:**
1. Open DevTools Console (F12)
2. Look for errors about missing env vars
3. Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

---

## Login Flow Diagram

```
┌─────────────────────┐
│  Login Page         │
│  /auth/login        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Enter Email & Pass │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Supabase Auth      │
│  Validates Creds    │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     ▼           ▼
  SUCCESS      FAIL
     │           │
     ▼           ▼
┌─────────┐  ┌──────────┐
│Get User │  │Show Error│
│ Role    │  │Message   │
└────┬────┘  └──────────┘
     │
     ▼
┌──────────────────┐
│Check users table │
│for role          │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│Redirect to       │
│/dashboard/{role} │
└──────────────────┘
```

---

## Test Checklist

- [ ] Can sign up as student
- [ ] Can sign up as teacher
- [ ] Login with correct credentials redirects to student dashboard
- [ ] Login with wrong password shows error
- [ ] Login with non-existent user shows error
- [ ] Email field validates email format
- [ ] Password field is masked
- [ ] "Sign up" link works on login page
- [ ] "Sign in" link works on signup page
- [ ] Student redirects to `/dashboard/student`
- [ ] Teacher redirects to `/dashboard/teacher`
- [ ] Admin redirects to `/dashboard/admin`
- [ ] Session persists after page refresh
- [ ] Logout clears session

---

## Security Notes

✅ **What's Secure:**
- Passwords are hashed by Supabase
- Sessions are secure HTTP-only cookies
- Row Level Security (RLS) policies protect data
- User can only see their own data

⚠️ **What to Implement:**
- Forgot password flow (coming soon)
- Rate limiting on login attempts
- 2FA/MFA support (optional)
- Session timeout protection

---

## Next Steps After Successful Login

After a user successfully logs in, they will see their role-specific dashboard:

**Student Dashboard:**
- View assigned projects
- Submit work logs
- Rate peers
- View fairness scores

**Teacher Dashboard:**
- Create projects
- Manage groups
- Evaluate students
- View reports

**Admin Dashboard:**
- View system statistics
- Manage users
- Resolve disputes
- View activity logs
