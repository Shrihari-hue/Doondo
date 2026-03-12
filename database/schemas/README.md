# Doondo Database Schemas

Collections used by the platform:

- `users`: stores authentication, job seeker profiles, employer business profiles, bookmarks, and subscription state.
- `jobs`: stores city and coordinate-aware job listings with geospatial indexing for nearby search.
- `applications`: tracks which seeker applied to which job and the current hiring status.
- `conversations`: stores chat threads between employers and seekers.
- `messages`: stores chat messages for each conversation.
- `notifications`: stores in-app and browser-triggered alerts for jobs, applications, subscriptions, and chat.
