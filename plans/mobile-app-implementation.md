# Mobile App Implementation Plan: Adria Cross Edit

**Decision:** The client has opted for the **Premium Native (React Native)** approach to deliver the highest quality user experience.

## Overview
We will build a completely new frontend using **React Native (via Expo)**. It will natively communicate with your existing Node.js/Express server (`server.js`) via REST APIs. This provides a buttery-smooth native feel, full device integration (camera, push notifications), and presence in the iOS App Store and Google Play Store.

## Implementation Roadmap

### Phase 1: Backend API Readiness (Node.js/Express)
Currently, the app relies heavily on server-rendered HTML and tightly coupled session cookies (`express-session`). Native apps require stateless tokens and JSON responses.
1.  **Authentication Modernization:** 
    *   Implement **JWT (JSON Web Tokens)** for mobile authentication.
    *   Create dedicated API login/registration endpoints (e.g., `/api/auth/login`) that return a JWT instead of setting a session cookie.
    *   Update OAuth (Google/Apple) flows to work with mobile deep-linking or native SDKs.
2.  **API Restructuring & Documentation:**
    *   Ensure all core flows (Booking, Intake Forms) have well-documented JSON REST endpoints (currently many routes likely render HTML views, they need pure JSON equivalents).
3.  **File Uploads for Matcher:**
    *   Ensure `multer` endpoints for the Clothing Matcher accept images properly from `multipart/form-data` submitted by native iOS/Android hardware.

### Phase 2: React Native / Expo App Setup
1.  **Initialize Project:** 
    *   Create a new Expo project (`npx create-expo-app adria-mobile`) alongside the backend or in a new repository.
2.  **State Management & Networking:** 
    *   Set up `axios` configured with JWT interceptors to securely talk to the Node backend.
    *   Set up a state manager (e.g., Zustand or React Context) for managing user auth status and app data.
3.  **UI/UX Design System:**
    *   Replicate the existing web UI's premium styling using `StyleSheet`.
    *   Ensure typography, brand colors (from existing CSS), and animations are sleek and responsive.

### Phase 3: Core Feature Development
1.  **Auth Flow:** Login, Registration, and Apple/Google Sign-In integration natively.
2.  **The Clothing Matcher (Highlight Feature):**
    *   Implement `expo-camera` and `expo-image-picker` to allow users to snap photos of their wardrobe directly.
    *   Send the image via API to the Node backend for color theory scoring.
    *   Build a beautiful Native UI to display matches using smooth sliding animations (e.g., using `react-native-reanimated`).
3.  **Client Services:**
    *   Convert Intake Forms into native multi-step wizards.
    *   Appointment booking natively integrated with the existing Custom Availability Overrides system. 
4.  **E-commerce / Square Integration:**
    *   Use Square’s Web Payments SDK wrapped in a secure React Native `WebView`. (Digital services can sometimes require in-app purchases, but physical styling services typically fall outside Apple's 30% cut, allowing standard Square Web SDK usage.)

### Phase 4: Testing & Deployment
1.  **Internal Testing:**
    *   Distribute internal beta builds using **Expo EAS (Expo Application Services)** via TestFlight (iOS) and Google Play Console (Android) to the customer.
2.  **App Store Optimization (ASO):**
    *   Create app store screenshots visualizing the "Clothing Matcher" and the "Member Portal".
3.  **Submission:**
    *   Submit to Apple App Store (1-2 weeks review time).
    *   Submit to Google Play Store (3-7 days review time).

---

## Immediate Next Steps
1.  **Create the Mobile Repository:** Initialize the Expo application (`adria-mobile`).
2.  **Backend Auth API:** Begin modifying `server.js` (or creating a new routing file like `routes/api.js`) to support JWT token generation and validation for mobile clients.
