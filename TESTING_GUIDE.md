# Fairness Engine - Testing Guide

## Quick Start

1. **Start the dev server:**
   ```bash
   pnpm dev
   ```
   The app will be available at `http://localhost:3000`

2. **Access the app:**
   - Open the preview in v0, or
   - Navigate to http://localhost:3000

---

## Testing The Authentication Flow

### Step 1: Test Sign Up

1. Click **"Get Started"** on the homepage
2. You'll be redirected to `/auth/sign-up`
3. Fill in the form:
   - **Full Name:** John Doe (or any name)
   - **Email:** student@test.com
   - **Role:** Student (dropdown)
   - **Password:** Test@1234
   - **Repeat Password:** Test@1234
4. Click **"Sign up"**
5. You should see the success page: "Check your email to confirm your signup"

**Note:** In development, email confirmation is often auto-confirmed by Supabase. You may be redirected to `/dashboard/student` automatically.

---

### Step 2: Test Login

1. From homepage, click **"Sign In"** or go to `/auth/login`
2. Enter credentials:
   - **Email:** student@test.com
   - **Password:** Test@1234
3. Click **"Login"**
4. **Expected:** You should be redirected to `/dashboard/student` (based on your role)

---

### Step 3: Create Test Accounts for Each Role

**Create a Teacher Account:**
1. Go to `/auth/sign-up`
2. Sign up with:
   - Name: Jane Teacher
   - Email: teacher@test.com
   - Role: Teacher
   - Password: Test@1234

**Create an Admin Account (Manual):**
Go to your Supabase dashboard and manually update a user's role to 'admin', or use the SQL:
```sql
UPDATE public.users SET role = 'admin' WHERE email = 'admin@test.com';
```

---

## Testing Role-Based Dashboards

### Student Dashboard
- **Login as:** student@test.com
- **Access:** http://localhost:3000/dashboard/student
- **Expected Features:**
  - View assigned projects
  - Submit work logs
  - Rate peers (1-5 stars)
  - View your fairness score

### Teacher Dashboard
- **Login as:** teacher@test.com
- **Access:** http://localhost:3000/dashboard/teacher
- **Expected Features:**
  - Create new projects
  - Manage groups
  - View student submissions
  - Evaluate students
  - See fairness score trends

### Admin Dashboard
- **Login as:** admin@test.com (or upgraded account)
- **Access:** http://localhost:3000/dashboard/admin
- **Expected Features:**
  - System statistics (users, projects, disputes)
  - Manage user accounts
  - Resolve disputes
  - View activity logs

---

## Testing Core Features

### 1. Create a Project (Teacher)
1. Login as teacher@test.com
2. Go to `/dashboard/teacher`
3. Click "Create New Project"
4. Fill in:
   - **Title:** Group Assignment #1
   - **Description:** Web development project
   - **Deadline:** Set a future date
5. Click "Create"
6. **Expected:** Project appears in the list

### 2. Create Groups and Add Students (Teacher)
1. From the project, click "Manage Groups"
2. Create groups and add students
3. Students should appear in group list

### 3. Submit Work Log (Student)
1. Login as student@test.com
2. Go to assigned project
3. Click "Add Work Log"
4. Fill in:
   - **Week:** 1
   - **Description:** "Implemented authentication module"
   - **Evidence Link:** https://github.com/...
5. Click "Submit"
6. **Expected:** Work log appears in project timeline

### 4. Rate Peers (Student)
1. In project, find peer ratings section
2. Rate other group members (1-5 stars)
3. Add optional feedback
4. Click "Submit Rating"

### 5. Evaluate Student (Teacher)
1. Go to project details
2. Find student to evaluate
3. Enter score (0-100)
4. Add comment
5. Click "Submit Evaluation"

### 6. View Fairness Score
1. **Student view:** Dashboard shows individual fairness score
2. **Teacher view:** See fairness scores for all group members
3. **Score calculated from:**
   - Peer ratings (40%)
   - Work log participation (30%)
   - Teacher evaluation (30%)

---

## Testing Error Cases

### Test Invalid Login
1. Go to `/auth/login`
2. Enter wrong credentials:
   - Email: student@test.com
   - Password: wrongpassword
3. **Expected:** Error message appears: "Invalid login credentials"

### Test Email Validation
1. On signup, enter invalid email: "notanemail"
2. **Expected:** HTML validation error

### Test Password Mismatch
1. On signup:
   - Password: Test@1234
   - Repeat: Different@123
2. **Expected:** Error message: "Passwords do not match"

### Test Missing Fields
1. Try to submit signup form with empty fields
2. **Expected:** HTML required field validation

---

## Testing API Endpoints (Advanced)

Use Postman or curl to test endpoints directly.

### Get Projects
```bash
curl http://localhost:3000/api/projects \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

### Create Work Log
```bash
curl -X POST http://localhost:3000/api/work-logs \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "USER_ID",
    "project_id": "PROJECT_ID",
    "week_no": 1,
    "work_description": "Completed backend"
  }'
```

### Get Fairness Score
```bash
curl "http://localhost:3000/api/reports/fairness-score?project_id=PROJECT_ID&student_id=STUDENT_ID" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

---

## Debugging Tips

### Check Console Logs
1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Look for any error messages prefixed with `[v0]`

### Check Supabase
1. Go to your Supabase project dashboard
2. Check **Database** → **Tables** to see data
3. Check **Auth** to see user accounts
4. Check **Logs** for API errors

### Common Issues

**Issue:** Login fails with "Missing Supabase URL or API key"
- **Fix:** Check that env vars are set: `echo $NEXT_PUBLIC_SUPABASE_URL`

**Issue:** Page shows 404 after login
- **Fix:** Make sure the dashboard route exists: `/dashboard/[role]`

**Issue:** Can't see created projects
- **Fix:** Verify Row Level Security (RLS) policies allow the user to view data

---

## Test Checklist

- [ ] Signup with student role
- [ ] Signup with teacher role
- [ ] Login with correct credentials
- [ ] Login with wrong credentials (should fail)
- [ ] Redirects to correct dashboard
- [ ] Create project (teacher)
- [ ] View projects (student)
- [ ] Submit work log
- [ ] Rate peers
- [ ] Evaluate students
- [ ] View fairness scores
- [ ] Admin can see all users
- [ ] Admin can resolve disputes
- [ ] Logout functionality works

---

## Next Steps

1. **Test the app thoroughly** using the checklist above
2. **Report any bugs** with details about what you did
3. **Add sample data** for easier testing
4. **Deploy** when confident everything works
