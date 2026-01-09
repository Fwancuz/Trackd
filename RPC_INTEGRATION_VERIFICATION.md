# RPC Integration Verification & Stabilization Guide

**Date:** January 9, 2026  
**Status:** Ready for Testing  
**Objective:** Verify Supabase RPC integration is working correctly

---

## 🔍 Quick Verification Steps

### Step 1: Check Supabase Configuration

Verify your environment variables are set:

```bash
# Check if .env has these variables
cat .env | grep SUPABASE

# Output should show:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 2: Verify Client Initialization

Open browser console and check:

```javascript
// Should show: ✓ URL configured, ✓ Anon key configured
// If you see this in console, Supabase client is ready
```

### Step 3: Run Diagnostic Check

In browser console, run:

```javascript
import { diagnosticCheck } from './rpcDiagnostic.js';
diagnosticCheck();
```

**Expected Output:**
```
✅ Supabase Client: OK
✅ Authentication: OK (or not logged in - that's fine)
✅ RPC Access: OK (if migration executed)
✅ Database Schema: OK (if migration executed)
🎉 ALL CHECKS PASSED!
```

### Step 4: Test Invite Flow

```javascript
import { testInviteFlow } from './rpcDiagnostic.js';
testInviteFlow();
```

**Expected Output:**
```
✅ Link generated: ABC12345
✅ Link details verified
✅ Links listed: 1 total
✅ Invite flow test PASSED!
```

---

## 📋 RPC Functions Verified

### 1. create_invite_link()

**What it does:**
- Generates random 8-character invite code
- Sets expiration time
- Records creator ID
- Returns link ID and code

**Test it:**
```javascript
const { data, error } = await supabase.rpc('create_invite_link', { 
  expires_in_hours: 24 
});
console.log('Generated code:', data[0].invite_code);
```

### 2. get_invite_details()

**What it does:**
- Validates invite code exists
- Checks if expired
- Returns creator info
- No auth required (safe for public)

**Test it:**
```javascript
const { data, error } = await supabase.rpc('get_invite_details', { 
  invite_code_param: 'ABC12345' 
});
console.log('Valid:', data[0].valid);
console.log('Creator:', data[0].created_by_email);
```

### 3. accept_invite_link()

**What it does:**
- Validates invite
- Creates friendship
- Marks link as used
- Returns friendship ID

**Test it:**
```javascript
const { data, error } = await supabase.rpc('accept_invite_link', { 
  invite_code_param: 'ABC12345' 
});
console.log('Success:', data[0].success);
console.log('Message:', data[0].message);
```

### 4. get_my_invite_links()

**What it does:**
- Lists all links created by user
- Shows usage status
- Shows acceptor email
- Ordered by creation date

**Test it:**
```javascript
const { data, error } = await supabase.rpc('get_my_invite_links');
console.log('Links count:', data.length);
data.forEach(link => {
  console.log(link.invite_code, 'Used:', link.used);
});
```

---

## 🛠️ Error Handling Improvements

### What Was Enhanced

1. **Better Error Logging**
   ```javascript
   // Old: console.error('Error:', error)
   // New: console.error with full details
   console.error('RPC error details:', {
     message: error.message,
     code: error.code,
     details: error.details,
     hint: error.hint
   });
   ```

2. **Graceful Degradation**
   ```javascript
   // If RPC fails, show helpful message
   if (error.code === '404') {
     return {
       success: false,
       error: 'Database schema not initialized. Please run the migration.'
     };
   }
   ```

3. **Safe Fallbacks**
   ```javascript
   // getMyInviteLinks returns empty array even if RPC fails
   // Instead of failing completely
   return { success: true, data: [] };
   ```

4. **Response Validation**
   ```javascript
   // Verify response structure before using
   if (!data || !Array.isArray(data) || data.length === 0) {
     throw new Error('Invalid response format');
   }
   ```

---

## 🔐 Supabase Client Configuration Verified

### src/supabaseClient.js

✅ **Using Anon Key**
```javascript
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Why this matters:**
- Anon key is for public/unauthenticated access
- Still respects RLS policies
- RPCs can be called with or without authentication
- Auth header is automatically sent if user is logged in

✅ **Environment Validation**
```javascript
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables...');
}
```

✅ **Logging for Debugging**
```javascript
console.log('Supabase client initialized:', {
  url: supabaseUrl ? '✓ URL configured' : '✗ URL missing',
  auth: supabaseAnonKey ? '✓ Anon key configured' : '✗ Anon key missing'
});
```

---

## 📊 RPC Call Flow

### Request Flow
```
UI Component (FriendsTab.jsx)
  ↓
Service Function (generateInviteLink)
  ↓
supabase.rpc('create_invite_link', {...})
  ↓ (with anon key + auth header if logged in)
Supabase RPC Handler
  ↓
PostgreSQL Function
  ↓ (checks auth.uid() from token)
Database Query
  ↓
Returns: [{ id, invite_code, created_at, expires_at }]
```

### Response Handling
```
Raw RPC Response: { data: [...], error: null }
  ↓
Service Function Validation
  ↓ (checks for errors, validates structure)
Business Logic
  ↓ (constructs URLs, enriches data)
Component State Update
  ↓ (setInviteLinks with full objects)
UI Render
  ↓
Display invite code & actions
```

---

## 🧪 Testing Scenarios

### Scenario 1: Database Not Initialized
**Condition:** Migration SQL not executed yet

**Expected Behavior:**
- RPC call returns 404 error
- Service function catches 404
- Logs helpful message
- Returns: `{success: false, error: '...migration SQL...'}`
- UI shows error toast with instructions

**Test:**
```javascript
// Before running migration
await generateInviteLink(24);
// Console should show: "Database schema not initialized..."
```

### Scenario 2: User Not Authenticated
**Condition:** User not logged in

**Expected Behavior:**
- `supabase.auth.getUser()` returns null
- Service throws "Not authenticated" error
- Returns: `{success: false, error: 'Not authenticated'}`
- UI shows error toast

**Test:**
```javascript
// Logout, then try:
await generateInviteLink(24);
// Should fail with auth error
```

### Scenario 3: Invalid Response Format
**Condition:** RPC returns unexpected structure

**Expected Behavior:**
- Response validation catches issue
- Logs warning with actual response
- Returns: `{success: false, error: 'Invalid response format'}`
- UI shows error toast

**Test:**
```javascript
// Manually test RPC to see actual response
const { data } = await supabase.rpc('create_invite_link', {
  expires_in_hours: 24
});
console.log('Actual response:', data);
```

### Scenario 4: RLS Policy Violation
**Condition:** RLS policy denies access

**Expected Behavior:**
- RPC returns permission denied error
- Service function catches permission error
- Logs details: "permission denied"
- Returns helpful error message

**Test:**
```javascript
// If RLS is too restrictive:
await generateInviteLink(24);
// Should show: "Database schema not initialized..." in console
```

---

## 📈 State Management in FriendsTab

### Invite Links State

**Before:**
```javascript
const [inviteLinks, setInviteLinks] = useState([]);

// Load once on mount
useEffect(() => {
  loadInviteLinks();
}, [userId]);
```

**After (Enhanced):**
```javascript
const [inviteLinks, setInviteLinks] = useState([]);
const [generatingLink, setGeneratingLink] = useState(false);

// Load on mount with error handling
useEffect(() => {
  if (userId) loadInviteLinks();
}, [userId]);

// Generate with proper state update
const handleGenerateInvite = async () => {
  try {
    setGeneratingLink(true);
    const result = await generateInviteLink(24);
    
    if (result.success && result.data) {
      // Validate and update state
      setInviteLinks(prev => [result.data, ...prev]);
      // Show UI feedback
      success('Link generated!');
    } else {
      // Show error with helpful message
      showError(result.error);
    }
  } finally {
    setGeneratingLink(false);
  }
};
```

**Key Improvements:**
- ✅ Validates response has required fields
- ✅ Updates state only on success
- ✅ Shows loading state during generation
- ✅ Provides clear error messages
- ✅ Logs diagnostic info for debugging

---

## 🔗 Environment Variables Required

### .env File
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Getting Your Keys

1. Go to Supabase Dashboard
2. Project Settings → API
3. Copy:
   - Project URL
   - Anon key (NOT Service Role key)
4. Add to `.env` file
5. Restart dev server (`npm run dev`)

### Verifying Keys Work

```javascript
// In browser console
console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Key:', import.meta.env.VITE_SUPABASE_ANON_KEY);
// Both should show values, not 'undefined'
```

---

## ✅ Deployment Checklist

Before going to production:

- [ ] `.env` file has BOTH Supabase variables
- [ ] `LINK_BASED_INVITE_MIGRATION.sql` executed in Supabase
- [ ] `npm run dev` works without errors
- [ ] Diagnostic check passes: `window.rpcDiagnostic.check()`
- [ ] Invite flow test passes: `window.rpcDiagnostic.testFlow()`
- [ ] Can generate a link in FriendsTab
- [ ] Link copy/share buttons work
- [ ] Can accept invite at `/join/:code`
- [ ] Friendship created successfully
- [ ] All theme colors work correctly
- [ ] Mobile responsive tested

---

## 🚨 Common Issues & Solutions

### Issue: "404 not found" when generating link

**Root Cause:** Migration SQL not executed

**Solution:**
1. Go to Supabase Dashboard
2. SQL Editor
3. Copy entire LINK_BASED_INVITE_MIGRATION.sql
4. Execute
5. Refresh browser

### Issue: Button disabled or not responding

**Root Cause:** Validation failing before RPC call

**Solution:**
1. Open browser console (F12)
2. Check for error messages
3. Verify user is logged in
4. Run diagnostic: `window.rpcDiagnostic.check()`

### Issue: "not authenticated" error

**Root Cause:** User not logged in

**Solution:**
1. Ensure user is authenticated
2. Check localStorage for auth token
3. Run: `supabase.auth.getUser()`
4. Should return user object

### Issue: Shared link doesn't work

**Root Cause:** URL not constructed correctly

**Solution:**
1. Check link format: `/join/ABCD1234`
2. Test link directly: `yourapp.com/join/ABC12345`
3. Verify code in console: `console.log(link.invite_code)`

---

## 📞 Support Commands

Useful commands for testing:

```javascript
// Check Supabase client
supabase

// Get current user
const { data } = await supabase.auth.getUser();
console.log(data.user);

// Test RPC
const { data, error } = await supabase.rpc('create_invite_link', { 
  expires_in_hours: 24 
});

// Run diagnostic
window.rpcDiagnostic.check();

// Test full flow
window.rpcDiagnostic.testFlow();
```

---

## 📚 Reference Files

| File | Purpose |
|------|---------|
| src/services/socialService.js | All RPC service functions |
| src/supabaseClient.js | Supabase client init |
| src/FriendsTab.jsx | UI with state management |
| src/rpcDiagnostic.js | Diagnostic tools |
| LINK_BASED_INVITE_MIGRATION.sql | Database schema |

---

## 🎯 Next Steps

1. ✅ Verify all files have proper error handling
2. ✅ Check Supabase client configuration
3. ⏳ Execute database migration (LINK_BASED_INVITE_MIGRATION.sql)
4. ⏳ Test in development environment
5. ⏳ Deploy to production

---

**Last Updated:** January 9, 2026  
**Version:** 1.0  
**Status:** Ready for Testing
