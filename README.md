# Curios Browser

**Curios Browser** is the front-end interface for **CuriOS**, a conversational operating system where all interactions happen through natural chat. This project serves as the browser component, providing the visual interface through which users interact with CuriOS via intelligent conversations.

<img width="2880" height="1386" alt="FireShot Capture 009 - React App -  localhost" src="https://github.com/user-attachments/assets/05f9f9bf-0b63-429d-a329-887443b27e06" />


## 🌟 What is Curios Browser?

Curios Browser is the front-end component of **CuriOS**, an operating system built entirely around conversational chat. Rather than clicking through menus and dialogs, users interact with their system through natural language conversations. 

This browser interface is context-aware and adapts to what you're doing - whether you're browsing the web, managing files, taking notes, or configuring your system. Unlike traditional chatbots that operate in isolation, Curios Browser integrates with your current context to provide relevant, actionable assistance through the CuriOS backend.

### Key Features

As the front-end of CuriOS, this browser provides context-aware conversational interfaces for:

- **🖥️ Browser Context**: Interact with web pages through chat - read, summarize, and save content conversationally
- **📁 Files Context**: Access and manage your workspace files through natural language
- **📝 Notes Context**: Build and query your personal knowledge base via conversation
- **🔐 System Management**: Configure AI providers, manage your account, and complete onboarding through guided chat

Whether you're researching a topic, organizing files, or building a knowledge repository, the Curios Browser adapts to your current task and provides intelligent support tailored to your needs - all through conversational interactions with CuriOS.

## 🚀 Technical Features

This front-end application is built with modern web technologies to ensure a fast, reliable, and maintainable codebase:

- **TypeScript** - Type-safe React development for robust code
- **React 19** - Latest React features for optimal performance
- **Tailwind CSS** - Utility-first CSS framework for rapid, responsive UI development
- **Storybook** - Component development and documentation environment
- **Supabase Integration** - Authentication and session management
- **Yarn** - Fast, reliable package manager
- **Webpack** - Optimized module bundler (via Create React App)
- **Testing Suite** - Jest and React Testing Library for comprehensive testing

## 📦 Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- Yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/curi-os/curios-browser.git
cd curios-browser
```

2. Install dependencies:
```bash
yarn install
```

## Supabase setup (optional)

Some features (auth/session) require Supabase.

- Copy `.env.example` to `.env.local` (recommended) or `.env`
- Set:
	- `REACT_APP_SUPABASE_URL` (must be a valid `http(s)` URL, usually `https://<project-ref>.supabase.co`)
	- `REACT_APP_SUPABASE_ANON_KEY`
- Restart `yarn start` after changing env vars (Create React App only reads them at startup)

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `yarn build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `yarn eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
