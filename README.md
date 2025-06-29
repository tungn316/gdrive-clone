# G-Drive Clone

Used v0 for base of frontend. G-drive clone using nextjs, convex db, uploadthing and clerk

LLM output below btw not my fault if anything is incorrect =D

A Google Drive clone built with modern web technologies, featuring file upload, folder management, and cloud storage capabilities.

## 🚀 Features

- **File Management**: Upload, download, preview, and organize files
- **Folder System**: Create and navigate through folders
- **File Preview**: Preview images, PDFs, videos, and audio files
- **Trash Management**: Move files to trash and restore them
- **User Authentication**: Secure login with Google and GitHub
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Theme**: Modern dark UI design

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Database**: Convex (real-time database)
- **Authentication**: Clerk (Google & GitHub OAuth)
- **File Upload**: UploadThing
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Lucide icons

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- npm or yarn
- Git

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd gdrive-clone
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory and add the following variables:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Convex Database
NEXT_PUBLIC_CONVEX_URL=your_convex_url

# UploadThing
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id
```

### 4. Set Up Services

#### Clerk Authentication
1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Configure Google and GitHub OAuth providers
4. Copy your publishable and secret keys

#### Convex Database
1. Go to [convex.dev](https://convex.dev) and create an account
2. Create a new project
3. Copy your project URL

#### UploadThing
1. Go to [uploadthing.com](https://uploadthing.com) and create an account
2. Create a new application
3. Copy your app ID and secret

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 📁 Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── api/               # API routes
│   ├── folder/            # Folder pages
│   └── trash/             # Trash pages
├── components/            # React components
│   ├── ui/               # UI components
│   ├── file-browser.tsx  # Main file browser
│   ├── file-item.tsx     # Individual file item
│   ├── file-preview-modal.tsx # File preview modal
│   ├── header.tsx        # Header component
│   ├── sidebar.tsx       # Sidebar navigation
│   └── upload-button.tsx # Upload functionality
├── lib/                  # Library files
│   ├── hooks/           # Custom React hooks
│   └── utils.ts         # Utility functions
├── utils/               # Utility files
│   ├── file-utils.ts    # File-related utilities
│   ├── upload-utils.ts  # Upload utilities
│   ├── navigation-utils.ts # Navigation utilities
│   └── search-utils.ts  # Search utilities
└── middleware.ts        # Next.js middleware
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database powered by [Convex](https://convex.dev/)
- Authentication by [Clerk](https://clerk.com/)
- File uploads handled by [UploadThing](https://uploadthing.com/)
- Icons from [Lucide](https://lucide.dev/)

