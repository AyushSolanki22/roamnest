# 🏡 Roamnest — Full-Stack Accommodation Booking Platform

A full-stack **Airbnb-inspired accommodation booking platform** built to understand and implement real-world web application concepts such as authentication, authorization, property management, bookings, sessions, file uploads, Cloudinary integration, MongoDB relationships, and dynamic pricing.

> **Disclaimer:** Roamnest is an independent educational project inspired by Airbnb. It is not affiliated with, sponsored by, or endorsed by Airbnb.

---

## ✨ Features

### 🔐 Authentication & Authorization

- User registration and login
- Secure password hashing using **bcrypt**
- Session-based authentication
- Persistent login sessions using MongoDB session storage
- Logout functionality
- Guest and Host account types
- Strong password validation
- Email validation
- Confirm-password validation
- Terms & conditions acceptance
- Protected routes for authenticated users
- Host-only protected routes
- Authorization checks to ensure hosts can only manage their own properties

---

### 🏡 Property Management

Hosts can:

- Register a new property
- Add property name and location
- Set nightly pricing
- Set maximum guest capacity
- Configure extra guest charges
- Add property ratings
- Add property descriptions
- Upload property images
- Upload house-rules PDF documents
- View their listed properties
- Edit existing properties
- Replace property images
- Replace house-rules documents
- Delete properties

The application also cleans up replaced or deleted Cloudinary assets to prevent unnecessary files from remaining in cloud storage.

---

### 📸 File Upload System

Implemented using **Multer** and **Cloudinary**.

Supported property images:

- JPG
- JPEG
- PNG
- WEBP

Supported house rules:

- PDF

The upload system validates MIME types and file extensions before accepting files.

Uploaded assets are stored in Cloudinary rather than relying on the application's local filesystem for persistent storage. The application stores asset URLs and public IDs so that uploaded files can be displayed and managed, including when properties are edited or deleted.

---

### ❤️ Favourites

Users can:

- Add properties to favourites
- View their favourite properties
- Remove properties from favourites

Favourites are stored as MongoDB references to property documents and populated when required.

---

### 📅 Booking System

Authenticated users can book available properties.

The booking system includes:

- Check-in date
- Check-out date
- Number of guests
- Number of nights
- Base nightly price
- Extra guest fee
- Extra guest count
- Base booking amount
- Extra guest amount
- Final booking price
- Booking status

The system also prevents:

- Booking a property in the past
- Invalid check-in/check-out dates
- Check-out before check-in
- Exceeding the property's guest capacity
- Hosts booking their own properties
- Double booking for overlapping dates

---

### 💰 Dynamic Pricing

The booking price is calculated automatically.

#### Base amount

```text
Base Price × Number of Nights
```

#### Extra guest amount

```text
Extra Guests × Extra Guest Fee × Number of Nights
```

#### Final price

```text
Base Amount + Extra Guest Amount
```

This makes the booking system more realistic than a simple static-price implementation.

---

### ❌ Booking Cancellation

Users can:

- View their bookings
- See booking details
- Cancel confirmed bookings

Cancelled bookings are retained with a `cancelled` status instead of being immediately removed from the database.

---

### 🛡️ Security & Validation

The backend implements multiple validation and authorization checks.

Examples include:

- Password strength validation
- Email validation
- User-type validation
- Authentication middleware
- Host ownership validation
- Booking ownership validation
- Maximum guest validation
- Date validation
- Booking conflict detection
- File-type validation
- File-extension validation
- Error-handling middleware

---

## ✨ Phase 2 — Discovery and design improvements

The property discovery page now supports:

- Search by property name or location (case-insensitive, literal matching).
- Minimum and maximum nightly price filters.
- Minimum guest-capacity filtering.
- Sorting by recommended (rating), price ascending, price descending, rating, or most recently added (MongoDB ID order).
- Combined filters with query parameters preserved in the form.
- A clear-filters action, result count, and helpful no-results state.
- A responsive, warm-neutral visual system with premium property cards, accessible form labels, mobile layouts, and reduced-motion support.

Search is implemented using the existing `Home` model and `/homes` route. No new model or database migration is required. The current schema does not contain an amenities field, so amenities filtering is intentionally not presented as a supported filter.

### Search URL example

```text
/homes?q=Goa&minPrice=2000&maxPrice=8000&guests=4&sort=price-asc
```

## 🚀 Local setup

1. Install a supported Node.js version and MongoDB Atlas/local MongoDB access.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and set real values locally. Never commit `.env`.
4. Start the app with `npm start` (or `npm run dev` during development).
5. For Tailwind changes, run `npm run tailwind:build`; the new Roamnest design layer is in `public/roamnest.css`.

Before deployment, configure `MONGODB_URI`, a strong `SESSION_SECRET`, and Cloudinary credentials in the hosting provider's environment settings. Verify uploaded assets use durable Cloudinary URLs rather than depending on Render's local filesystem.

## 🧰 Tech Stack

### Backend

- **Node.js**
- **Express.js**
- **MongoDB**
- **Mongoose**
- **Express Session**
- **connect-mongodb-session**
- **bcryptjs**
- **express-validator**
- **Multer**
- **Cloudinary**

### Frontend

- **EJS**
- **HTML5**
- **CSS3**
- **Tailwind CSS**
- Responsive design

### Database

**MongoDB Atlas**

Main relationships include:

```text
User
 ├── Favourites → Home
 ├── Bookings → Home
 └── Hosted Homes → Home

Home
 └── Host → User

Booking
 ├── User → User
 └── Home → Home
```

---

## 🏗️ Architecture

The application follows a modular Express architecture.

```text
roamnest/
│
├── controllers/
│   ├── authController.js
│   ├── bookingController.js
│   ├── hostController.js
│   ├── storeController.js
│   └── error.js
│
├── models/
│   ├── user.js
│   ├── home.js
│   └── booking.js
│
├── routes/
│   ├── auth.js
│   ├── booking.js
│   ├── host.js
│   └── store.js
│
├── views/
│   ├── auth/
│   ├── host/
│   ├── store/
│   └── partials/
│
├── public/
│   ├── css/
│   └── ...
│
├── middleware/
│   └── fileUpload.js
│
├── utils/
│   ├── cloudinary.js
│   └── ...
│
├── app.js
├── package.json
├── package-lock.json
├── .env
└── .gitignore
```

---

## 🔑 Environment Variables

Create a `.env` file in the project root.

```env
PORT=3000

MONGODB_URI=your_mongodb_connection_string

SESSION_SECRET=your_random_session_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Example

```env
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/roamnest
SESSION_SECRET=replace_with_a_long_random_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> Never commit your `.env` file to GitHub. Replace example values with your actual credentials, and never expose your Cloudinary API secret.

---

## 🚀 Getting Started

### 1. Clone the repository

Replace `YOUR_USERNAME` with your GitHub username and adjust the repository URL if your GitHub repository uses a different name.

```bash
git clone https://github.com/YOUR_USERNAME/roamnest.git
```

### 2. Navigate into the project

```bash
cd roamnest
```

### 3. Install dependencies

```bash
npm install
```

### 4. Create `.env`

Create a `.env` file in the root directory:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 5. Start the application

For development:

```bash
npm start
```

Then open:

```text
http://localhost:3000
```

---

## 👤 User Roles

### Guest

Guests can:

- Create an account
- Log in
- Browse properties
- View property details
- Add properties to favourites
- Book properties
- View bookings
- Cancel bookings

### Host

Hosts can:

- Create an account as a host
- Add properties
- Upload property images
- Upload house rules
- Edit properties
- Replace uploaded files
- Delete properties
- View their listed properties

---

## 📊 Booking Flow

```text
User
 │
 ▼
Select Property
 │
 ▼
Choose Check-in / Check-out
 │
 ▼
Select Number of Guests
 │
 ▼
Validate Dates & Guest Limit
 │
 ▼
Check Booking Conflicts
 │
 ▼
Calculate Price
 │
 ▼
Create Booking
 │
 ▼
My Bookings
```

---

## 🗄️ Data Models

### User

Stores:

- First name
- Last name
- Email
- Hashed password
- User type
- Favourite properties

### Home

Stores:

- Property name
- Price
- Maximum guests
- Extra guest fee
- Location
- Rating
- Photo URL
- Cloudinary public ID for uploaded assets, where configured
- Description
- House rules document URL
- House-rules Cloudinary public ID, where configured
- Host reference

### Booking

Stores:

- Property reference
- User reference
- Check-in date
- Check-out date
- Number of guests
- Number of nights
- Base price
- Extra guest fee
- Extra guest count
- Base amount
- Extra guest amount
- Total price
- Booking status

---

## 🧠 What I Learned

This project helped me understand and implement:

- Express.js application architecture
- MVC-style separation
- RESTful routing concepts
- MongoDB database design
- Mongoose schemas and references
- MongoDB `populate()`
- Authentication
- Authorization
- Session management
- Persistent sessions with MongoDB
- Password hashing
- Form validation
- File uploads using Multer
- Cloudinary asset storage and management
- CRUD operations
- Booking systems
- Date calculations
- Overlapping-date detection
- Dynamic pricing
- Error handling
- Middleware
- Server-side rendering with EJS
- Responsive UI development
- Tailwind CSS

---

## 🔮 Future Improvements

Possible future improvements include:

- 💰 **TruePrice** — transparent booking cost breakdown showing nightly cost, number of nights, applicable extra guest charges, fees, and final price
- ⭐ User reviews and ratings
- 🔎 Advanced property search
- 📍 Location-based search
- 🗺️ Interactive maps
- 💳 Online payment integration
- 📧 Booking confirmation emails
- 🔔 Notifications
- 📅 Host booking calendar
- 🖼️ Multiple property images
- 👤 Profile management
- 🔐 Password reset
- 📱 Improved mobile experience
- ⚡ REST API layer
- ⚛️ React frontend
- 🐳 Docker support
- 🚀 Production deployment and monitoring

---

## 📸 Screenshots

Add screenshots of the major parts of the application here.

Recommended screenshots:

1. Home page
2. Property listing
3. Property details
4. Login
5. Signup
6. Host dashboard
7. Add property page
8. Booking page
9. My bookings
10. Favourites

Example:

```text
screenshots/
├── home.png
├── homes-list.png
├── property-details1.png
├── property-details2.png
├── property-details3.png
├── login.png
├── signup1.png
├── signup2.png
├── host-dashboard.png
├── add-property1.png
├── add-property2.png
├── add-property3.png
├── booking1.png
├── booking2.png
├── bookings.png
├── bookings2.png
└── favourites.png
```

---

## 👨‍💻 Author

**Ayush**

B.Tech Student | Full-Stack Developer | AI & Technology Enthusiast

---

## ⭐ Project Status

🚧 **Active Development**

Roamnest is continuously being improved with new features, security improvements, a better user experience, and more robust production architecture.

---

## 📄 License

This project is intended for educational and portfolio purposes.
