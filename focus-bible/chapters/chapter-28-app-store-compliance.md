# Chapter 28: App Store Compliance

## Overview

This chapter establishes the complete compliance framework for distributing the FOCUS application across all target platforms: Apple App Store, Google Play Store, Microsoft Store, and direct desktop distribution channels. Every release of FOCUS must satisfy the requirements documented herein before submission. No build may be pushed to any store without a signed-off compliance review. The compliance process is not a formality; it is a gating function that protects the FOCUS user base, preserves our store developer accounts, and ensures legal adherence across every jurisdiction where the application is distributed.

The FOCUS application collects behavioral and biometric data for the purpose of attention training and focus enhancement. This data sensitivity profile places us in a category that requires heightened diligence on privacy disclosures, consent mechanisms, data handling transparency, and content rating accuracy. Failure to comply results in rejection, account suspension, or removal from distribution entirely. This chapter exists to ensure none of those outcomes occur.

---

## Section 1: Apple App Store Compliance

### 1.1 Review Guidelines Compliance

Apple maintains a living document titled "App Store Review Guidelines" that governs every application submitted for distribution on the iOS, iPadOS, macOS, watchOS, and tvOS App Stores. The FOCUS application must comply with every applicable section. The following subsections address each guideline area that directly impacts FOCUS development and submission.

**Section 1.1.1 — The Basics.** Every FOCUS build submitted must be a complete, functional application. Incomplete builds, placeholder content, and non-functional demo modes are grounds for immediate rejection. The application must function as described in its metadata without requiring additional configuration beyond what a standard user would encounter. The app must not install or launch other code, including other applications, plug-ins, or extensions, unless explicitly permitted and disclosed.

**Section 1.1.2 — Metadata.** All metadata submitted with FOCUS—including the app name, subtitle, description, keywords, screenshots, app previews, categories, and ratings—must accurately represent the application. The app description must not contain hidden or undocumented features. Marketing language must not make medical claims without appropriate disclaimers. Keywords must not reference other apps, trademarks, or competitive products in a misleading manner. The app name must be unique within our developer account namespace and must not exceed 30 characters. The subtitle must not exceed 30 characters. The promotional text may be updated without a new build submission but must remain truthful.

**Section 1.1.3 — Fees and Business.** FOCUS must use Apple's In-App Purchase system exclusively for any digital goods or services sold within the application. Apple collects a commission of 30% on all in-app purchases for the first year of a subscription, reducing to 15% after the first year for auto-renewing subscriptions. FOCUS qualifies for the App Store Small Business Program if annual qualifying revenue falls below $1 million USD, which reduces the commission rate to 15% from the first year onward. The development team must verify eligibility for the Small Business Program annually by submitting the required Apple Developer Program enrollment update. Revenue reporting must be reconciled against Apple's Commission Reporting API or App Store Connect financial reports.

**Section 1.1.4 — Design and Human Interface Guidelines.** FOCUS must adhere to Apple's Human Interface Guidelines across all platform targets. This includes proper use of navigation patterns, typography, color systems, and interaction models. The application must support Dynamic Type for all user-facing text. It must respect the user's preferred accessibility settings including Bold Text, Reduce Motion, and Invert Colors. The application must provide appropriate haptic feedback where interaction patterns warrant it. All touch targets must meet the minimum 44x44 point requirement. The application must adapt to all supported device sizes and orientations. Split View and Slide Over must be supported on iPad. The application must properly handle the display cutout on devices with notches or Dynamic Island.

### 1.2 Human Interface Guidelines Compliance

Apple's Human Interface Guidelines are not optional suggestions; they represent the baseline contract between FOCUS and the platform. The following specific HIG areas require explicit compliance verification before each submission.

**Navigation.** FOCUS must use a navigation paradigm appropriate to the platform. On iOS, this means a tab bar or sidebar for primary navigation, with navigation controllers for hierarchical drill-down. The application must not create custom navigation patterns that conflict with system conventions. Back navigation must always be available via the standard left-swipe gesture and the back button. Modal presentations must include an explicit dismissal affordance.

**Typography.** All text in FOCUS must use the system font (San Francisco) unless a specific design requirement mandates an alternative font with explicit justification documented in the design system. Text must be rendered at the minimum 11pt size for body content. The application must respond to Dynamic Type changes by relayouting all text-containing views without truncation or overlap.

**Color and Appearance.** FOCUS must support both Light Mode and Dark Mode natively. The application must not force a specific appearance mode. All colors must be defined as named colors in the Asset Catalog to support automatic adaptation. Contrast ratios between text and background must meet WCAG 2.1 AA standards at minimum, with AAA targeted wherever possible.

**Haptics.** The application must use UIImpactFeedbackGenerator and UISelectionFeedbackGenerator for appropriate user interactions. Haptic feedback must never be the sole means of conveying information. Users must be able to disable haptic feedback via a settings toggle.

### 1.3 Privacy Nutrition Labels

Starting December 2020, Apple requires all applications to declare data collection and usage practices in a standardized privacy nutrition label format. FOCUS must provide an accurate and complete nutrition label covering every category of data the application collects, uses, stores, or shares.

The following data categories apply to FOCUS and must be declared:

**Name.** Collected if the user provides it during onboarding. Used for personalization within the application. Not linked to the user's identity for tracking purposes. Not shared with third parties.

**Email Address.** Collected during account creation. Used for account management, password recovery, and optional product communications. Linked to user identity. Not shared with third parties. Stored encrypted at rest on our servers.

**User Content.** Includes journal entries, focus session notes, custom routines, and any other content generated by the user. Used for providing the core service. Linked to user identity. Not shared with third parties. Stored encrypted at rest.

**Usage Data.** Includes focus session durations, completion rates, routine selections, feature engagement metrics, and interaction patterns. Used for product improvement and personalization. Linked to user identity only when the user has opted in to analytics. Shared with our analytics provider (documented in Section 5) under a data processing agreement. Stored encrypted.

**Diagnostics.** Includes crash logs, performance metrics, and error reports. Used for debugging and performance improvement. Not linked to user identity unless the user explicitly provides consent. Shared with our crash reporting provider under a data processing agreement. Stored encrypted.

**Health and Fitness Data.** FOCUS does not collect data classified as HealthKit data or medical records. FOCUS provides attention training exercises and focus session timing, which are wellness tools, not medical devices. This distinction must be maintained in all marketing, metadata, and privacy disclosures. If FOCUS integrates with Apple Health in the future, the HealthKit integration guidelines must be reviewed and complied with before any HealthKit data is read or written.

**Biometric Data.** FOCUS does not collect biometric data for identification purposes. If FOCUS uses device biometric sensors for any purpose, this must be declared in the nutrition label and the user must provide explicit consent.

**Location Data.** FOCUS does not collect precise or approximate location data. This must be declared as "Data Not Collected" in the location category.

**Contacts.** FOCUS does not access the user's contacts. This must be declared as "Data Not Collected."

**Photos.** FOCUS does not access the user's photo library. This must be declared as "Data Not Collected."

**Microphone.** FOCUS does not access the microphone. This must be declared as "Data Not Collected."

**Camera.** FOCUS does not access the camera. This must be declared as "Data Not Collected."

**Contacts.** FOCUS does not access user contacts. This must be declared as "Data Not Collected."

**Search History.** FOCUS does not collect search history. This must be declared as "Data Not Collected."

**Identifiers.** FOCUS uses the device identifier for analytics and crash reporting purposes. This is linked to user identity within our systems. Not shared externally.

**Purchase History.** FOCUS accesses purchase history solely through StoreKit for the purpose of validating subscriptions and restoring purchases. This data is not transmitted to our servers.

Each nutrition label entry must be reviewed quarterly or upon any change to data collection practices, whichever occurs first. The compliance lead must maintain a living document that maps each data category to the specific code paths, API calls, and server endpoints that handle that data category. This mapping document is the audit trail for nutrition label accuracy.

### 1.4 App Tracking Transparency Framework

Apple's App Tracking Transparency framework requires explicit user consent before any application may track users across apps and websites owned by other companies. FOCUS must integrate the ATT framework and request permission using the `ATTrackingManager.requestTrackingAuthorization` method before performing any tracking activity.

FOCUS tracks user behavior only within its own application for analytics and product improvement purposes. If FOCUS shares any identifier—including the Identifier for Advertisers, the Identifier for Vendors, or any derived identifier—with a third party for cross-app or cross-website tracking, the ATT prompt must be presented before any such sharing occurs.

The ATT prompt must include a clear and specific usage description string that explains why FOCUS requests permission to track. The usage description must be localized for every language that FOCUS supports. The description must be truthful and specific—generic descriptions like "this identifier will be used to improve your experience" are insufficient. An example acceptable description: "FOCUS uses this information to measure how often focus sessions lead to continued engagement, helping us improve the app."

If the user denies ATT permission, FOCUS must not attempt to circumvent this decision. FUSIC must not use fingerprinting, probabilistic identification, or any other technique to infer a user's identity for tracking purposes when ATT permission has been denied.

If FOCUS determines that it does not perform any cross-app or cross-website tracking, it may declare `NSUserTrackingUsageDescription` as not required. However, this determination must be made at the engineering level and documented, not assumed. Any SDK or third-party library included in the FOCUS binary that performs tracking must be accounted for.

### 1.5 In-App Purchase Rules

Apple mandates that all digital goods and services consumed within iOS and iPadOS applications must be sold through Apple's In-App Purchase system. This means FOCUS cannot sell subscriptions, premium features, or any digital content through external means and then unlock that content within the iOS application without Apple receiving its commission.

**Subscription Structure.** FOCUS offers a subscription model with the following tiers:
- Monthly subscription at the base price point
- Annual subscription at a discounted annual price
- Lifetime purchase as a one-time IAP

Each subscription tier must be configured in App Store Connect with the correct subscription group, pricing, and duration. Free trials must be configured as a subscription offer with the appropriate introductory pricing type. Free trials for subscriptions may be offered for up to 3 days using Apple's introductory pricing for auto-renewable subscriptions, or longer durations may be offered as a promotional offer.

**Receipt Validation.** FOCUS must validate receipts on the server side using Apple's `/verifyReceipt` endpoint or the App Store Server API. Client-side receipt validation is not sufficient for security-sensitive operations such as unlocking premium features. The receipt validation logic must handle the following scenarios: initial purchase, subscription renewal, subscription expiration, subscription grace period, billing retry period, and refund.

**Price Localization.** All subscription prices must be localized for each App Store territory where FOCUS is available. Prices must use the correct currency and tax-inclusive pricing as required by each territory. Apple provides price tiers that map to local currency amounts; FOCUS must use the appropriate tier for each territory.

**Family Sharing.** FOCUS must support Family Sharing for subscription purchases if Family Sharing is enabled in App Store Connect. When Family Sharing is enabled, up to six family members may share a single FOCUS subscription. The subscription sharing must be handled through StoreKit's `paymentQueue.updatedTransactions` listener without any additional implementation required from FOCUS.

### 1.6 Account Deletion Requirement

Apple's App Store Review Guidelines require that any application that supports account creation must also provide a mechanism for account deletion within the application. This requirement applies to FOCUS because FOCUS supports user account creation for syncing and data persistence.

FOCUS must provide account deletion functionality accessible via Settings > Account > Delete Account. The deletion flow must:

1. Require the user to authenticate (re-enter password or use biometric confirmation) before deletion proceeds.
2. Present a clear and prominent warning explaining that account deletion is permanent and cannot be undone, and that all associated data will be permanently removed from FOCUS servers.
3. Allow the user to download or export their data before deletion by providing a link to the data export feature.
4. Process the deletion request and provide confirmation to the user.
5. Retain the minimum data required by law for the minimum retention period required by law, then permanently purge all remaining data.
6. Notify the user via email that their account has been deleted and that data will be permanently purged after the retention period.

The deletion endpoint on the server must remove all personally identifiable information immediately upon request. Anonymized usage data that cannot be re-linked to the deleted account may be retained indefinitely. The deletion process must complete within 30 days of the request and must trigger confirmation emails at the time of initiation and at the time of final data purge.

The deletion mechanism must be accessible without requiring the user to contact support, without requiring the user to navigate to a website, and without requiring the user to send an email. It must be a self-service mechanism within the application itself.

### 1.7 Content Rating

FOCUS must be rated 4+ on the App Store. The application contains no objectionable content including no violence, no sexual content, no profanity, no mature or suggestive themes, no alcohol or tobacco use, no gambling, and no real-world money gambling. The content rating questionnaire in App Store Connect must be completed accurately to produce the 4+ rating. If the rating calculation produces a higher rating, the questionnaire responses must be reviewed and corrected.

### 1.8 Sign in with Apple

Apple requires that any application offering third-party social login options (such as Sign in with Google or Sign in with Facebook) must also offer Sign in with Apple as an equivalent option. FOCUS supports Sign in with Google and must therefore also support Sign in with Apple.

Sign in with Apple must be implemented using the ASAuthorizationAppleIDProvider class. The implementation must support the full Sign in with Apple flow including the email and name sharing selection, the system-provided face or touch ID authentication, and the credential state checking on each app launch.

If a user chooses to share their email with FOCUS via Sign in with Apple, that email must be treated as any other email collected through account creation. If a user chooses to hide their email, FOCUS must generate and use the relay email address provided by Apple and must not attempt to determine the user's real email address.

Sign in with Apple must be displayed prominently and with equal prominence to any other sign-in options. It must not be placed behind a "More options" menu or in a less visible position than competing sign-in methods.

### 1.9 Full Submission Checklist

The following checklist must be completed and signed off by the designated compliance lead before any FOCUS build is submitted to App Store Connect for review.

**Account and Access:**
- [ ] App Store Connect account is active and in good standing
- [ ] All team members have appropriate roles and permissions
- [ ] The Apple Developer Program enrollment is current
- [ ] The certificate and provisioning profile are valid and not expiring within 90 days
- [ ] The App Store Connect API key is configured and has not been revoked

**Application Binary:**
- [ ] The build is archived using the Release configuration
- [ ] The build is signed with the correct distribution certificate
- [ ] The build is uploaded via Xcode Organizer or the `altool` command
- [ ] The build has passed Apple's automated processing checks
- [ ] The build has been processed and is available in App Store Connect

**Metadata:**
- [ ] App name is correct and does not exceed 30 characters
- [ ] Subtitle is correct and does not exceed 30 characters
- [ ] Description is complete, accurate, and free of placeholder text
- [ ] Keywords are relevant, not misleading, and do not reference other apps
- [ ] Promotional text is current and accurate
- [ ] Support URL is live, accessible, and contains working contact information
- [ ] Privacy Policy URL is live, accessible, and matches the privacy label declarations
- [ ] Terms of Service URL is live, accessible, and covers all subscription terms
- [ ] Marketing URL (if provided) is live and accurate
- [ ] Categories are correctly assigned (primary and secondary)
- [ ] Content rights are affirmed (the app does not contain third-party content requiring rights)

**Screenshots and Previews:**
- [ ] Screenshots are provided for every required device size
- [ ] Screenshots are current and represent the latest version of the application
- [ ] Screenshots contain no placeholder text, lorem ipsum, or UI artifacts
- [ ] App previews are provided for at least one device size (recommended)
- [ ] Previews are no longer than 30 seconds and represent actual app functionality
- [ ] No screenshots or previews contain images of other people's devices or data

**Privacy:**
- [ ] Privacy nutrition label is complete and accurate
- [ ] `NSUserTrackingUsageDescription` is provided if tracking is performed
- [ ] `NSFaceIDUsageDescription` is provided if Face ID is used
- [ ] All required privacy manifest keys (`NSPrivacyAccessedAPITypes`) are declared
- [ ] The privacy policy is compliant with GDPR, CCPA, and other applicable regulations
- [ ] ATT prompt is presented at the appropriate time before any tracking occurs

**Technical:**
- [ ] The application launches without crashes
- [ ] All core features are functional
- [ ] The application is accessible without requiring login for initial content viewing
- [ ] The application handles all device orientations correctly
- [ ] The application responds to Dynamic Type changes
- [ ] The application respects the Reduce Motion accessibility setting
- [ ] The application handles VoiceOver and Switch Control navigation correctly
- [ ] The application does not use private APIs or undocumented system frameworks
- [ ] The application does not crash, hang, or display unresponsive behavior

**Demo Account:**
- [ ] A demo account with full access to all features is provided in the notes for review
- [ ] The demo account credentials are correct and working
- [ ] The demo account has an active subscription that does not expire during the review period
- [ ] The demo account data includes representative content across all features

### 1.10 Common Rejection Reasons and Prevention

The following are the most frequent rejection reasons for applications similar to FOCUS. Each must be proactively addressed in every submission.

**Guideline 2.1 — Performance: App Completeness.** The application crashes, exhibits undefined behavior, or contains placeholder content. Prevention: Run the full automated test suite against the release build. Conduct a manual smoke test of every major feature path on the target device before submission. No build containing any `TODO`, `FIXME`, `placeholder`, or `lorem ipsum` may be submitted.

**Guideline 2.3.3 — Performance: Accurate Metadata.** Screenshots or previews do not match the submitted build. Prevention: Generate screenshots from the exact build being submitted. Do not use screenshots from a previous version or a design mockup.

**Guideline 3.1.1 — Business: In-App Purchase.** The application sells digital goods or services outside of Apple's In-App Purchase system. Prevention: Audit every revenue-generating code path. Ensure no payment flow bypasses StoreKit. Ensure no external payment link is present in the iOS application.

**Guideline 4.0 — Design: Minimum Functionality.** The application is a wrapper around a website, provides insufficient utility, or is essentially a static content display. Prevention: FOCUS is a native application with substantial offline functionality and user interaction. This guideline is unlikely to apply, but the submission must emphasize the native functionality in the app description.

**Guideline 4.2 — Design: Minimum Functionality.** The application's primary purpose is marketing or advertising rather than providing utility to the user. Prevention: FOCUS provides genuine utility through attention training, focus session management, and productivity tools. The submission must clearly articulate this utility.

**Guideline 5.1.1 — Legal: Data Collection and Storage.** The privacy policy does not adequately describe data collection practices, or the application collects data without appropriate disclosure. Prevention: The privacy nutrition label and privacy policy must be reviewed for consistency before every submission. Any change to data collection practices must trigger a review of both documents.

**Guideline 5.1.2 — Legal: Data Use and Sharing.** The application shares data with third parties without disclosure or without appropriate consent mechanisms. Prevention: Maintain a complete inventory of all third-party SDKs and the data they access. Ensure every data-sharing relationship is disclosed in the privacy policy and nutrition label.

**Rejection Response Protocol.** When a rejection occurs, the compliance lead must acknowledge the rejection within 4 hours during business hours. A triage call must be scheduled within 24 hours. A fix must be submitted within 48 hours unless the rejection requires substantive design or engineering work, in which case a revised timeline must be communicated to the App Review team via the Resolution Center within 48 hours.

---

## Section 2: Google Play Store Compliance

### 2.1 Data Safety Section

Google Play requires all applications to complete the Data Safety section, which describes how the application collects, uses, and shares user data. This section appears on the application's store listing and is separate from the privacy policy.

The Data Safety section requires declaration of the following for each data type collected:

**Data Type.** Every data type collected by FOCUS must be listed: email address, name, user content, usage data, device identifiers, and crash logs.

**Collection Purpose.** Each data type must be tagged with its purpose: app functionality, analytics, personalization, advertising, or fraud prevention.

**Sharing.** Each data type must declare whether it is shared with third parties, and if so, the identity and purpose of each third party.

**Security Practices.** The Data Safety section requires declaration of whether data is encrypted in transit, whether users can request data deletion, and whether the app follows the Families Policy.

**Data Type: Email Address.** Collected for account management. Not shared. Encrypted in transit and at rest. Users can request deletion via the in-app account deletion feature.

**Data Type: Name.** Collected for personalization. Not shared. Encrypted in transit and at rest. Users can request deletion via the in-app account deletion feature.

**Data Type: User Content.** Collected for app functionality. Not shared. Encrypted in transit and at rest. Users can request deletion via the in-app account deletion feature and the data export feature.

**Data Type: Usage Data.** Collected for analytics. Shared with analytics provider. Encrypted in transit. Users can opt out of analytics collection.

**Data Type: Device Identifiers.** Collected for analytics. Shared with analytics provider. Not encrypted at rest. Users can opt out of analytics collection.

**Data Type: Crash Logs.** Collected for debugging. Shared with crash reporting provider. Encrypted in transit. Users can opt out of crash reporting.

The Data Safety section must be reviewed and updated whenever data collection practices change. Google performs periodic audits of Data Safety declarations and may remove applications that contain inaccurate declarations.

### 2.2 Families Policy Compliance

If FOCUS is directed at children under 13 or is designed to appeal to children under 13, the Google Play Families Policy applies. FOCUS is not directed at children under 13 and should not be listed in the Designed for Families program. However, FOCUS must still comply with the Families Policy if it is used by or accessible to children under 13.

If FOCUS is used in a family context, the following requirements apply:

1. FOCUS must not collect personal information from children under 13 without verifiable parental consent.
2. FOCUS must not display behaviorally targeted advertising to children under 13.
3. FOCUS must provide parents with the ability to review, delete, and revoke consent for data collected from their children.
4. FOCUS must implement persistent parental consent mechanisms where required.

If FOCUS determines through user research or analytics that a significant portion of its user base is under 13, a full COPPA compliance review must be initiated immediately.

### 2.3 Prominent Disclosure and Consent

Google Play requires that applications provide prominent disclosure and obtain consent before collecting personal or sensitive user data. "Prominent disclosure" means a disclosure that:

1. Is presented within the application itself, not solely in the privacy policy or store listing.
2. Explains what data will be collected, how it will be used, and why the data collection is necessary for the app's core functionality.
3. Is displayed in a manner that requires affirmative user action to consent (e.g., an "Accept" or "I Agree" button).
4. Cannot be bypassed or dismissed without providing consent.

For FOCUS, the prominent disclosure must be presented during the onboarding flow, before any data collection occurs. The disclosure must cover all personal and sensitive data types declared in the Data Safety section.

The consent flow must:
1. Present the disclosure on a dedicated screen with clear, legible text.
2. Include an affirmative consent action (tap to agree).
3. Include a mechanism to decline or defer consent, but make clear that declining may limit functionality.
4. Store the user's consent decision with a timestamp for audit purposes.
5. Re-present the disclosure if material changes are made to the data collection practices.

### 2.4 Data Deletion Requirements

Google Play requires that applications allow users to request deletion of their data. FOCUS must provide a mechanism for data deletion that is:

1. Accessible from within the application settings.
2. Clearly documented in the privacy policy.
3. Functional and processed within 30 days of the request.
4. Accompanied by a confirmation notification to the user.

The data deletion mechanism must cover all data types declared in the Data Safety section. Server-side data must be permanently purged from production databases within 30 days. Backup data must be purged within 60 days. Anonymized data that cannot be linked to the deleted user identity may be retained indefinitely.

### 2.5 IARC Content Rating

Google Play uses the International Age Rating Coalition system for content rating. FOCUS must complete the IARC questionnaire through the Google Play Console. The questionnaire evaluates the application's content across the following categories:

- Violence: FOCUS contains no violence. Rating: None.
- Sexual content: FOCUS contains no sexual content. Rating: None.
- Language: FOCUS contains no objectionable language. Rating: None.
- Controlled substances: FOCUS references no controlled substances. Rating: None.
- User interaction: FOCUS does not facilitate user-to-user communication. Rating: None.
- Location: FOCUS does not share user location. Rating: None.
- Purchases: FOCUS contains in-app purchases. This is noted but does not affect the age rating.

The expected IARC rating for FOCUS is "Everyone" or "Everyone 10+" depending on questionnaire responses. The rating must be verified against the actual content of the application and must not be manipulated to achieve a lower rating.

### 2.6 Target API Level Requirements

Google Play requires that all new application submissions and updates target a minimum API level that is within one year of the current Android release. As of the current date, new submissions must target Android 14 (API 34) or higher. FOCUS must track these requirements and update the target API level before each deadline.

When updating the target API level, the following must be verified:

1. All API behavior changes documented in the new API level's release notes are addressed.
2. All permissions requested by the application are still necessary and properly declared.
3. The application passes Google's pre-launch report checks.
4. Background execution behavior complies with the new restrictions.
5. Scoped storage behavior is compliant (see Section 2.7).

### 2.7 Scoped Storage Compliance

Android 11 and later enforce scoped storage, which restricts an application's access to external storage. FOCUS must comply with scoped storage requirements:

1. FOCUS must not request the `MANAGE_EXTERNAL_STORAGE` permission unless absolutely necessary and unless the permission is declared in the Data Safety section.
2. FOCUS must use the `MediaStore` API for accessing shared media files.
3. FOCUS must use the application-specific external files directory for storing application-specific data.
4. FOCUS must use the application-specific internal files directory for all sensitive data.
5. FOCUS must not access other applications' private directories.

### 2.8 Background Execution Limits

Android imposes strict limits on background execution to preserve battery life and system performance. FOCUS must comply with the following background execution categories:

**Foreground Service.** If FOCUS requires background execution for focus session timing or notification delivery, it must use a foreground service with a persistent notification. The notification must clearly indicate that FOCUS is running and must provide a mechanism for the user to stop the service.

**WorkManager.** For deferred background work such as analytics upload, data synchronization, or notification scheduling, FOCUS must use `WorkManager` with appropriate constraints (network availability, battery level, charging state).

**AlarmManager.** For precise timing of focus session reminders, FOCUS must use `AlarmManager` with `setExactAndAllowWhileIdle` for critical timing, and `setWindow` for approximate timing. The `SCHEDULE_EXACT_ALARM` permission must be declared if exact alarms are used.

**Doze Mode.** FOCUS must comply with Doze mode restrictions. FOCUS must not attempt to bypass Doze mode. If critical notifications are required during Doze, FOCUS must use high-priority FCM messages with appropriate permissions.

### 2.9 Full Submission Checklist

**Account and Access:**
- [ ] Google Play Console account is active and in good standing
- [ ] All team members have appropriate roles and permissions
- [ ] The Google Play Signing key is enrolled
- [ ] The app signing key is backed up securely

**Application Binary:**
- [ ] The AAB (Android App Bundle) is built and signed with the correct upload key
- [ ] The AAB is uploaded via Google Play Console
- [ ] The internal test track build passes automated testing
- [ ] The build has been promoted to the appropriate track

**Metadata:**
- [ ] Application title is correct and does not exceed 30 characters
- [ ] Short description is correct and does not exceed 80 characters
- [ ] Full description is correct and does not exceed 4000 characters
- [ ] Screenshots are provided for phone and tablet
- [ ] Feature graphic is provided (1024x500)
- [ ] High-resolution icon is provided (512x512)
- [ ] Privacy policy URL is live and accessible
- [ ] Data Safety section is complete and accurate
- [ ] Content rating is verified as correct

**Technical:**
- [ ] The application targets the required API level
- [ ] The application supports 64-bit architectures (arm64-v8a, x86_64)
- [ ] Scoped storage compliance is verified
- [ ] Background execution limits are respected
- [ ] The application handles all screen densities and sizes
- [ ] The application handles configuration changes correctly
- [ ] The application handles runtime permissions correctly
- [ ] The application does not use restricted APIs

### 2.10 Common Rejection Reasons and Prevention

**Policy Violation: Misleading Claims.** The application description or metadata contains claims that are misleading, exaggerated, or not substantiated. Prevention: All claims must be evidence-based. Medical or health claims must include disclaimers. The term "cure" or "treat" must never be used in connection with ADHD, ADD, or any medical condition.

**Policy Violation: Data Safety Inaccuracies.** The Data Safety section does not accurately reflect the application's data collection practices. Prevention: The Data Safety section must be reviewed against the actual code and server-side data handling. Any change to data collection must trigger an immediate Data Safety section update.

**Technical Issue: Crashes or ANRs.** The application crashes or exhibits Application Not Responding errors during the pre-launch report or review. Prevention: Run the full test suite against the release build. Address all crashes and ANRs identified in the pre-launch report before requesting review.

**Policy Violation: Family Policy Violations.** The application is directed at children but does not comply with the Families Policy. Prevention: FOCUS must not be directed at children. If a significant portion of the user base is under 13, COPPA compliance must be implemented.

**Technical Issue: Inappropriate Permissions.** The application requests permissions that are not necessary for its functionality. Prevention: Every permission request must be justified against a documented functional requirement. Permissions that are not necessary must be removed.

---

## Section 3: Microsoft Store Compliance

### 3.1 Microsoft Store Requirements

FOCUS for Windows must comply with the Microsoft Store Policies and Requirements. The following areas require specific attention:

**Content Policy.** All content within the application and its store listing must comply with Microsoft's content policies. The application must not contain or promote illegal content, hate speech, harassment, or explicit material.

**Security.** The application must not contain malware, viruses, or any code designed to damage or compromise user devices. The application must not request unnecessary access to system resources.

**Privacy.** The application must provide a privacy policy that discloses data collection, use, and sharing practices. The privacy policy must be accessible from the store listing.

**Monetization.** All in-app purchases must use the Microsoft Store's in-app purchase API. The application must not include external payment links that bypass the Microsoft Store's revenue share.

**Compatibility.** The application must declare compatibility with the minimum supported Windows version. The application must handle DPI scaling, input methods, and display configurations correctly.

### 3.2 Windows Authenticode Signing

All FOCUS Windows binaries must be signed with an Authenticode certificate obtained from a trusted Certificate Authority. Authenticode signing ensures that Windows users and enterprise administrators can verify the integrity and origin of the FOCUS executable.

**Certificate Requirements.**
- The certificate must be an Extended Validation (EV) code signing certificate for optimal trust.
- The certificate must be stored in a Hardware Security Module (HSM) or a cloud-based HSM service such as Azure Key Vault.
- The private key must never be stored on developer workstations or in source control.
- The certificate must be renewed at least 90 days before expiration.

**Signing Process.**
1. Build the FOCUS Windows binary in Release configuration.
2. Sign all DLLs and EXEs that are part of the FOCUS distribution.
3. Sign the Windows Installer (MSI) or application package (MSIX) that contains the FOCUS binaries.
4. Verify the signature using `signtool verify /v /pa` after signing.
5. Timestamp the signature using a trusted timestamp server (RFC 3161 compliant).
6. Upload the signed installer to the Microsoft Store.

**Timestamping.** The signature must include a timestamp from a trusted timestamp authority (TSA). This ensures that the signature remains valid after the signing certificate expires. The TSA endpoint must be a production-grade service with high availability.

**Verification.** After signing, the build pipeline must verify the signature using `signtool.exe verify /v /pa /all` to confirm that all embedded signatures are valid. The verification step must be automated and must fail the build if verification fails.

### 3.3 macOS Notarization

FOCUS for macOS must be submitted to Apple's notarization service before distribution. Notarization is a prerequisite for Gatekeeper to allow the application to run on user macOS systems.

**Notarization Requirements.**
1. All binaries within the FOCUS application bundle must be signed with a valid Developer ID certificate.
2. The application bundle must be submitted to Apple's notarization service via the `notarytool` command.
3. Upon successful notarization, the notarization ticket must be stapled to the application bundle using `stapler`.
4. The stapled application bundle must be distributed to users.

**Signing Process.**
1. Build the FOCUS macOS binary in Release configuration.
2. Sign the main executable with the Developer ID Application certificate.
3. Sign all embedded frameworks and dynamic libraries with the Developer ID Application certificate.
4. Set the hardened runtime flag on all signed binaries.
5. Sign the application bundle itself.
6. Submit the signed application bundle for notarization.
7. Wait for notarization completion (typically 5-30 minutes).
8. Staple the notarization ticket to the application bundle.
9. Verify the stapled bundle using `spctl -a -v` on a test system.

**Hardened Runtime.** The hardened runtime must be enabled on all macOS binaries. The hardened runtime restricts certain security-sensitive operations but is required for notarization. If FOCUS requires any operations that are restricted by the hardened runtime (such as JIT compilation, unsigned executable memory, or loading resources via relative path), a runtime exception entitlement must be added to the application's entitlements file and the specific reason must be documented.

**Entitlements.** The FOCUS macOS entitlements file must declare only the minimum entitlements required for functionality:
- `com.apple.security.app-sandbox` (if sandboxed)
- `com.apple.security.automation.apple-events` (if using AppleScript)
- Any specific file access entitlements (with documented justification)

### 3.4 Linux GPG Signing

FOCUS for Linux must be distributed with GPG-signed packages to allow package managers and users to verify package integrity and authenticity.

**Key Management.**
1. Generate a dedicated GPG signing key pair for FOCUS distributions.
2. The private key must be stored in a secure, access-controlled environment.
3. The public key must be published to a key server and included in the FOCUS repository.
4. The key must have a validity period of no more than 3 years and must be rotated before expiration.
5. The key must be protected with a strong passphrase.

**Signing Process.**
1. Build the FOCUS Linux packages (`.deb`, `.rpm`, `.AppImage`).
2. Sign each package using the GPG private key.
3. Generate detached signatures (`.asc` files) for each package.
4. Publish the signatures alongside the packages.
5. Verify signatures using `gpg --verify` against the published public key.

**Key Distribution.**
1. Publish the public key to `keys.openpgp.org` or similar key servers.
2. Include the public key fingerprint on the FOCUS website's download page.
3. Include the public key in the FOCUS repository's documentation.
4. Provide instructions for users to import and verify the key.

---

## Section 4: Privacy Policy

### 4.1 Required Content

The FOCUS privacy policy must address the following areas comprehensively and in plain, accessible language. The privacy policy must be hosted at a stable, permanent URL that is not subject to change without notice. The URL must be accessible from both the application and the FOCUS website.

**Data Collection Disclosure.** The privacy policy must enumerate every category of data collected by FOCUS, including but not limited to:
- Personal information (name, email address)
- User-generated content (journal entries, session notes, routines)
- Usage data (session durations, completion rates, feature engagement)
- Device information (device model, operating system version, unique device identifiers)
- Diagnostic data (crash logs, performance metrics)
- Technical data (IP address, network type, time zone)

For each data category, the privacy policy must explain:
1. What specific data is collected.
2. Why the data is collected (the specific purpose).
3. How the data is used.
4. How the data is stored (encryption, access controls, retention period).
5. Whether the data is shared with third parties, and if so, the identity of each third party and the purpose of sharing.
6. How the user can access, correct, or delete the data.

**Data Storage and Security.** The privacy policy must describe the security measures FOCUS employs to protect user data, including:
- Encryption of data in transit (TLS 1.2 or higher for all network communications).
- Encryption of data at rest (AES-256 or equivalent for stored data).
- Access controls (role-based access, multi-factor authentication for internal systems).
- Regular security audits and penetration testing.
- Incident response procedures.
- Data retention periods for each data category.

**User Rights.** The privacy policy must inform users of their rights under applicable data protection laws, including:
- The right to access their personal data.
- The right to correct inaccurate personal data.
- The right to delete their personal data.
- The right to restrict processing of their personal data.
- The right to data portability.
- The right to object to processing.
- The right to withdraw consent at any time.
- The right to lodge a complaint with a supervisory authority.

The privacy policy must explain how users can exercise each of these rights, including the specific mechanism (in-app settings, email contact, or web form) and the expected response time.

**Children's Privacy (COPPA).** The privacy policy must address the collection of information from children under 13. FOCUS does not knowingly collect personal information from children under 13. If FOCUS discovers that it has collected personal information from a child under 13, that information will be deleted immediately. Parents or guardians who believe that their child has provided personal information to FOCUS must contact FOCUS at the provided contact email. FOCUS will investigate and respond to such inquiries within 10 business days.

**Cookies and Tracking.** If FOCUS uses cookies, pixels, or similar tracking technologies on its website, the privacy policy must disclose the use of each such technology, its purpose, and how users can manage their preferences.

**Change Notification.** The privacy policy must include a statement describing how users will be notified of changes to the policy. Changes must be communicated via email to registered users and via an in-app notification. Material changes must be communicated at least 30 days before they take effect. Continued use of FOCUS after the effective date of a material change constitutes acceptance of the revised policy.

**Contact Information.** The privacy policy must provide at least one contact method for privacy-related inquiries:
- Email address (privacy@focusapp.com or equivalent)
- Physical mailing address (if required by jurisdiction)
- Response time commitment (within 10 business days)

### 4.2 Accessibility

The privacy policy must be accessible from within the FOCUS application at a location that does not require login or account creation. The standard location is Settings > Privacy > Privacy Policy. The privacy policy must also be accessible from the FOCUS website without requiring login or navigation through multiple pages. The privacy policy must be readable on mobile devices and must not require horizontal scrolling or zooming.

---

## Section 5: Terms of Service

### 5.1 Required Content

The FOCUS Terms of Service must address the following areas:

**User Obligations.** Users must agree to use FOCUS only for its intended purpose. Users must not:
- Attempt to reverse-engineer, decompile, or disassemble the FOCUS application.
- Circumvent any security measures, access controls, or usage restrictions.
- Use FOCUS for any illegal purpose or in violation of any applicable law.
- Interfere with or disrupt the FOCUS service or servers.
- Create multiple accounts to circumvent usage limits or subscription requirements.
- Resell, redistribute, or sublicense access to FOCUS without explicit authorization.

**Acceptable Use.** The Terms of Service must define acceptable use of FOCUS, including:
- The application is intended for personal productivity and attention training.
- The application is not a medical device and must not be used as a substitute for professional medical advice.
- Users are responsible for the accuracy of any information they enter into the application.
- Users are responsible for maintaining the confidentiality of their account credentials.

**Intellectual Property.** The Terms of Service must clearly state that:
- FOCUS and all associated trademarks, copyrights, and intellectual property are owned by FOCUS.
- Users retain ownership of their user-generated content.
- By using FOCUS, users grant FOCUS a limited license to process their data as described in the privacy policy.
- No license to use FOCUS's intellectual property is granted to users except the right to use the application for its intended purpose during an active subscription.

**Subscription Terms.** The Terms of Service must detail:
- Subscription pricing and billing cycles.
- Automatic renewal terms.
- Free trial terms and conditions.
- Cancellation and refund policies.
- Changes to pricing with notice.
- Effects of cancellation on access to features and data.

**Liability.** The Terms of Service must include limitations of liability as permitted by applicable law, including:
- FOCUS is provided "as is" without warranties beyond those explicitly stated.
- FOCUS does not guarantee uninterrupted or error-free operation.
- FOCUS is not liable for any indirect, incidental, special, or consequential damages.
- The maximum liability of FOCUS is limited to the amount paid by the user in the 12 months preceding the claim.

**Dispute Resolution.** The Terms of Service must specify:
- The governing law for disputes (the jurisdiction of FOCUS's principal place of business).
- Whether disputes are resolved through arbitration, mediation, or litigation.
- The arbitration provider and rules if arbitration is required.
- The venue for any legal proceedings if litigation is permitted.
- The user's right to opt out of arbitration within a specified timeframe.

**Termination.** The Terms of Service must describe:
- The conditions under which FOCUS may terminate a user's access.
- The conditions under which a user may terminate their account.
- The effects of termination on data retention and access.
- The survival of certain provisions beyond termination.

### 5.2 Accessibility

The Terms of Service must be accessible from within the FOCUS application at Settings > Account > Terms of Service and from the FOCUS website. The Terms of Service must be presented in a readable format without requiring the user to download a separate application.

---

## Section 6: Content Rating Questionnaires

### 6.1 Apple App Store Questionnaire

The Apple App Store content rating questionnaire is completed within App Store Connect. FOCUS must answer each question accurately to produce the correct age rating. The expected rating is 4+ for FOCUS.

The questionnaire evaluates:
- Violence (FOCUS: None)
- Sexual content (FOCUS: None)
- Profanity (FOCUS: None)
- Alcohol, tobacco, or drug use (FOCUS: None)
- Mature or suggestive themes (FOCUS: None)
- Unrestricted web access (FOCUS: None)
- Gambling (FOCUS: None)
- User-generated content (FOCUS: None, unless user content features are implemented)
- Realistic violence (FOCUS: None)
- Graphic horror (FOCUS: None)

If the questionnaire produces a rating higher than 4+, the responses must be reviewed for accuracy. If the rating remains higher than 4+, the FOCUS marketing and design teams must review the content that caused the higher rating and determine if modification is necessary or if the higher rating is acceptable.

### 6.2 Google Play IARC Rating

The Google Play IARC rating is generated through the IARC Global Rating Tool integrated into the Google Play Console. The process is similar to Apple's questionnaire but uses the IARC system, which produces ratings for multiple regions simultaneously.

FOCUS should achieve an IARC rating of "Everyone" in the United States, "PEGI 3" in Europe, and equivalent ratings in other territories. The IARC questionnaire must be completed using the same content assessment as the Apple questionnaire.

### 6.3 FOCUS Target Rating

FOCUS must target a 4+ rating on Apple and an "Everyone" rating on Google Play. Any content that would result in a higher rating must be flagged during the design review process and must be addressed before submission. If a higher rating is unavoidable (for example, if user-generated content features are added in a future version), the rating change must be documented and approved by the compliance lead and the product manager.

---

## Section 7: Beta Testing

### 7.1 TestFlight (iOS)

TestFlight is Apple's beta testing platform integrated into App Store Connect. FOCUS must use TestFlight for all iOS beta testing.

**Internal Testing.** Internal testers are members of the FOCUS development team with access to App Store Connect. Internal testing builds are limited to 100 testers per build. Internal testing builds do not require App Store review. Internal testing is used for early validation of new builds before external beta release.

**External Testing.** External testers are individuals outside the FOCUS development team who have been invited to participate in beta testing. External testing builds are limited to 10,000 testers per build. External testing builds require App Store review before distribution, but the review is typically completed within 24-48 hours. The external testing review verifies that the build does not contain crashes, broken features, or objectionable content.

**Beta App Store Information.** The TestFlight beta listing must include:
- Beta app name and description
- Beta app notes describing the changes in the current build
- Beta app screenshots (optional but recommended)
- Beta app privacy policy URL
- Beta app feedback email address

**Beta Feedback.** FOCUS must configure the TestFlight feedback mechanism to capture user feedback including screenshots, annotations, and diagnostic data. Feedback must be triaged within 24 hours of receipt and categorized by severity and type.

### 7.2 Android Internal/Closed/Open Tracks

Google Play provides three testing tracks for Android beta distribution:

**Internal Track.** The internal track is limited to 100 testers and does not require Play Store review. The internal track is used for pre-release validation by the FOCUS team and selected power users.

**Closed Track.** The closed track supports up to 100,000 testers by email address or Google Group membership. The closed track requires Play Store review. The closed track is used for broader beta testing with a controlled group of users.

**Open Track.** The open track allows any Google Play user to opt into the beta program. The open track requires Play Store review. The open track is used for pre-release validation at scale and for gathering feedback from a diverse user population.

**Track Promotion.** Builds may be promoted from one track to another (e.g., internal to closed, closed to production). Promotion requires that the build has passed review at the source track and has not been flagged for critical issues.

### 7.3 Desktop Beta Distribution

FOCUS for desktop platforms (macOS, Windows, Linux) must use a direct distribution mechanism for beta testing. The recommended approach is a dedicated beta download page on the FOCUS website with the following features:

1. Beta builds are signed and notarized (macOS) or signed and verified (Windows).
2. Beta builds are GPG-signed (Linux).
3. Beta builds are versioned with a `-beta.N` suffix.
4. A feedback mechanism (built-in or external form) is provided for beta users.
5. Beta users must acknowledge that they are using pre-release software.
6. Beta builds are distributed via a CDN with download analytics.

---

## Section 8: Marketing Claims

### 8.1 Permitted Claims

FOCUS may make the following marketing claims based on the nature of the application as a productivity and attention training tool:

- "FOCUS helps you build better focus habits."
- "FOCUS provides structured attention training exercises."
- "FOCUS helps you track your focus sessions and progress."
- "FOCUS offers customizable focus routines."
- "FOCUS helps you manage distractions during work sessions."

### 8.2 Prohibited Claims

FOCUS must never make the following claims:

- "FOCUS cures ADHD, ADD, or any medical condition."
- "FOCUS treats or prevents any disease or disorder."
- "FOCUS is a medical device."
- "FOCUS replaces professional medical treatment."
- "FOCUS is clinically proven to improve attention" (unless a valid clinical study exists and the claim is properly cited).
- "FOCUS guarantees improved productivity" (absolute claims are prohibited).
- "FOCUS increases IQ or intelligence."

### 8.3 Scientific References

If FOCUS references scientific studies or research in marketing materials, the following rules apply:

1. All scientific references must be properly cited with author names, publication year, journal name, and a link to the published study or DOI.
2. Claims must accurately represent the study's findings and must not overstate the conclusions.
3. The word "proven" must never be used unless the claim is supported by a peer-reviewed study specifically about the FOCUS application or a substantially similar product.
4. The phrase "based on research" must be accompanied by a specific citation.
5. FOCUS must not cite studies about unrelated products, techniques, or populations as evidence for FOCUS-specific claims.

### 8.4 Required Disclaimers

All marketing materials for FOCUS must include the following disclaimer prominently and clearly:

"FOCUS is a productivity and attention training tool. It is not a medical device and is not intended to diagnose, treat, cure, or prevent any disease or medical condition. Individual results may vary. Consult a healthcare professional for medical advice."

This disclaimer must appear:
- In the app description on every store.
- In all marketing landing pages.
- In all app store screenshots that include benefit claims.
- In all advertising copy.
- In all press releases and media kits.

The phrase "Results may vary" must appear prominently whenever specific outcomes or results are mentioned in marketing materials.

---

## Section 9: Submission Timeline and Rejection Handling

### 9.1 Initial Submission Timeline

The following timeline applies to the initial FOCUS submission to each store:

**Week 1: Pre-Submission Preparation.**
- Day 1-2: Final compliance review of the application binary, metadata, and documentation.
- Day 3: Complete all store-specific submission forms (Apple App Store Connect, Google Play Console, Microsoft Store Partner Center).
- Day 4: Upload builds to all stores.
- Day 5: Submit for review on all platforms.

**Week 2: Review and Response.**
- Day 1-3: Wait for initial review. Apple typically reviews within 24-48 hours. Google typically reviews within 24-72 hours. Microsoft typically reviews within 1-3 business days.
- Day 4-5: Address any review feedback or rejection issues.
- Day 5: If no issues, builds proceed to approval.
- Day 6-7: Confirm approval and prepare for release (staged rollout configuration).

### 9.2 Update Submission Timeline

Subsequent updates to FOCUS follow an accelerated timeline:

**Week 1: Update Preparation.**
- Day 1: Final review of the update diff, new features, and changes.
- Day 2: Upload the updated build to all stores.
- Day 3: Submit for review.
- Day 4-5: Address any review feedback.

### 9.3 Rejection Handling

When a FOCUS build is rejected by any store, the following protocol must be followed:

**Immediate Response (within 48 hours).**
1. The compliance lead must be notified of the rejection immediately upon notification from the store.
2. The rejection reason must be analyzed and categorized (technical issue, policy violation, metadata issue, content issue).
3. A preliminary response must be prepared and submitted to the store within 48 hours, even if a full fix is not yet available. The response must acknowledge the rejection, describe the root cause, and provide a timeline for resolution.

**Resolution Timeline.**
- Technical issues (crashes, broken features): Fix within 48 hours, resubmit within 72 hours.
- Policy violations (privacy, data safety, content): Fix within 72 hours, resubmit within 5 business days.
- Metadata issues (description, screenshots, ratings): Fix within 24 hours, resubmit within 48 hours.
- Content rating issues: Review and adjust within 48 hours, resubmit within 72 hours.

**Communication Protocol.**
1. All communication with the store review team must go through the designated compliance lead.
2. The compliance lead must copy the engineering lead and product manager on all communications.
3. The compliance lead must maintain a log of all communications, including timestamps, message content, and resolution status.
4. If the rejection appears to be in error or unjustified, the compliance lead must document the basis for the appeal and submit it through the store's official appeal mechanism.

### 9.4 Appeal Process

If a rejection is believed to be unjustified, the following appeal process must be followed:

**Apple.** Appeals are submitted through the Resolution Center in App Store Connect. The appeal must include a detailed explanation of why the rejection is believed to be in error, with references to specific sections of the App Store Review Guidelines that support the appeal. Apple's review team will re-evaluate the submission within 24-48 hours of the appeal submission.

**Google Play.** Appeals are submitted through the Google Play Console's "Appeal a policy decision" feature. The appeal must include a detailed explanation of why the rejection is believed to be in error, with references to the specific Google Play Developer Distribution Policy. Google's review team will re-evaluate within 7 business days.

**Microsoft.** Appeals are submitted through the Microsoft Store Dashboard's certification feedback mechanism. The appeal must include a detailed explanation and supporting documentation. Microsoft's review team will re-evaluate within 5 business days.

**Escalation.** If the initial appeal is denied, the compliance lead must escalate the issue to the next level of review within the store's organization. Further escalation may involve direct contact with developer relations or account managers at each platform. All escalation contacts must be documented in the compliance team's contact directory.

### 9.5 Post-Approval Release Protocol

Upon approval of a FOCUS build on any store, the following release protocol must be followed:

**Staged Rollout.** FOCUS must be released to users via a staged rollout. The initial release must be limited to 5% of users, increasing to 20% after 24 hours, 50% after 48 hours, and 100% after 72 hours, provided no critical issues are identified in the initial rollout.

**Monitoring.** During the staged rollout, the following metrics must be monitored continuously:
- Crash rate (must remain below 1%)
- ANR rate (Android only, must remain below 0.5%)
- User ratings and reviews
- Support ticket volume
- Subscription conversion rate
- Server-side error rates

**Rollback.** If the crash rate exceeds 1% or a critical bug is identified during the staged rollout, the release must be halted and a hotfix build must be prepared and submitted within 24 hours.

---

## Section 10: Compliance Maintenance

### 10.1 Ongoing Review Cadence

Compliance is not a one-time activity. The following review cadence must be maintained:

**Weekly.** Monitor store review status for all pending submissions. Address any new rejections or feedback within 48 hours.

**Monthly.** Review the Data Safety section (Google Play) and privacy nutrition label (Apple App Store) for accuracy against current data collection practices. Review any new store policy changes that may affect FOCUS compliance.

**Quarterly.** Conduct a full compliance audit covering all stores, all documentation (privacy policy, terms of service, marketing claims), and all technical requirements (API level targets, OS version support, signing certificates). Update all compliance documentation as needed.

**Annually.** Renew developer program enrollments (Apple Developer Program, Google Play Developer account, Microsoft Partner account). Rotate signing certificates if approaching expiration. Update the privacy policy and terms of service to reflect any changes in applicable law. Conduct a comprehensive review of all marketing claims against current scientific evidence.

### 10.2 Policy Change Monitoring

Each store maintains a developer blog and policy change notification system. The compliance lead must subscribe to all policy change notifications from:
- Apple Developer News and Updates
- Google Play Developer Policy Center announcements
- Microsoft Store Policy and Certification blog

Any policy change that affects FOCUS must be evaluated within 7 business days of the announcement, and a compliance action plan must be created within 14 business days. Critical policy changes that affect existing builds must be addressed with an update submission within 30 days.

### 10.3 Compliance Documentation

All compliance documentation must be maintained in the FOCUS compliance repository, including:
- Privacy policy (current and all historical versions)
- Terms of service (current and all historical versions)
- Content rating questionnaire responses for all stores
- Data safety section declarations (current and all historical versions)
- Privacy nutrition label declarations (current and all historical versions)
- Submission checklists (completed for every submission)
- Rejection logs and resolution records
- Appeal records and outcomes
- Certificate and key management records
- Third-party SDK inventory with data access declarations

All compliance documentation must be version-controlled and must be accessible to the compliance lead, engineering lead, and product manager at all times.

---

*This chapter establishes the complete compliance framework for distributing the FOCUS application across all target platforms. Every team member involved in building, testing, or releasing FOCUS must understand and adhere to these requirements. Compliance is not optional. It is a fundamental requirement for the continued distribution and success of FOCUS.*
