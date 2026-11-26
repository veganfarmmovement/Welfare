# VEGANFARM Adoption and Fund Grant workflows

## Deployment components

- Public pages: `#adoption` and `#fund-grant`
- Public form and listing logic: `assets/veganfarm-public-applications.js`
- Founder review queues: Founder dashboard → Adoption cases / Fund Grant applications
- Edge Function: `veganfarm-public-applications`
- Database schema: `supabase-adoption-grants.sql`

## Email OTP configuration required

The Fund Grant page uses Supabase Auth email OTP:

- `signInWithOtp({ email, options: { shouldCreateUser: true } })`
- `verifyOtp({ email, token, type: 'email' })`

Supabase sends a numeric code only when the Auth **Magic Link** email template uses `{{ .Token }}`. If the template uses `{{ .ConfirmationURL }}`, the user receives a sign-in link instead of a code.

In Supabase Dashboard:

1. Open **Authentication → Email Templates → Magic Link**.
2. Set the subject to: `Your VEGANFARM Fund Grant verification code`.
3. Use a message body that includes `{{ .Token }}`, for example:

   ```html
   <h2>VEGANFARM email verification</h2>
   <p>Use this one-time code to continue your Fund Grant application:</p>
   <p style="font-size:28px;font-weight:700;letter-spacing:6px">{{ .Token }}</p>
   <p>If you did not request this code, you can ignore this email.</p>
   ```

4. Configure a custom SMTP provider with a sender address/name controlled by VEGANFARM if the email must arrive from the VEGANFARM email address. Do not put SMTP credentials in this repository or frontend code.

Supabase's current guidance confirms that `{{ .Token }}` is the OTP variable. New Free-plan projects using Supabase's default SMTP cannot customize Auth email templates; a custom SMTP provider is needed for custom templates on those projects.

## Security model

- Adoption submissions do not require OTP. Applicant phone is required and remains private.
- Adoption photos and supporting documents are stored in a private bucket. Public visitors receive short-lived signed URLs only for approved/published cases.
- Adoption listings never expose the submitter's email or phone.
- The adopter's WhatsApp enquiry includes the animal name and case reference. WhatsApp opens VEGANFARM's configured contact number; when the adopter sends the message, VEGANFARM can see their WhatsApp number.
- Fund Grant submissions require a verified Supabase Auth email session.
- Grant documents remain in a private bucket and are signed only for Founder review.
- Application tables have RLS enabled and no direct anon/authenticated SELECT grants. The Edge Function uses the service role and performs Founder-token or verified-user checks.
- Applicant tracking requires the same verified email account and the reference number.

## Operational limitation

The current grant tracker returns status and the applicant-facing update message when the applicant checks the reference number. Automated status-notification emails require a configured transactional email provider and are not sent by the current application function.
