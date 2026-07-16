# Chapter 15: Privacy & Compliance

## 15.1 Privacy & Compliance Philosophy

The FOCUS platform handles user data with the highest degree of care. Every feature, every database column, every analytics event, and every third-party integration is evaluated against a strict privacy framework before it ships. The platform does not treat privacy as a checklist to complete before launch—it treats it as an architectural constraint that shapes every engineering decision.

The core principles governing privacy and compliance across the entire FOCUS platform:

1. **Privacy by design.** Privacy is not bolted on after the fact. Every new feature begins with a privacy impact assessment. If a feature cannot be implemented in a privacy-preserving way, it is not implemented. Engineering teams do not have the authority to override privacy requirements for the sake of feature velocity.

2. **Data minimization.** The platform collects only the data it needs to deliver its core functionality. Every data field in the database has a documented justification. If a field cannot be tied to a specific, legitimate purpose, it does not exist. "We might need it someday" is not a justification.

3. **Purpose limitation.** Data collected for one purpose is never repurposed without explicit user consent. Game calibration data is used for calibration. Analytics data is used for product improvement. These boundaries are enforced at the application layer, the database layer, and the policy layer.

4. **User control.** Users own their data. They can access it, export it, correct it, and delete it. The platform provides self-service tools for every one of these rights. Users do not need to contact support or wait for manual processing—their requests are fulfilled automatically through the application.

5. **Transparency.** The privacy policy is written in plain language. It explains what data is collected, why it is collected, how long it is retained, and who has access. Legal jargon is avoided. The policy is versioned and changes are communicated to users proactively.

6. **Defense in depth.** No single control is trusted to protect user data. Encryption, access controls, audit logging, data minimization, and retention policies work together as layers. Compromise of one layer does not expose user data.

---

## 15.2 GDPR Compliance (European Union)

The General Data Protection Regulation (GDPR) is the most comprehensive data protection regulation in the world. The FOCUS platform treats GDPR compliance as the baseline for all global privacy practices. Every GDPR requirement is implemented regardless of whether the platform has users in the EU—if the platform meets GDPR standards, it exceeds the requirements of most other jurisdictions.

### 15.2.1 Legal Basis for Processing

The FOCUS platform relies on three legal bases for processing personal data under GDPR Article 6:

**Consent (Article 6(1)(a))** is the primary legal basis for optional data processing. This includes analytics collection, marketing communications, and any non-essential tracking. Consent is obtained through explicit, affirmative actions—pre-checked boxes are never used. Consent is granular: users can consent to analytics while declining marketing. Consent is freely given: access to the core application is not contingent on consenting to analytics or marketing.

The consent implementation in the FOCUS platform follows this flow:

```typescript
interface ConsentRecord {
  user_id: string;
  consent_type: 'analytics' | 'marketing' | 'third_party_sharing';
  granted: boolean;
  timestamp: string;
  ip_address: string;
  user_agent: string;
  consent_version: string;
  withdrawn: boolean | null;
  withdrawn_at: string | null;
  consent_method: 'signup_flow' | 'settings_page' | 'modal_prompt';
}

async function recordConsent(
  userId: string,
  type: ConsentRecord['consent_type'],
  granted: boolean,
  method: ConsentRecord['consent_method']
): Promise<ConsentRecord> {
  const existingConsent = await supabase
    .from('consent_records')
    .select('*')
    .eq('user_id', userId)
    .eq('consent_type', type)
    .is('withdrawn', null)
    .single();

  if (existingConsent && existingConsent.data?.granted === granted) {
    return existingConsent.data;
  }

  const record: ConsentRecord = {
    user_id: userId,
    consent_type: type,
    granted,
    timestamp: new Date().toISOString(),
    ip_address: await getAnonymizedIp(),
    user_agent: navigator.userAgent,
    consent_version: CURRENT_CONSENT_VERSION,
    withdrawn: granted ? null : true,
    withdrawn_at: granted ? null : new Date().toISOString(),
    consent_method: method,
  };

  const { data, error } = await supabase
    .from('consent_records')
    .insert(record)
    .select()
    .single();

  if (error) {
    throw new ConsentRecordError(`Failed to record consent: ${error.message}`);
  }

  await auditLog('consent_changed', {
    user_id: userId,
    consent_type: type,
    granted,
    method,
    version: CURRENT_CONSENT_VERSION,
  });

  return data;
}
```

**Contractual Necessity (Article 6(1)(b))** is the legal basis for processing that is required to deliver the service the user signed up for. This includes: account creation and authentication data, game session data required for the scoring and progression system, device and browser information required for rendering, and subscription management data for paid features. This data is processed because the user has a contractual relationship with the platform—the user asked for the service, and this data is necessary to provide it.

**Legitimate Interest (Article 6(1)(f))** is used sparingly and only for processing that is necessary for the platform's legitimate business interests, where those interests are not overridden by the user's rights. Legitimate interest is used for: basic server logging (IP addresses in access logs), fraud prevention (detecting unusual account activity), and platform security (rate limiting, abuse detection). Every legitimate interest processing activity has a documented Legitimate Interest Assessment (LIA) that balances the platform's interests against the user's rights.

### 15.2.2 Data Processing Agreement with Supabase

The FOCUS platform uses Supabase as its primary data processor. Supabase processes user data on behalf of the platform, and a Data Processing Agreement (DPA) governs this relationship.

The DPA with Supabase includes the following provisions:

- **Processing scope.** Supabase processes data only as instructed by the FOCUS platform. Supabase does not use platform data for its own purposes, for advertising, or for analytics about the platform's users.
- **Sub-processors.** Supabase uses sub-processors (e.g., AWS for hosting, Vercel for CDN) and maintains a list of approved sub-processors. The platform must be notified of new sub-processors 30 days before they begin processing data. The platform can object to new sub-processors.
- **Security measures.** Supabase implements encryption at rest and in transit, access controls, audit logging, and regular security assessments. SOC 2 Type II compliance is maintained.
- **Data subject rights.** Supabase provides tools for the platform to fulfill data subject rights requests (access, deletion, portability). Supabase commits to responding to platform requests within 48 hours for urgent requests and 5 business days for standard requests.
- **Breach notification.** Supabase notifies the platform within 48 hours of discovering a data breach, providing all information necessary for the platform to fulfill its 72-hour notification obligation under GDPR Article 33.
- **Data residency.** The platform's Supabase project is hosted in the EU region (Frankfurt) to minimize international data transfer risks. All primary user data resides in the EU region.
- **Audit rights.** The platform has the right to audit Supabase's compliance with the DPA, either directly or through a third-party auditor, once per year.

### 15.2.3 Privacy Policy

The FOCUS platform maintains a comprehensive privacy policy that is versioned, dated, and written in plain language. The policy is hosted at `https://focusapp.com/privacy` and is accessible from within the application at any time.

The privacy policy covers:

- **Data controller identification.** The legal entity that controls user data, its contact details, and its Data Protection Officer (DPO) contact information.
- **Data collected.** A complete inventory of every data field collected, organized by category (account data, game data, analytics data, device data). Each field includes a description of what it is, why it is collected, and how long it is retained.
- **Legal basis.** For each category of processing, the specific legal basis under GDPR Article 6.
- **Data sharing.** Every third party that receives user data, the purpose of sharing, and the legal basis for sharing. Currently, this includes Supabase (infrastructure provider), and no other third parties.
- **International transfers.** If data is transferred outside the EU, the safeguards in place (Standard Contractual Clauses, adequacy decisions).
- **User rights.** A clear explanation of every right under GDPR (access, rectification, erasure, restriction, portability, objection), how to exercise each right, and the response timeline (30 days for standard requests, 72 hours for urgent requests).
- **Automated decision-making.** A statement that the platform does not use automated decision-making or profiling that produces legal effects or similarly significant effects.
- **Cookies.** A complete list of cookies used, their purpose, their duration, and whether they are essential or optional.
- **Changes to the policy.** How users are notified of changes (email notification 30 days before changes take effect, in-app notification, version history).

The privacy policy is reviewed by legal counsel quarterly and updated whenever there are changes to data processing practices.

### 15.2.4 Cookie Policy

The cookie policy is a separate document from the privacy policy, specifically addressing cookie usage. The FOCUS platform uses the following categories of cookies:

**Essential cookies** are strictly necessary for the application to function. They cannot be disabled. These include:

| Cookie | Purpose | Duration | Type |
|--------|---------|----------|------|
| `sb-access-token` | Supabase authentication session | 1 hour | HTTP-only, Secure, SameSite=Strict |
| `sb-refresh-token` | Supabase session refresh | 30 days | HTTP-only, Secure, SameSite=Strict |
| `csrf-token` | CSRF protection | Session | HTTP-only, Secure, SameSite=Strict |
| `consent-preferences` | Stores user consent choices | 365 days | Secure, SameSite=Strict |

**Analytics cookies** are optional and only set after explicit user consent. These include:

| Cookie | Purpose | Duration | Type |
|--------|---------|----------|------|
| `_focus_session_id` | Correlates analytics events within a session | 30 minutes | Secure, SameSite=Strict |
| `_focus_user_id` | Identifies returning users across sessions | 365 days | Secure, SameSite=Strict |

The cookie consent banner appears on first visit and allows users to accept or reject optional cookies. The banner is implemented as a modal overlay that blocks interaction with the page until a choice is made. Users can change their cookie preferences at any time from the application settings.

### 15.2.5 Data Minimization

Every data field in the FOCUS platform database has been reviewed against the principle of data minimization. The following decisions were made:

- **No real names.** Users provide a display name that can be a pseudonym. Real names are never required or stored.
- **No email for core functionality.** Email is collected for authentication and communication only. It is not used for analytics, not displayed to other users (unless the user opts in), and not shared with third parties.
- **No precise location.** The platform does not collect GPS coordinates, IP geolocation, or any location data beyond the Supabase region (which is determined by the user's nearest data center at connection time).
- **No biometric data.** Even though some games measure reaction times and timing patterns, this data is processed locally on the device and never sent to the server in a form that could identify an individual. Aggregated, anonymized timing data may be used for game difficulty calibration.
- **No device fingerprinting.** The platform does not collect screen resolution, installed fonts, browser plugins, or other fingerprinting vectors. Device type (mobile/tablet/desktop) is the only device metadata collected.

### 15.2.6 Purpose Limitation

Each data processing activity has a documented purpose, and data is never used beyond that purpose. The purpose limitation is enforced through:

- **Database schema design.** Data columns are organized into tables that correspond to processing purposes. Game data, analytics data, and account data are in separate tables with separate access controls.
- **Row Level Security (RLS).** Database access policies restrict which application code can access which data, based on the purpose of the access.
- **Application-layer enforcement.** Functions that process data for a specific purpose are isolated in dedicated modules. Game calibration code cannot access analytics data. Analytics code cannot access game session data.
- **Audit logging.** Every database access is logged with the purpose of the access. Purpose violations are flagged and investigated.

### 15.2.7 Storage Limitation

Data is retained only as long as necessary for its documented purpose. The platform implements automatic data lifecycle management:

- **Account data:** Retained while the account is active, plus 30 days after deletion (for recovery).
- **Game session data:** Retained while the account is active (for progression and history features). Deleted when the account is deleted.
- **Analytics data:** Raw events retained for 2 years. Aggregated data retained for 5 years. After retention, data is permanently deleted.
- **Consent records:** Retained for the lifetime of the account, plus 5 years (to prove compliance in case of regulatory inquiry).
- **Audit logs:** Retained for 1 year. After retention, logs are permanently deleted.
- **Error logs:** Retained for 90 days. After retention, logs are permanently deleted.

### 15.2.8 Data Subject Rights

The FOCUS platform implements self-service tools for every data subject right under GDPR:

**Right of Access (Article 15)**

Users can request a complete export of their data at any time from the application settings. The export includes all account data, game session data, analytics data (if the user has consented to analytics), and consent records. The export is provided in machine-readable format (JSON) within 24 hours.

```typescript
async function generateDataExport(userId: string): Promise<DataExportPackage> {
  const [profile, sessions, achievements, preferences, consentRecords] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', userId).single(),
      supabase.from('game_sessions').select('*').eq('user_id', userId),
      supabase.from('user_achievements').select('*').eq('user_id', userId),
      supabase.from('user_preferences').select('*').eq('user_id', userId).single(),
      supabase.from('consent_records').select('*').eq('user_id', userId),
    ]);

  const exportPackage: DataExportPackage = {
    export_date: new Date().toISOString(),
    user_id: userId,
    data_controller: CONTROLLER_ENTITY_NAME,
    data: {
      profile: profile.data,
      game_sessions: sessions.data,
      achievements: achievements.data,
      preferences: preferences.data,
      consent_records: consentRecords.data,
    },
  };

  await auditLog('data_export_requested', {
    user_id: userId,
    record_count: calculateRecordCount(exportPackage),
    format: 'json',
  });

  return exportPackage;
}
```

**Right to Rectification (Article 16)**

Users can update their profile data, display name, preferences, and other editable fields directly in the application. Changes are reflected immediately. For data that cannot be edited by the user (e.g., email address), users can submit a rectification request through the application, which is processed within 48 hours.

**Right to Erasure (Article 17)**

Users can delete their account from the application settings. The deletion process:

1. User initiates deletion and confirms by entering their display name (as a confirmation mechanism).
2. Account status is changed to `pending_deletion`. The user can no longer log in.
3. After a 30-day grace period (during which the user can contact support to reverse the deletion), all account data is permanently deleted.
4. Game session data, achievements, preferences, and analytics data are deleted.
5. Consent records are retained for 5 years (compliance requirement) but are anonymized (user ID replaced with a hash).
6. Server logs are anonymized (IP addresses replaced with `0.0.0.0`).
7. The deletion is logged in the audit trail.

**Right to Restriction of Processing (Article 18)**

Users can request restriction of processing. When restriction is applied, the account data is retained but not processed. The user's game sessions are not scored, analytics events are not collected, and the account is effectively frozen. Restriction can be applied from the application settings and takes effect within 24 hours.

**Right to Data Portability (Article 20)**

The data export functionality (described above) fulfills the right to data portability. The export is provided in JSON format, which is a structured, machine-readable, commonly used format. Users can import this data into another FOCUS instance or into a compatible application.

**Right to Object (Article 21)**

Users can object to specific processing activities at any time. Objection to analytics processing stops all analytics collection immediately. Objection to marketing processing removes the user from all marketing lists within 48 hours. Objection to processing based on legitimate interest is evaluated case-by-case, with the user's rights given priority.

### 15.2.9 Automated Decision-Making

The FOCUS platform does not use automated decision-making or profiling that produces legal effects or similarly significant effects on users. Game difficulty adjustment is an automated process, but it does not produce legal effects—it only affects the gameplay experience. The platform does not use automated systems to deny access, restrict features, or make decisions about subscription status.

### 15.2.10 Data Protection Officer (DPO)

The FOCUS platform designates a Data Protection Officer responsible for overseeing privacy compliance. The DPO's contact information is published in the privacy policy and is accessible from within the application. The DPO is responsible for:

- Reviewing new features for privacy implications
- Managing data subject rights requests
- Responding to regulatory inquiries
- Conducting Data Protection Impact Assessments
- Training the team on privacy practices
- Monitoring compliance with GDPR and other regulations

### 15.2.11 Data Breach Notification

In the event of a personal data breach, the FOCUS platform follows a strict notification procedure:

**Internal timeline (0–24 hours):**
- Hour 0: Breach detected or reported. Incident response team activated.
- Hour 0–4: Initial assessment. Scope, severity, and affected data determined.
- Hour 4–8: Containment measures implemented. Affected systems isolated.
- Hour 8–12: DPO notified. Legal counsel engaged.
- Hour 12–24: Detailed impact assessment completed.

**External notification (24–72 hours):**
- Within 24 hours: Supervisory authority notified (via the lead supervisory authority in the EU, which is the authority in the jurisdiction where the platform's main establishment is located).
- Within 72 hours: Full breach notification submitted to the supervisory authority, including the nature of the breach, categories and approximate number of data subjects affected, likely consequences, and measures taken or proposed.
- Without undue delay: If the breach is likely to result in a high risk to the rights and freedoms of individuals, affected users are notified directly.

### 15.2.12 Data Protection Impact Assessment (DPIA)

DPIAs are conducted for any processing activity that is likely to result in a high risk to individuals. In the FOCUS platform, DPIAs are required for:

- New features that collect new categories of personal data
- Changes to analytics collection that expand the scope of tracking
- New third-party integrations that involve data sharing
- Changes to automated decision-making systems
- Processing of data from children (COPPA compliance)
- Large-scale processing of sensitive data

The DPIA follows the template provided by the relevant supervisory authority and includes:

- Description of the processing activity and its purposes
- Assessment of the necessity and proportionality of the processing
- Assessment of the risks to the rights and freedoms of data subjects
- Measures to address the identified risks
- Consultation with the DPO
- Documentation of the decision-making process

### 15.2.13 Records of Processing Activities (ROPA)

The FOCUS platform maintains a comprehensive Record of Processing Activities (ROPA) as required by GDPR Article 30. The ROPA includes:

- The name and contact details of the data controller and the DPO
- The purposes of the processing
- A description of the categories of data subjects and personal data
- The categories of recipients to whom the personal data has been or will be disclosed
- Details of transfers to third countries and the safeguards in place
- The envisaged time limits for erasure of the different data categories
- A general description of the technical and organizational security measures

The ROPA is maintained as a living document in the engineering repository and is reviewed quarterly. It is updated whenever new processing activities are added or existing activities are modified.

---

## 15.3 COPPA Compliance (United States — Children Under 13)

The Children's Online Privacy Protection Act (COPPA) governs the collection of personal information from children under 13 in the United States. The FOCUS platform treats COPPA compliance as a non-negotiable requirement, given that the platform's engagement and gamification features may attract younger users.

### 15.3.1 Age Gate on Signup

The FOCUS platform implements a mandatory age gate during the signup process. Before completing registration, every user must provide their date of birth. The age gate is implemented as a date picker with the following behavior:

- The date picker presents day, month, and year dropdowns.
- Users under 13 cannot complete the standard signup flow.
- Users who indicate they are under 13 are presented with a COPPA consent flow.
- The age gate cannot be bypassed by changing the URL, using API calls directly, or any other technical means—the server validates the age before creating the account.

```typescript
async function validateAgeAtSignup(dateOfBirth: string): Promise<AgeValidationResult> {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  if (age < 0 || age > 120) {
    return { valid: false, reason: 'invalid_date' };
  }

  if (age < 13) {
    return {
      valid: false,
      reason: 'under_13',
      requires_parental_consent: true,
      coppa_flow: true,
    };
  }

  return { valid: true, age };
}
```

### 15.3.2 Parental Consent for Under-13 Users

If a user indicates they are under 13, the COPPA consent flow is activated. This flow:

1. **Notifies the parent.** The child's parent or guardian is informed that the child wants to create an account. The notification includes a clear description of what data will be collected, how it will be used, and the parent's rights under COPPA.

2. **Obtains verifiable parental consent.** The platform uses one of the COPPA-approved methods for obtaining verifiable parental consent:
   - **Email plus.** The parent receives an email with a consent form. The parent must click a confirmation link and complete the consent form. The consent form includes the specific data collection practices and the parent's right to review and delete the child's data.
   - **Credit card verification.** A credit card is charged a nominal amount ($0.01) and immediately refunded. This verifies that an adult is providing consent.
   - **School consent.** If the child is using the platform in a school context, the school can provide consent on behalf of the parents (under the FTC's school consent exception). The school must provide written authorization and confirm that it has obtained parental consent or that parental consent has been waived under the school exception.

3. **Limits data collection.** For child accounts, the platform collects only the minimum data necessary:
   - A username (not the child's real name)
   - A hashed password (not stored in plain text)
   - Game session data required for core functionality
   - No analytics data beyond basic session counts
   - No device fingerprinting
   - No third-party tracking
   - No social features (leaderboards, challenges, messaging)

### 15.3.3 Limited Data Collection for Children

Child accounts have significantly restricted data collection compared to adult accounts:

| Feature | Adult Account | Child Account |
|---------|---------------|---------------|
| Analytics cookies | Optional (consent) | Not used |
| Analytics events | Full event set | Session count only |
| Leaderboards | Full access | Disabled |
| Social challenges | Full access | Disabled |
| Profile display name | Free text | Free text (filtered for PII) |
| Profile picture | Optional | Not available |
| Device data | Device type only | Device type only |
| Email | Required | Not required (parent provides) |
| Third-party sharing | None | None |

### 15.3.4 No Social Features for Children

Child accounts cannot participate in social features. This includes:

- Public leaderboards (children cannot see or appear on public leaderboards)
- Social challenges (children cannot send or receive challenges from other users)
- User search (children cannot search for other users)
- Messaging (the platform does not have a messaging feature, but if one were added, child accounts would be excluded)
- Friend lists (child accounts cannot add other users as friends)

These restrictions are enforced at the database level through Row Level Security policies that check the account type before allowing access to social tables.

### 15.3.5 Parent Review and Delete Rights

Parents have the right to:

- **Review** all data collected about their child. The parent can access a dashboard that shows every piece of data the platform holds about the child, including game session history, achievements, and any other data.
- **Delete** their child's account and all associated data. The deletion is immediate and permanent—there is no 30-day grace period for child accounts, as COPPA requires prompt deletion.
- **Revoke consent.** Parents can withdraw consent at any time. If consent is withdrawn, the child's account is deactivated immediately, and all data is deleted within 48 hours.

These rights are exercised through the parent's account (which is linked to the child's account during the consent flow). The parent portal provides self-service tools for all of these rights.

### 15.3.6 School Consent Option

The FOCUS platform supports use in educational settings. Under COPPA's school consent exception, schools can provide consent on behalf of parents when the platform is used for educational purposes and not for commercial purposes. The school consent process:

1. The school administrator contacts the FOCUS platform and provides written authorization.
2. The school confirms that it has notified parents about the data collection practices.
3. The school confirms that it has obtained consent from parents or that consent has been waived under the school exception.
4. Child accounts created under school consent are flagged in the database as `school_consent: true`.
5. School consent accounts have the same data restrictions as parentally-consented accounts.
6. The school can request data deletion for all of its students at any time.

---

## 15.4 CCPA Compliance (California)

The California Consumer Privacy Act (CCPA) and its amendment, the California Privacy Rights Act (CPRA), provide California residents with specific rights regarding their personal information. The FOCUS platform implements CCPA compliance for all users, not just California residents, to simplify the platform's privacy infrastructure.

### 15.4.1 Do Not Sell My Personal Information

The FOCUS platform does not sell personal information. This is a hard commitment, not a policy that can be changed. The platform does not share personal information with third parties for monetary consideration. The "Do Not Sell" link is provided in the application footer and in the privacy policy, linking to a page where users can confirm this.

### 15.4.2 Opt-Out Mechanism

The CCPA requires businesses to provide a mechanism for users to opt out of the sale or sharing of personal information. The FOCUS platform provides:

- A "Do Not Sell or Share My Personal Information" link in the application footer
- A toggle in the application settings that disables all non-essential data processing
- An automated mechanism to honor opt-out requests within 15 business days
- Opt-out preference signals (Global Privacy Control) are respected automatically

### 15.4.3 Right to Know

California residents have the right to know what personal information is collected, used, shared, or sold. The FOCUS platform fulfills this right through:

- The comprehensive privacy policy that details all data collection
- The self-service data export tool (same as the GDPR data access right)
- A dedicated "Your Data" page in the application settings that shows exactly what data is collected and how it is used
- Response within 45 days for verifiable consumer requests (extendable by an additional 45 days with notice)

### 15.4.4 Right to Delete

California residents have the right to delete personal information. The FOCUS platform provides the same account deletion mechanism described in the GDPR section. The deletion process is identical: 30-day grace period, followed by permanent deletion of all data, with anonymization of compliance records.

### 15.4.5 Non-Discrimination

The FOCUS platform does not discriminate against users who exercise their privacy rights. Users who opt out of analytics, request data deletion, or exercise any other privacy right receive the same level of service, the same pricing, and the same feature access as users who do not exercise these rights. The platform does not offer financial incentives in exchange for personal information.

---

## 15.5 Platform Compliance

### 15.5.1 iOS (Apple App Store)

Apple imposes strict requirements on apps distributed through the App Store. The FOCUS platform complies with the following:

**App Tracking Transparency (ATT).** The FOCUS platform does not use the IDFA (Identifier for Advertisers) or any other tracking identifier. The platform does not perform cross-app tracking. As a result, the ATT framework is not triggered, and the platform does not display the ATT permission prompt. If the platform were to add tracking functionality in the future, the ATT prompt would be implemented before any tracking occurs.

**Nutrition Labels.** The App Store requires developers to disclose data collection practices in App Store privacy nutrition labels. The FOCUS platform's nutrition labels accurately reflect:

| Data Type | Used for Tracking | Linked to Identity |
|-----------|-------------------|---------------------|
| Contact Info | No | Yes (email for auth) |
| Usage Data | No | No (analytics are anonymized) |
| Diagnostics | No | No |

**In-App Purchase (IAP) Rules.** All digital goods and subscriptions are sold through Apple's In-App Purchase system. The platform does not use external payment processors for digital goods. Physical goods and services (if any) are exempt from IAP requirements. Subscription pricing, trial periods, and renewal terms are clearly disclosed before purchase.

**No Misleading Claims.** The platform does not make misleading claims about its features, data practices, or the outcomes of using the platform. All marketing claims are supported by evidence and reviewed by legal counsel.

**Data Deletion.** Apple requires that apps provide a mechanism for users to delete their account and data. The FOCUS platform provides this through the application settings, consistent with the GDPR and CCPA deletion flows described above.

### 15.5.2 Google Play Store

Google Play imposes its own set of requirements:

**Data Safety Section.** The platform accurately completes the Data Safety section in the Google Play Store, disclosing:

- Data collection practices
- Data sharing practices
- Security practices (encryption, deletion on request)
- Whether data is collected or shared
- The purpose of each data collection

**Families Policy.** If the platform targets or is likely to attract children, it must comply with Google's Families Policy. The platform implements the COPPA compliance measures described in Section 15.3 and does not include features that are prohibited in apps targeting children (e.g., personalized advertising, social features for children).

**Disclosure and Consent.** The platform provides clear disclosures about data collection before the user provides any data. Consent is obtained before data collection begins. The platform does not pre-check consent boxes.

**Data Deletion.** Google Play requires that apps provide account and data deletion. The FOCUS platform provides this through the same self-service deletion mechanism used for GDPR and CCPA compliance.

### 15.5.3 Desktop Platforms

For desktop distribution through the FOCUS platform's website and potentially through platforms like the Microsoft Store:

**Code Signing.** All desktop application binaries are code-signed with a verified certificate. Code signing ensures that users can verify the authenticity of the application and that the binary has not been tampered with. The signing certificate is managed through a Hardware Security Module (HSM) and is renewed annually.

**Auto-Update Security.** The auto-update mechanism uses the following security measures:

- Updates are delivered over HTTPS with certificate pinning
- Update manifests are signed with a dedicated key
- The application verifies the update signature before applying
- Rollback capability is maintained for every update
- Staged rollouts ensure that problematic updates are caught before affecting all users

---

## 15.6 Data Classification

The FOCUS platform classifies all data into four levels, each with specific handling rules.

### 15.6.1 Level 1: Public

Public data is data that can be freely accessed, shared, and published without restriction. Public data has no confidentiality requirements.

**Examples:**
- Application source code (open source)
- Public documentation
- Marketing materials
- Blog posts
- Public API documentation

**Handling rules:**
- Can be stored in any repository, including public repositories
- No encryption required (but encryption is acceptable)
- No access controls required
- Can be shared freely
- No audit logging required
- No retention restrictions

### 15.6.2 Level 2: Internal

Internal data is data intended for use within the FOCUS team. It is not confidential but should not be shared publicly.

**Examples:**
- Internal documentation and wikis
- Non-sensitive configuration files
- Development environment settings
- Meeting notes and project plans
- Non-sensitive analytics dashboards

**Handling rules:**
- Must be stored in internal repositories, not public repositories
- No encryption required at rest, but recommended
- Access controls: authenticated team members only
- No audit logging required (but recommended)
- Retention: follow internal retention policies
- Can be shared with contractors under NDA

### 15.6.3 Level 3: Confidential

Confidential data is sensitive data that, if disclosed, could cause harm to users or the business. This includes personal data, financial data, and security configurations.

**Examples:**
- User account data (email, profile, settings)
- Game session data linked to user accounts
- Analytics data linked to user accounts
- Source code (the application itself)
- Database schemas and migration scripts
- API keys and configuration secrets
- Internal security policies
- Business metrics and financial data

**Handling rules:**
- Must be encrypted at rest (AES-256) and in transit (TLS 1.3)
- Access controls: role-based access control (RBAC) with least privilege
- Audit logging: all access and modifications logged
- Retention: follow data retention policies (see Section 15.7)
- Cannot be shared externally without authorization
- Must be stored in approved, encrypted storage systems
- Must be included in the ROPA
- Must have documented access justification

### 15.6.4 Level 4: Restricted

Restricted data is the most sensitive classification. Unauthorized disclosure could cause severe harm to individuals or the business. This includes data subject to regulatory requirements, encryption keys, and authentication secrets.

**Examples:**
- Encryption keys and certificates
- Database credentials and API keys
- Authentication tokens and session secrets
- Payment processing data (handled by Stripe, not stored directly)
- Parental consent records for COPPA
- Consent records under GDPR
- Data subject rights requests
- Security incident details
- DPIA documentation

**Handling rules:**
- Must be encrypted at rest (AES-256) and in transit (TLS 1.3)
- Access controls: strict least privilege, named individuals only
- Audit logging: all access logged in real-time with alerts for unusual access patterns
- Retention: follow strict retention policies with verified deletion
- Cannot be shared externally under any circumstances without explicit executive approval
- Must be stored in Supabase Vault (for secrets) or encrypted databases (for structured data)
- Must be included in the ROPA with detailed processing justification
- Access reviews conducted quarterly
- Breach involving restricted data triggers immediate incident response and 72-hour notification

---

## 15.7 Encryption

### 15.7.1 Encryption at Rest

All data at rest is encrypted using AES-256 (Advanced Encryption Standard with 256-bit keys). This applies to:

- **Database storage.** Supabase encrypts all database storage at rest using AES-256. This includes PostgreSQL tables, indexes, and WAL files.
- **File storage.** Supabase Storage encrypts all uploaded files at rest using AES-256.
- **Backup storage.** All database backups are encrypted using AES-256 before storage.
- **Log storage.** Application logs and audit logs are encrypted at rest.

### 15.7.2 Encryption in Transit

All data in transit is encrypted using TLS 1.3 (Transport Layer Security). This applies to:

- **Client-server communication.** All HTTPS connections use TLS 1.3 with strong cipher suites. TLS 1.0 and 1.1 are disabled. Certificate pinning is implemented for mobile and desktop applications.
- **Server-to-server communication.** All internal communication between application servers and Supabase uses TLS 1.3.
- **WebSocket connections.** Real-time connections use WSS (WebSocket Secure) with TLS 1.3.

The TLS configuration is:

```
TLS 1.3 only
Cipher suites:
  - TLS_AES_256_GCM_SHA384
  - TLS_CHACHA20_POLY1305_SHA256
  - TLS_AES_128_GCM_SHA256
Certificate: RSA 2048-bit or ECDSA P-256
HSTS: max-age=31536000; includeSubDomains; preload
```

### 15.7.3 Application-Level Encryption

Sensitive data fields are encrypted at the application level before being stored in the database. This provides defense-in-depth: even if database access controls are compromised, the data remains encrypted.

Application-level encryption is applied to:

- **Email addresses.** Email addresses are encrypted before storage using AES-256-GCM. The encryption key is stored in Supabase Vault and is never exposed to the application layer.
- **Parental consent records.** COPPA consent records are encrypted at the application level.
- **Sensitive user preferences.** Any preference that reveals personal information about the user.

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';

async function encryptSensitiveField(plaintext: string): Promise<EncryptedField> {
  const key = await getEncryptionKey('sensitive_fields');
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: 16,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    auth_tag: authTag.toString('base64'),
    algorithm: ALGORITHM,
    key_version: await getCurrentKeyVersion('sensitive_fields'),
  };
}

async function decryptSensitiveField(encrypted: EncryptedField): Promise<string> {
  const key = await getEncryptionKey('sensitive_fields', encrypted.key_version);
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(encrypted.iv, 'base64'),
    { authTagLength: 16 }
  );
  decipher.setAuthTag(Buffer.from(encrypted.auth_tag, 'base64'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted.ciphertext, 'base64')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}
```

### 15.7.4 Key Management

Encryption keys are managed through Supabase Vault. The key management process:

1. **Key generation.** Keys are generated using cryptographically secure random number generators. AES-256 keys are 256 bits. RSA keys are 2048 bits minimum.
2. **Key storage.** Keys are stored in Supabase Vault, which provides HSM-backed key storage. Keys are never stored in application code, environment variables, or configuration files.
3. **Key access.** Keys are accessed through the Supabase Vault API with strict access controls. Only the application server can access keys, and access is logged.
4. **Key rotation.** Keys are rotated every 90 days. During rotation, a new key version is created, and all new encryptions use the new key. Existing encrypted data is decrypted with the old key and re-encrypted with the new key in a background job. The old key is retained until all data re-encryption is complete, then it is destroyed.
5. **Key destruction.** When a key is no longer needed (after re-encryption is complete), it is destroyed through the Supabase Vault API. Destruction is logged and cannot be undone.

```typescript
async function rotateEncryptionKey(keyName: string): Promise<RotationResult> {
  const currentVersion = await getCurrentKeyVersion(keyName);
  const newVersion = currentVersion + 1;

  await auditLog('key_rotation_started', {
    key_name: keyName,
    from_version: currentVersion,
    to_version: newVersion,
  });

  await supabase.vault.createKey(keyName, newVersion);

  const affectedRecords = await reEncryptDataWithNewKey(keyName, currentVersion, newVersion);

  await supabase.vault.destroyKey(keyName, currentVersion);

  await auditLog('key_rotation_completed', {
    key_name: keyName,
    from_version: currentVersion,
    to_version: newVersion,
    records_re_encrypted: affectedRecords,
  });

  return { success: true, records_re_encrypted: affectedRecords };
}
```

---

## 15.8 Audit Logging

All access to and modifications of user data are logged in an append-only audit log. The audit log provides a complete, tamper-evident record of every interaction with sensitive data.

### 15.8.1 What Is Logged

Every audit log entry includes:

| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | string | ISO 8601 timestamp of the event |
| `event_type` | string | Category of the event (e.g., `data_access`, `data_modification`, `data_deletion`) |
| `actor_id` | string | ID of the user or system performing the action |
| `actor_type` | enum | `user`, `system`, `admin`, `support` |
| `resource_type` | string | Type of resource accessed (e.g., `profile`, `game_session`, `consent_record`) |
| `resource_id` | string | ID of the specific resource |
| `action` | string | Specific action (e.g., `read`, `update`, `delete`, `export`) |
| `details` | jsonb | Additional details about the action |
| `ip_address` | string | IP address of the actor (anonymized in logs older than 90 days) |
| `user_agent` | string | User agent of the actor |
| `request_id` | string | Unique request identifier for correlation |

### 15.8.2 Append-Only Design

The audit log is append-only. No audit log entry can be modified or deleted. This is enforced at the database level through PostgreSQL triggers:

```sql
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are append-only and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_immutable
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_modification();
```

### 15.8.3 Retention

Audit logs are retained for 1 year. After 1 year, logs are permanently deleted. This retention period balances the need for compliance evidence with the principle of data minimization. The deletion is automated and verified through a monthly audit.

---

## 15.9 Data Retention

The FOCUS platform implements specific retention periods for each category of data:

| Data Category | Retention Period | Deletion Method | Justification |
|---------------|-----------------|-----------------|---------------|
| Active account data | While account is active | Manual deletion or account deletion request | Necessary for service delivery |
| Deleted account data | 30 days after deletion request | Automatic permanent deletion | Grace period for account recovery |
| Child account data | Immediately on parent request | Automatic permanent deletion | COPPA compliance |
| Game session data | While account is active | Automatic deletion when account is deleted | Service delivery and progression |
| Analytics raw events | 2 years | Automatic deletion | Product improvement |
| Analytics aggregated data | 5 years | Automatic deletion | Long-term trend analysis |
| Session data (cookies) | 30 days | Automatic expiration | Session management |
| Audit logs | 1 year | Automatic deletion | Compliance evidence |
| Error logs | 90 days | Automatic deletion | Debugging |
| Database backups | 30 days | Automatic expiration | Disaster recovery |
| Consent records | Account lifetime + 5 years | Anonymization after 5 years | Compliance evidence |
| Encrypted key versions | Until re-encryption complete, then destroyed | Manual destruction via Vault | Security |

---

## 15.10 International Data Transfers

### 15.10.1 Supabase Regions

The FOCUS platform's primary Supabase instance is hosted in the EU (Frankfurt, Germany). All primary user data resides in the EU. This eliminates most international data transfer concerns.

The following regions are available and their status:

| Region | Status | Use Case |
|--------|--------|----------|
| EU (Frankfurt) | Primary | All user data |
| US (Virginia) | Not used | N/A |
| Asia (Singapore) | Available | CDN edge nodes only (no user data) |
| South America (São Paulo) | Available | CDN edge nodes only (no user data) |

### 15.10.2 Data Residency

User data never leaves the EU region. The only data that crosses borders is:

- CDN-cached static assets (JavaScript, CSS, images) which contain no user data
- DNS resolution queries (which contain no user data beyond the domain name)

### 15.10.3 Standard Contractual Clauses (SCCs)

If the platform were to expand to non-EU regions, Standard Contractual Clauses (SCCs) would be implemented with any sub-processor that processes data outside the EU. The SCCs follow the European Commission's standard template and include:

- The specific data being transferred
- The purpose of the transfer
- The technical and organizational measures in place
- The sub-processor's obligations regarding data protection
- The data subject's rights and remedies

The platform currently does not transfer personal data outside the EU, but SCCs are prepared and ready for implementation if international expansion requires it.
