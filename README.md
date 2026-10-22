# 🏡 Roamnest — Full-Stack Accommodation Booking Platform

**Find your stay. Make it yours.**

Roamnest is a full-stack, Airbnb-inspired accommodation booking platform built to explore real-world web development concepts, including authentication, property management, booking workflows, session persistence, file uploads, MongoDB relationships, and dynamic pricing.

> **Disclaimer:** Roamnest is an independent educational project inspired by accommodation booking platforms. It is not affiliated with, sponsored by, or endorsed by Airbnb.

---

## ✨ Features

### 🔐 Authentication & Authorization
- User registration and login
- Password hashing using `bcrypt`
- Session-based authentication
- Persistent sessions using MongoDB session storage
- Logout functionality
- Guest and Host account types
- Password strength and email validation
- Confirm-password validation
- Terms and conditions acceptance
- Protected routes for authenticated users
- Host-only routes and property ownership checks

### 🏡 Property Management
Hosts can:
- Create property listings with names, descriptions, and locations
- Set nightly prices and maximum guest capacity
- Configure additional guest charges
- Add property ratings and descriptions
- Upload property images and house-rules PDFs
- View and manage their listings
- Edit property details
- Replace uploaded images and documents
- Delete property listings

### 📸 File Uploads
Implemented with **Multer**.

Supported formats:
- **Property images:** JPG, JPEG, PNG, WEBP
- **House rules:** PDF

The upload middleware validates file types and extensions before accepting uploads.

File storage depends on the configured upload implementation. If Cloudinary is enabled, uploaded assets can be stored remotely instead of relying on temporary server storage.

### ❤️ Favourites
- Add properties to favourites
- View favourite properties
- Remove properties from favourites
- Store property references in MongoDB and populate them when needed

### 📅 Booking System
Authenticated users can book properties with:
- Check-in and check-out dates
- Guest count
- Calculated number of nights
- Base nightly price
- Extra guest charges
- Base booking amount
- Extra guest amount
- Final booking price
- Booking status

Booking validation covers:
- Past or invalid dates
- Check-out dates before check-in
- Guest capacity limits
- Hosts attempting to book their own properties
- Overlapping bookings for the same property

### 💰 Dynamic Pricing
Roamnest calculates booking costs using the property's nightly rate and applicable extra guest charges.

**Base amount**
```text
Nightly Price × Number of Nights
```

**Extra guest amount**
```text
Extra Guests × Extra Guest Fee × Number of Nights
```

**Final price**
```text
Base Amount + Extra Guest Amount
```

### ❌ Booking Management
- View personal bookings
- Review booking details
- Cancel confirmed bookings
- Retain cancelled bookings with a `cancelled` status

### 🛡️ Validation & Security
- Password and email validation
- Authentication and authorization middleware
- Host ownership checks
- Booking ownership checks
- Guest capacity validation
- Date validation and booking conflict checks
- Upload type and extension validation
- Centralized error-handling middleware

---

## 🧰 Tech Stack

| Layer | Technologies |
|---|---|
| Runtime | Node.js |
| Backend | Express.js |
| Database | MongoDB Atlas |
| ODM | Mongoose |
| Authentication | Express Session, bcryptjs |
| Session storage | connect-mongodb-session |
| Validation | express-validator |
| File uploads | Multer |
| Templating | EJS |
| Frontend | HTML5, CSS3, Tailwind CSS |
| Asset storage | Local storage or Cloudinary, depending on configuration |

---

## 🏗️ Project Architecture

The application follows a modular, MVC-style Express architecture.

```text
roamnest/
├── controllers/
│   ├── authController.js
│   ├── bookingController.js
│   ├── hostController.js
│   ├── storeController.js
│   └── error.js
├── models/
│   ├── user.js
│   ├── home.js
│   └── booking.js
├── routes/
│   ├── auth.js
│   ├── booking.js
│   ├── host.js
│   └── store.js
├── views/
│   ├── auth/
│   ├── host/
│   ├── store/
│   └── partials/
├── public/
│   ├── css/
│   └── ...
├── middleware/
├── utils/
├── uploads/              # If local uploads are used
├── app.js
├── package.json
├── package-lock.json
├── .env                  # Not committed
└── .gitignore
```

*The exact folder structure may vary as the project evolves.*

### Database Relationships

```text
User
 ├── Favourites ──> Home
 ├── Bookings ────> Booking
 └── Hosted Homes ─> Home

Home
 └── Host ────────> User

Booking
 ├── User ────────> User
 └── Home ────────> Home
```

---

## 🔑 Environment Variables

Create a `.env` file in the project root.

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_long_random_session_secret

# Required only if Cloudinary uploads are configured
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Keep credentials private. **Never commit `.env` or expose API secrets in your repository.**

---

## 🚀 Getting Started

### Prerequisites
- Node.js and npm
- A MongoDB database, such as MongoDB Atlas
- Git

### 1. Clone the repository

Replace `YOUR_USERNAME` with your GitHub username.

```bash
git clone https://github.com/YOUR_USERNAME/roamnest.git
```

### 2. Enter the project directory

```bash
cd roamnest
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file in the project root and add your MongoDB connection string and session secret. Add Cloudinary credentials if your current upload implementation uses Cloudinary.

### 5. Start the application

```bash
npm start
```

If your project defines a separate development script, you can use:

```bash
npm run dev
```

### 6. Open Roamnest

Visit:

```text
http://localhost:3000
```

*Use the port configured by your application if it differs from `3000`.*

---

## 👥 User Roles

### Guest
- Register and log in
- Browse available properties
- View property details
- Add or remove favourites
- Book properties
- View bookings
- Cancel bookings

### Host
- Register as a host
- Create property listings
- Upload property images and house-rules documents
- View hosted properties
- Edit listing information
- Replace uploaded assets
- Delete listings

---

## 🔄 Booking Workflow

```text
Browse Properties
       ↓
Select a Property
       ↓
Choose Dates and Guests
       ↓
Validate Dates and Guest Capacity
       ↓
Check Booking Conflicts
       ↓
Calculate Booking Price
       ↓
Create Booking
       ↓
View Booking in My Bookings
```

---

## 🗄️ Data Models

### User
Stores user identity, email, hashed password, account type, and favourite property references.

### Home
Stores property details, location, pricing, guest capacity, extra guest fees, images, descriptions, house rules, and host references.

### Booking
Stores property and user references, check-in/check-out dates, guest count, number of nights, price breakdown, total amount, and booking status.

---

## 🧠 Key Learning Outcomes

Building Roamnest has provided practical experience with:
- Express.js architecture and MVC-style organization
- Routing, controllers, and middleware
- MongoDB data modeling and Mongoose references
- Mongoose `populate()`
- Authentication and authorization
- Session persistence using MongoDB
- Password hashing and form validation
- File uploads and asset management
- CRUD operations
- Booking workflows and date calculations
- Overlapping-date detection
- Dynamic pricing
- Error handling
- EJS server-side rendering
- Responsive UI development with Tailwind CSS

---

## 🔮 Roadmap

Potential improvements planned for future versions:

- [ ] Transparent price breakdown (**TruePrice**)
- [ ] Advanced property search and filters
- [ ] Location-based search and interactive maps
- [ ] User reviews and ratings
- [ ] Online payment integration
- [ ] Booking confirmation emails
- [ ] Notifications
- [ ] Host availability calendar
- [ ] Multiple images per property
- [ ] Profile management and password reset
- [ ] Improved mobile experience
- [ ] REST API layer
- [ ] React frontend
- [ ] Docker support
- [ ] Production deployment and monitoring

---

## 📸 Screenshots

Add screenshots of the current Roamnest UI to showcase the application.

Suggested structure:

```text
screenshots/
├── home.png
├── homes-list.png
├── property-details.png
├── login.png
├── signup.png
├── host-dashboard.png
├── add-property.png
├── booking.png
├── bookings.png
└── favourites.png
```

Once these images are added to the repository, embed them here using relative Markdown image paths.

---

## 👨‍💻 Author

**Ayush Solanki**

B.Tech Student | Full-Stack Developer | AI & Technology Enthusiast

---

## 🚧 Project Status

**Active Development**

Roamnest is an evolving portfolio project focused on building practical full-stack development skills, improving the user experience, and implementing more robust booking functionality.

---

## 📄 License

This project is intended for educational and portfolio purposes. Add a `LICENSE` file if you want to distribute it under a specific open-source license.
