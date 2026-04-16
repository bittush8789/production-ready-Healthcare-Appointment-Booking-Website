# Green Valley Clinic

A modern healthcare appointment booking system for Green Valley Clinic, featuring doctor listings, real-time booking, and an admin dashboard.

## 🚀 Features

- **User Authentication**: Secure login using Firebase Authentication.
- **Doctor Directory**: Browse doctors by specialization with ratings and experience.
- **Real-time Booking**: Book appointments instantly with your preferred doctor.
- **Patient Dashboard**: Manage your upcoming and past appointments.
- **Admin Dashboard**: Comprehensive control panel for managing doctors and appointments.
- **Dynamic Data**: Seeded with professional doctor profiles and placeholder images.
- **DevSecOps Ready**: Integrated CI/CD, Docker, Kubernetes, and security scanning.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend**: Node.js, Express (Full-stack architecture).
- **Database/Auth**: Firebase Firestore & Firebase Auth.
- **Deployment**: Docker, Kubernetes, GitHub Actions.
- **Monitoring**: Prometheus, Grafana.
- **Security**: SonarQube, Gitleaks, OWASP ZAP.

## 💻 Local Setup Instructions

Follow these steps to get the project running on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)
- [Firebase Account](https://firebase.google.com/) (to set up your own project)

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository (replace with your repo URL)
git clone <your-repo-url>
cd green-valley-clinic

# Install dependencies
npm install
```

### Step 2: Environment Configuration

1. Create a `.env` file in the root directory.
2. Add your Firebase configuration (refer to `.env.example`).
3. Ensure your `firebase-applet-config.json` is correctly set up with your Firebase project credentials.

### Step 3: Start the Development Server

This project runs in full-stack mode (Express + Vite).

```bash
# Start the server in development mode
npm run dev
```

The application will be available at `http://localhost:3000`.

### Step 4: Seed Data (Optional)

Once the app is running, log in as an admin and navigate to the **Admin Dashboard** to click "Seed Initial Data". This will populate your Firestore database with sample doctors and appointments.

## 🐳 Docker & DevOps

For production deployment and CI/CD instructions, please refer to the [DEVOPS.md](./DEVOPS.md) file.

### Build Docker Image Locally
```bash
docker build -t green-valley-clinic .
docker run -p 3000:3000 green-valley-clinic
```

## 📂 Project Structure

- `/src`: Frontend React application.
- `/src/components`: UI components.
- `/server.ts`: Express backend entry point.
- `/k8s`: Kubernetes manifests.
- `/monitoring`: Prometheus and Grafana configurations.
- `/.github/workflows`: CI/CD pipeline definitions.

## 📄 License

This project is open-source and available under the MIT License.
