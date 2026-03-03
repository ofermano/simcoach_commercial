## Packages

framer-motion | Page transitions and scroll-triggered animations
@hookform/resolvers | Form validation resolver for Zod
react-hook-form | Form state management
zod | Schema validation

## Notes

- Post-login flow: The user logs in via Auth API (`/api/login`), which redirects back to the app.
- The app checks `/api/whitelist/check`. If fail, shows error. If pass, checks `/api/questionnaire`.
- If questionnaire is complete, redirect to `/download`. If not, show questionnaire form.
- The entire app is styled in a dark "Racing/Automotive Tech" aesthetic.
