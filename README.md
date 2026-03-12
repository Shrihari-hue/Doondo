# Doondo

Doondo is a full-stack local job marketplace that connects businesses with nearby job seekers for part-time and full-time work.

It includes:

- React + Tailwind frontend
- Node.js + Express backend
- MongoDB models and geospatial job search
- JWT authentication
- Razorpay subscription payments for employers
- Geoapify / OpenCage location integration
- Karnataka local pincode collection with city/area validation
- Bookmarks, chat, and browser notification support

## Project Structure

```text
Doondo/
├── frontend/
├── backend/
└── database/
```

## Core Features

### Job Seekers

- Register and login
- Create profile with name, phone, skills, preferred job type, and location
- Search jobs by city, area, distance, and job type
- View job details and apply
- Save and bookmark jobs
- Track application status
- Chat with employers

### Employers

- Register business account
- Manage business profile
- Subscribe before posting jobs
- Post and manage vacancies
- View applicants
- Chat with job seekers

### Subscription Plans

- Basic: `₹499/month` with `5` job posts
- Pro: `₹999/month` with unlimited job posts
- Premium: `₹1999/month` with unlimited posts and priority listing

## API Endpoints

### Auth

- `POST /api/register`
- `POST /api/login`
- `GET /api/profile`
- `PUT /api/profile`

### Jobs

- `POST /api/jobs`
- `GET /api/jobs`
- `GET /api/jobs/:id`
- `POST /api/jobs/apply`
- `POST /api/jobs/:id/bookmark`
- `GET /api/jobs/saved/me`

### Employer

- `GET /api/employer/jobs`
- `GET /api/employer/applicants`
- `PUT /api/employer/jobs/:id`

### Subscription

- `GET /api/subscriptions/plans`
- `POST /api/subscriptions/create-order`
- `POST /api/subscriptions/verify`

### Chat and Notifications

- `GET /api/chat/conversations`
- `POST /api/chat/conversations`
- `GET /api/chat/:conversationId/messages`
- `POST /api/chat/:conversationId/messages`
- `GET /api/notifications`
- `POST /api/notifications/:id/read`

### Location

- `GET /api/location/pincode/:pincode`
- `POST /api/location/validate-pincode`

## Local Setup

### 1. Install dependencies

From the project root:

```bash
npm install
```

### 2. Configure environment variables

Create these files:

- `backend/.env`
- `frontend/.env`

Use the examples already included in the repo:

#### `backend/.env`

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/doondo
JWT_SECRET=replace_with_a_secure_secret
CLIENT_URL=http://localhost:3000
RAZORPAY_KEY_ID=rzp_test_your_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
PINCODE_LOOKUP_API_BASE=https://api.postalpincode.in
```

#### `frontend/.env`

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_GEOAPIFY_API_KEY=your_geoapify_key
VITE_OPENCAGE_API_KEY=your_opencage_key
VITE_RAZORPAY_KEY_ID=rzp_test_your_key
```

Notes:

- Use either `VITE_GEOAPIFY_API_KEY` or `VITE_OPENCAGE_API_KEY`.
- Razorpay checkout requires valid test or live keys.
- MongoDB must be running locally or exposed via `MONGO_URI`.

### 3. Start the full project

From the root:

```bash
npm start
```

This runs:

- backend on `http://localhost:5000`
- frontend on `http://localhost:3000`

### 4. Seed Karnataka pincodes into MongoDB

Run this once after MongoDB is up:

```bash
npm run seed:pincodes --workspace doondo-backend
```

## Running in VS Code

1. Open the `Doondo` folder in VS Code.
2. Open the integrated terminal.
3. Run `npm install`.
4. Add `backend/.env` and `frontend/.env`.
5. Run `npm start`.

## Mobile App Setup With Capacitor

Doondo now includes a Capacitor wrapper around the existing React frontend.

Native project folders:

- `frontend/android`
- `frontend/ios`

### Prerequisites

- Android Studio for Android builds
- Xcode for iPhone builds
- CocoaPods for iOS dependency sync on macOS

### Important Before Building Mobile

The desktop web app still uses [frontend/.env](/Users/_itsshree/Doondo/Doondo/frontend/.env) with `localhost`.

For mobile builds, use the included target-specific env files instead of editing `.env` manually:

- [frontend/.env.mobile-device](/Users/_itsshree/Doondo/Doondo/frontend/.env.mobile-device)
  - for iPhone and real Android devices on the same Wi-Fi as your Mac
- [frontend/.env.mobile-android-emulator](/Users/_itsshree/Doondo/Doondo/frontend/.env.mobile-android-emulator)
  - for Android emulator builds using `10.0.2.2`

Current values:

```bash
# real device / iPhone
npm run mobile:device

# Android emulator
npm run mobile:android-emulator
```

If your Mac IP changes, update only [frontend/.env.mobile-device](/Users/_itsshree/Doondo/Doondo/frontend/.env.mobile-device).

### Android

Prepare the Android emulator build:

```bash
npm run mobile:android-emulator
```

Open the Android project:

```bash
npm run mobile:android
```

Then in Android Studio:

1. Wait for Gradle sync to finish.
2. Choose an emulator or connected Android phone.
3. Click `Run`.
4. To generate an APK:
   - `Build` -> `Build Bundle(s) / APK(s)` -> `Build APK(s)`

### iPhone

Prepare the real-device / iPhone build:

```bash
npm run mobile:device
```

Open the iOS project:

```bash
npm run mobile:ios
```

Then in Xcode:

1. Choose a simulator or connected iPhone.
2. Set your Apple developer signing team in the project settings.
3. Click `Run`.
4. For a device build, use a valid Apple developer account.

### Mobile Workflow After Frontend Changes

Every time you change the React frontend and want the native app updated:

```bash
npm run mobile:device
```

For Android emulator builds, use:

```bash
npm run mobile:android-emulator
```

### Notes

- Capacitor app ID: `com.doondo.app`
- Android cleartext HTTP is enabled for development.
- iOS local-network/web-content HTTP access is enabled for development.
- Replace these relaxed development settings with stricter HTTPS-only settings before production release.
- App icons and splash screens now use Doondo branding generated from `frontend/assets/logo.svg`.

## Important Implementation Notes

- Employer job posting is subscription-gated.
- Nearby search uses MongoDB geospatial queries on job coordinates.
- Signup and profile location validation use a local Karnataka pincode collection first, with external PIN lookup fallback.
- Browser notifications are triggered for new jobs, applications, and chat activity.
- The frontend includes a map-style nearby jobs panel and can render Geoapify static maps when a key is present.
- Chat uses Socket.IO for realtime message delivery.

## Files To Start With

- [frontend/src/App.jsx](/Users/_itsshree/Doondo/Doondo/frontend/src/App.jsx)
- [frontend/src/pages/JobSearchPage.jsx](/Users/_itsshree/Doondo/Doondo/frontend/src/pages/JobSearchPage.jsx)
- [frontend/src/pages/EmployerDashboardPage.jsx](/Users/_itsshree/Doondo/Doondo/frontend/src/pages/EmployerDashboardPage.jsx)
- [backend/server.js](/Users/_itsshree/Doondo/Doondo/backend/server.js)
- [backend/controllers/jobController.js](/Users/_itsshree/Doondo/Doondo/backend/controllers/jobController.js)
- [backend/models/User.js](/Users/_itsshree/Doondo/Doondo/backend/models/User.js)
