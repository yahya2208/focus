# Admin Guide

This guide explains how to manage FOCUS v2.0 as a platform administrator.

## Table of Contents

1. [Creating the First Super Admin](#creating-the-first-super-admin)
2. [Signing In as Admin](#signing-in-as-admin)
3. [Accessing the Research Console](#accessing-the-research-console)
4. [Managing User Roles](#managing-user-roles)
5. [Viewing Data](#viewing-data)
6. [Exporting Data](#exporting-data)
7. [Security Notes](#security-notes)

---

## Creating the First Super Admin

The first super admin must be created through the **Admin Setup** page. This is a one-time operation.

### Steps

1. Open the FOCUS app
2. Go to **Settings**
3. Click **Admin Setup** under the Administration section
4. If no super admin exists yet, you'll see the setup form
5. Enter your email, display name, and a secure password (minimum 8 characters)
6. Click **Create Super Admin Account**
7. You are now logged in as the super admin

### Important

- The Admin Setup page is **only available when no super admin exists** in the database
- Once a super admin is created, the setup page shows "Administrator Already Exists"
- Additional admin accounts must be promoted by an existing super admin

### If Supabase is Not Configured

If you haven't set up Supabase yet, the Admin Setup page will check the database and show the setup form. You'll need to:

1. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables
2. Run the migration `supabase/migrations/001_initial_schema.sql`
3. Run the migration `supabase/migrations/002_admin_bootstrap.sql`

---

## Signing In as Admin

### From the Login Page

1. Click **Sign In** in Settings, or navigate to the Login screen
2. Enter your admin email and password
3. Click **Sign In**
4. Your role will be displayed under Account in Settings

### Role-Based Access

| Role | Can Access Research Console | Can Manage Users |
|------|:--------------------------:|:----------------:|
| `super_admin` | Yes | Yes |
| `admin` | Yes | Yes |
| `researcher` | Yes (read-only) | No |
| `user` | No | No |
| `guest` | No | No |

---

## Accessing the Research Console

1. Sign in with an account that has `researcher`, `admin`, or `super_admin` role
2. Go to **Settings**
3. Click **Research Console**

The Research Console shows different tabs based on your role:

| Dashboard | super_admin | admin | researcher | viewer |
|-----------|:-----------:|:-----:|:----------:|:------:|
| Overview | ✓ | ✓ | ✓ | ✓ |
| Sessions | ✓ | ✓ | ✓ | ✓ |
| Users | ✓ | ✓ | ✓ | ✓ |
| Devices | ✓ | ✓ | ✓ | — |
| Surveys | ✓ | ✓ | ✓ | — |
| Campaigns | ✓ | ✓ | — | — |
| Live | ✓ | ✓ | — | — |
| System | ✓ | ✓ | — | — |

---

## Managing User Roles

### Promoting a User

Only `super_admin` and `admin` can promote users.

#### Via SQL (Supabase Dashboard)

```sql
-- Promote a user to researcher
SELECT public.admin_promote_user('user-uuid-here', 'researcher');

-- Promote to admin
SELECT public.admin_promote_user('user-uuid-here', 'admin');
```

#### Via Supabase Dashboard

1. Go to Authentication → Users
2. Find the user
3. Click Edit
4. Under User Metadata, set `role` to the desired value
5. Save

### Available Roles

| Role | Description |
|------|-------------|
| `super_admin` | Full platform access. Can manage users and all data. |
| `admin` | Can view all data. Can promote users to researcher/analyst/viewer. |
| `researcher` | Read-only access to all sessions and surveys. |
| `user` | Can manage own data only. |
| `guest` | Anonymous user. No persistent data. |

### Bootstrap Function

If no super admin exists, you can use the bootstrap function:

```sql
-- First, create a user via Supabase Auth, then:
SELECT public.bootstrap_super_admin('user-uuid-here');
```

This will fail if a super admin already exists.

---

## Viewing Data

### Sessions Dashboard

- View all measurement sessions across all users
- Filter by date range, device type, status
- See reaction time distributions and scientific metrics

### Users Dashboard

- See user registration trends
- View device diversity
- Analyze demographic distributions

### Scientific Dashboard

- Aggregate reaction time statistics
- View consistency and fatigue metrics across the population
- Identify trends and anomalies

---

## Exporting Data

1. Go to Research Console
2. Select the relevant dashboard
3. Click **Export**
4. Choose format: CSV, JSON, or Scientific (anonymized)
5. Download the file

### Export Formats

| Format | Contents | Use Case |
|--------|----------|----------|
| CSV | Raw data table | Spreadsheet analysis |
| JSON | Structured data | Programmatic analysis |
| Scientific | Anonymized, calibrated data | Publication-ready research |

---

## Security Notes

### RLS (Row Level Security)

- All database tables have RLS enabled
- Users can only access their own data
- Admins can access all data via RLS policies
- The client cannot bypass RLS — it's enforced at the database level

### Role Elevation Prevention

- Roles are stored in `user_metadata` in Supabase Auth
- Role changes require the `admin_promote_user()` function
- This function checks that the caller is an admin/super_admin
- The bootstrap function can only be called once

### Best Practices

1. **Never share super admin credentials**
2. **Use strong passwords** (minimum 12 characters recommended)
3. **Limit admin accounts** — only create accounts for people who need admin access
4. **Review user roles regularly** — demote users who no longer need admin access
5. **Monitor the System dashboard** — check for unusual activity
6. **Keep Supabase keys secure** — never commit `VITE_SUPABASE_ANON_KEY` to version control

### Environment Variables

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

These are public (anon) keys safe for client-side use. The RLS policies enforce access control.
