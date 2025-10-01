# 🎶 Moodify

A full-stack web application designed to enhance your daily experience by intelligently curating music and content based on your current mood.

![Version](https://img.shields.io/badge/version-1.0.0-blue) ![License](https://img.shields.io/badge/license-None-lightgrey)


---


## ✨ Features

*   🎵 **Personalized Music Curation:** Integrates seamlessly with the Spotify API to suggest playlists and tracks tailored to your detected mood, creating the perfect auditory backdrop for your day.
*   🧠 **Intelligent Mood Tracking:** Offers an intuitive and user-friendly interface for logging and visualizing your emotional state over time, helping you understand your well-being patterns.
*   🤖 **Machine Learning Powered Insights:** Utilizes Python-based machine learning models to refine mood detection and enhance content recommendations, providing a truly personalized experience.
*   🚀 **Modern & Responsive UI:** Built with React, Tailwind CSS, and Radix UI, Moodify delivers a fast, accessible, and visually appealing experience that adapts effortlessly across all devices.
*   🔒 **Secure User Authentication:** Implements robust authentication with Passport.js and session management, ensuring a personalized and secure environment for all your data.

---


## 🛠️ Installation

To get Moodify up and running on your local machine, follow these steps:

### Prerequisites

Ensure you have the following installed:

*   [Node.js](https://nodejs.org/) (LTS version recommended)
*   [Python 3.10+](https://www.python.org/downloads/)
*   [uv](https://github.com/astral-sh/uv) (Python package manager, install with `pip install uv`)
*   A PostgreSQL database instance (local or cloud-hosted, e.g., [Neon DB](https://neon.tech/))
*   [Git](https://git-scm.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/ZaynHakeem/Moodify.git
cd Moodify
```

### 2. Environment Configuration

Create a `.env` file in both the `server/` and `client/` directories based on the `.env.example` files (if provided, otherwise create as follows).

#### `server/.env`

```env
DATABASE_URL="postgresql://user:password@host:port/database"
SPOTIFY_CLIENT_ID="your_spotify_client_id"
SPOTIFY_CLIENT_SECRET="your_spotify_client_secret"
SESSION_SECRET="a_very_secret_string"
```

#### `client/.env`

```env
VITE_SERVER_URL="http://localhost:3000" # Or your deployed server URL
VITE_SPOTIFY_REDIRECT_URI="http://localhost:5173/auth/spotify/callback"
```

**Note:** Obtain your Spotify API credentials from the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/).

### 3. Database Migration

Navigate to the `server` directory and run Drizzle migrations:

```bash
cd server
npm install
npx drizzle-kit push:pg
```

### 4. Setup and Run the Server

From the `server` directory:

```bash
npm install
npm run dev
```

The server will typically run on `http://localhost:3000`.

### 5. Setup and Run the Client

In a new terminal, navigate to the `client` directory:

```bash
cd client
npm install
npm run dev
```

The client application will typically run on `http://localhost:5173`.

### 6. Setup and Run the ML Service (Optional, for full functionality)

In another new terminal, navigate to the `ml` directory:

```bash
cd ml
uv sync # Installs Python dependencies
uv run python main.py # Or the appropriate command to start your ML service/script
```

---


## 🚀 Usage Examples

Once the client and server are running, open your web browser and navigate to `http://localhost:5173`.

1.  **Sign Up / Log In:** Create a new account or log in with existing credentials. Moodify uses secure authentication to protect your data.
2.  **Connect Spotify:** Authorize Moodify to access your Spotify account. This is essential for personalized music recommendations.
3.  **Track Your Mood:** Use the intuitive UI to log your current mood. You can provide details, select emojis, or use other input methods.
4.  **Explore Recommendations:** Based on your logged mood, Moodify will present you with curated Spotify playlists and tracks designed to complement or uplift your emotional state.
5.  **View Insights:** Over time, explore graphs and summaries of your mood patterns to gain insights into your well-being.

![Moodify Usage Screenshot Placeholder](/attached_assets/usage_screenshot_placeholder.png)
*Example: Mood Tracking Interface*

---


## 🗺️ Project Roadmap

Moodify is continuously evolving! Here are some features and improvements planned for the future:

*   **Advanced Sentiment Analysis:** Integrate more sophisticated natural language processing (NLP) for deeper mood detection from user input.
*   **Content Integration:** Expand beyond music to include recommendations for podcasts, articles, or mindfulness exercises based on mood.
*   **Mobile Application:** Develop native iOS and Android applications for a seamless experience on the go.
*   **Community Features:** Allow users to share mood insights, playlists, and connect with others in a supportive environment.
*   **Personalized Dashboards:** Offer customizable dashboards for users to arrange and prioritize the information most relevant to their well-being.

---


## 🤝 Contribution Guidelines

We welcome contributions to Moodify! To ensure a smooth collaboration, please follow these guidelines:

1.  **Fork and Clone:** Fork the repository and clone it to your local machine.
2.  **Create a Branch:** Create a new branch for your feature or bug fix: `git checkout -b feature/your-feature-name` or `bugfix/issue-description`.
3.  **Code Style:** Adhere to the existing code style (ESLint/Prettier for TypeScript/JavaScript, Black/isort for Python). Ensure `npm run lint` and `npm run format` (or equivalent for Python) pass before committing.
4.  **Commit Messages:** Write clear, concise, and descriptive commit messages following the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.
5.  **Testing:** If applicable, add unit or integration tests for your changes. Ensure all existing tests pass.
6.  **Pull Requests:** Submit a pull request to the `main` branch. Provide a detailed description of your changes and reference any related issues.

---


## ⚖️ License Information

This project currently does not have an explicit license. All rights are reserved by the main contributor.
For any usage, modification, or distribution, please contact the main contributor, ZaynHakeem.

**Main Contributors:** ZaynHakeem
