# 🏡 Roamnest — Full-Stack Accommodation Booking Platform

Roamnest is a full-stack accommodation booking web application inspired by modern property rental platforms. It allows guests to discover properties, save favourites, and make reservations, while hosts can manage property listings and oversee bookings.

The project demonstrates practical full-stack development concepts, including authentication, authorization, database relationships, dynamic pricing, cloud-based file uploads, and booking management.

**Live Demo:** [Roamnest](https://roamnest-dbd2.onrender.com)  
**GitHub Repository:** [AyushSolanki22/roamnest](https://github.com/AyushSolanki22/roamnest)

> **Disclaimer:** Roamnest is an independent educational project inspired by accommodation-booking platforms. It is not affiliated with or endorsed by Airbnb.

---

## ✨ Features

### 🔐 Authentication & Authorization
- User registration, login, and logout.
- Password hashing using `bcryptjs`.
- Session-based authentication with MongoDB-backed session storage.
- Guest and host account types.
- Input validation using `express-validator`.
- Protected routes and host ownership checks.

### 🏠 Property Management
- Create, view, edit, and delete property listings.
- Manage property names, locations, descriptions, and nightly prices.
- Configure guest capacity and additional guest charges.
- Upload property images and house-rules PDF documents.
- Replace existing uploaded assets.

### 🔎 Property Discovery
- Browse available property listings.
- Search by property name or location.
- Filter by minimum price, maximum price, and guest capacity.
- Sort listings using supported price, rating, and listing-order options.
- View detailed property information.

### 📅 Booking Management
- Select check-in and check-out dates.
- Specify the number of guests.
- Calculate stay duration and booking totals.
- Validate dates and maximum guest capacity.
- Prevent bookings for past dates and overlapping reservations.
- Prevent hosts from booking their own properties.
- View booking details and manage cancellations.

### 💰 Dynamic Pricing
Roamnest calculates booking prices based on the nightly property rate, duration of stay, and additional guests.

**Base amount**

`Nightly Price × Number of Nights`

**Additional guest amount**

`Extra Guests × Extra Guest Fee × Number of Nights`

**Total booking price**

`Base Amount + Additional Guest Amount`

### ⚡ Early Checkout & Refund Tracking
- Submit early-checkout requests.
- Allow hosts to review and approve or reject requests.
- Recalculate booking totals when early checkout is approved.
- Track approved refund amounts and refund status.

### ❤️ Favourites
- Add properties to favourites.
- View saved properties.
- Remove properties from favourites.
- Store favourite property references in MongoDB.

### ⭐ Guest Reviews & Ratings
- Support guest-submitted property reviews.
- Display ratings derived from guest feedback.
- Handle listings that have not received reviews.

### 📊 Host Dashboard
- Manage host-owned properties.
- View bookings associated with hosted listings.
- Filter bookings by property and booking status.
- Review booking summaries and early-checkout refund information.

### 📸 File Uploads
- Handle uploads using Multer.
- Store supported media assets in Cloudinary.
- Support property images and house-rules PDFs.
- Validate permitted file types and extensions.
- Track asset information for replacement and deletion.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | Backend framework and routing |
| MongoDB | NoSQL database |
| Mongoose | Database schemas and operations |
| EJS | Server-side rendering |
| HTML5 | Page structure |
| CSS3 | Styling |
| Tailwind CSS | Utility-first styling |
| Express Session | Session-based authentication |
| `connect-mongodb-session` | Persistent session storage |
| `bcryptjs` | Password hashing |
| `express-validator` | Request and form validation |
| Multer | File upload handling |
| Cloudinary | Cloud media storage |

---

## 🏗️ Application Architecture

Roamnest follows an MVC-style architecture that separates application responsibilities.

- **Models:** Define data structures and database operations.
- **Views:** Render dynamic pages using EJS templates and reusable partials.
- **Controllers:** Handle application logic for authentication, properties, bookings, and host operations.
- **Routes:** Map HTTP requests to the appropriate controllers.
- **Middleware:** Handle authentication, authorization, uploads, and request processing.
- **Cloud storage:** Cloudinary stores uploaded property assets.

### Project Structure

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
│   ├── styles/
│   └── ...
├── middleware/
│   └── fileUpload.js
├── utils/
│   ├── cloudinary.js
│   └── ...
├── app.js
├── package.json
├── package-lock.json
├── .env
└── .gitignore
```

---

## 🗄️ Data Models

Roamnest uses MongoDB and Mongoose to manage users, property listings, and bookings.

### User Model
Represents registered guests and hosts.

- Name and email address.
- Hashed password.
- Account type.
- References to favourite properties.

### Home Model
Represents accommodation listings managed by hosts.

- Property name, location, and description.
- Nightly price and maximum guest capacity.
- Additional guest charges.
- Rating information.
- Property image URL and upload metadata.
- House-rules document URL and metadata.
- Reference to the host who owns the listing.

### Booking Model
Represents reservations made by guests.

- References to the guest and property.
- Check-in and check-out dates.
- Number of guests and nights.
- Base price and additional guest charges.
- Calculated booking total.
- Booking status.
- Early-checkout request and refund information.

### Model Relationships

```text
User
 ├── Favourite Properties ──> Home
 ├── Guest Bookings ────────> Booking
 └── Hosted Properties ─────> Home

Home
 ├── Host ─────────────────> User
 └── Bookings ─────────────> Booking

Booking
 ├── Guest ────────────────> User
 └── Property ─────────────> Home
```

Mongoose references connect related documents and allow associated information to be retrieved when needed.

---

## 🚀 Getting Started

Follow these steps to run Roamnest locally.

### Prerequisites

- [Node.js](https://nodejs.org/)
- npm
- [MongoDB Atlas](https://www.mongodb.com/atlas) or a local MongoDB instance
- [Cloudinary](https://cloudinary.com/) account for cloud-based uploads

### 1. Clone the repository

```bash
git clone https://github.com/AyushSolanki22/roamnest.git
cd roamnest
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the `.env` file

Create a file named `.env` in the project's root directory, alongside `app.js` and `package.json`.

Add the following environment variables:

```env
PORT=3001

MONGODB_URI=your_mongodb_connection_string

SESSION_SECRET=your_long_random_session_secret

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Replace the placeholder values with your actual credentials. The variable names must match those used by the application's configuration.

### Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Port on which the Express server runs |
| `MONGODB_URI` | MongoDB connection string |
| `SESSION_SECRET` | Secret used to secure session identifiers |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

### 4. Start the application

```bash
npm start
```

Open the local address displayed in your terminal. If the configured port is `3001`, the application will typically be available at:

`http://localhost:3001`

### 5. Build Tailwind CSS

If your project has the Tailwind build script configured, run:

```bash
npm run tailwind:build
```

---

## 🔒 Security

Roamnest incorporates security-related mechanisms to protect user accounts and application workflows.

- Password hashing using `bcryptjs`.
- Session-based authentication.
- Protected routes and authorization checks.
- Server-side input validation.
- Booking date, guest-capacity, and pricing validation.
- Ownership checks for host-managed resources.
- File-upload handling for supported media types.
- Environment variables for sensitive configuration.

Never commit `.env` or real credentials to the repository. Configure production secrets through the hosting provider's environment settings and use secure session-cookie settings in production.

---

## 🧪 Testing Checklist

- [ ] Registration, login, logout, and session persistence.
- [ ] Property creation, editing, deletion, and ownership validation.
- [ ] Image and PDF upload validation.
- [ ] Booking creation and date validation.
- [ ] Prevention of overlapping reservations.
- [ ] Dynamic pricing for different stay durations and guest counts.
- [ ] Booking cancellation.
- [ ] Early-checkout approval and refund calculations.
- [ ] Host dashboard filters.
- [ ] Guest reviews and property-rating calculations.
- [ ] Production deployment and error handling.

---

## 🧠 What I Learned

Building Roamnest helped me gain practical experience in full-stack development and understand how frontend interfaces, backend logic, and database operations work together.

- **Backend Development:** Building server-side applications using Node.js and Express.js.
- **MVC Architecture:** Separating routes, controllers, models, and views.
- **Database Management:** Designing Mongoose schemas and working with MongoDB references and populated documents.
- **Authentication & Authorization:** Implementing password hashing, session management, protected routes, and ownership checks.
- **Business Logic:** Developing booking workflows, validating date ranges, preventing overlapping reservations, and calculating dynamic prices.
- **File Uploads:** Integrating Multer and Cloudinary for property images and documents.
- **Server-Side Rendering:** Creating dynamic pages and reusable templates using EJS.
- **Form Validation:** Validating user input and handling invalid requests.
- **Error Handling:** Managing application errors and request-processing issues.
- **Frontend Development:** Building interfaces using HTML, CSS, Tailwind CSS, and JavaScript.
- **Environment Configuration:** Managing application secrets and configuration.
- **End-to-End Development:** Understanding how user actions connect to application logic, database operations, and rendered pages.

---

## 🔮 Future Improvements

- Automated integration and end-to-end testing.
- Booking confirmation and cancellation emails.
- Payment gateway integration with reliable payment and refund handling.
- Calendar-based availability management.
- Pagination for property listings and booking records.
- Improved application monitoring, logging, and deployment reliability.
- A React frontend backed by a dedicated API.

---

## 👨‍💻 Author

**Ayush Solanki**  
B.Tech Student | Full-Stack Development | Software Engineering

- GitHub: [@AyushSolanki22](https://github.com/AyushSolanki22)
