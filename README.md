# InstaBasket

**InstaBasket** is a full-stack grocery delivery platform built to make everyday shopping simple with intuitive browsing, smart cart management, secure checkout, and role-based operational tools.

This repository is the complete project repository and should be treated as the final source for the application.

---

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, React Router, Zustand
- **Backend**: Node.js, Express.js, Zod validation
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT cookie auth, OTP email verification, Google OAuth, seller session auth
- **Payments**: Stripe Checkout, Stripe webhook verification, and Cash on Delivery support
- **Cloud & Messaging**: Cloudinary for image uploads and Nodemailer for OTP emails

---

## Core Features

- Full customer storefront with category browsing, search, cart sync, checkout, and order history
- OTP-based email signup, Google login, JWT cookie auth, and seller session authentication
- Profile management, profile photo upload, address book management, and account settings
- Stock-aware catalog flows with out-of-stock handling and restock notifications
- Stripe and Cash on Delivery checkout with payment retry and verification flows
- Verified-buyer ratings and reviews with product rating summaries and paginated review lists
- Seller dashboard for products, inventory health, orders, revenue insights, and user management
- Protected maintenance utilities for payment overrides, refunds, and safe data cleanup
- Backend validation, rate limiting, CORS controls, webhook handling, and OTP email delivery

---

## Project Structure

- `client/` - Vite + React frontend with `Pages`, `Components`, `features`, `store`, `shared`, and `assets`
- `server/` - Express API with `controllers`, `routes`, `models`, `schemas`, `middlewares`, `services`, `utils`, and `configs`

---

## Local Setup

- `client`: `npm install` then `npm run dev`
- `server`: `npm install` then `npm start` or `npm run server`
- Local frontend development proxies `/api` requests to `http://localhost:3000`

---

## Environment Variables

- **Frontend**: `VITE_BASE_URL`, `VITE_CURRENCY`, `VITE_GOOGLE_CLIENT_ID`
- **Backend**: `PORT`, `NODE_ENV`, `MONGODB_URI`, `JWT_SECRET`, `SELLER_EMAIL`, `SELLER_PASSWORD`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `ADMIN_RESET_KEY`, `CORS_ALLOWED_ORIGINS`, `FRONTEND_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `EMAIL_USER`, `EMAIL_PASS`

---

## User Roles

### User

Browse grocery items, search products, manage cart and addresses, place COD or Stripe orders, retry unpaid Stripe payments, manage profile/settings, receive notifications, and leave verified reviews.

| ![User 1](https://github.com/user-attachments/assets/059ec843-b113-4c69-9acc-eeea9613a711) | ![User 2](https://github.com/user-attachments/assets/2e0fc8d9-88af-456b-b3ba-ee43fe9c2b99) | ![User 3](https://github.com/user-attachments/assets/371695dc-eb26-4362-bb06-254f43eb5d4c) |
|:--:|:--:|:--:|
| ![User 4](https://github.com/user-attachments/assets/465afba4-ea23-4d4e-a8e1-9c9052117235) | ![User 5](https://github.com/user-attachments/assets/56e9b2a3-e92f-495b-96bf-44041f42cc9c) | ![User 6](https://github.com/user-attachments/assets/8b8cf28e-3c75-48b2-907c-cd4cd018d812) |
| ![User 7](https://github.com/user-attachments/assets/0fc95435-301f-4847-b4e5-864bf63f056c) |  |  |

### Seller

Manage products, pricing, images, and stock status; monitor low-stock and out-of-stock items; track revenue and orders; update logistics and payment state; and activate or deactivate users.

| ![Seller 1](https://github.com/user-attachments/assets/66782cb9-c9a0-4a65-951b-4961b7b9d9a6) | ![Seller 2](https://github.com/user-attachments/assets/88da90ed-9e5e-4c96-a86f-73c1757ef67e) | ![Seller 3](https://github.com/user-attachments/assets/107a8c77-dcc8-4547-9f70-2d315f309940) |
|:--:|:--:|:--:|

### Admin / Protected Operations

Protected operational utilities exist through secured seller/backend routes for safe order, transaction, and notification cleanup, manual payment overrides, and refund handling.

---

## Links

- **Live App**: https://insta-basket.vercel.app

---

## Contact

For collaboration or project-related inquiries, feel free to reach out via <a href="https://github.com/Akhileshpookkuttiyil">GitHub</a> or email at <span style="font-size: 12px;">akhileshpookkuttiyil@gmail.com</span>.
