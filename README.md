# curios-browser

A TypeScript React application built with Create React App, featuring Webpack, Yarn, Tailwind CSS, and Storybook.

![Hello World App](https://github.com/user-attachments/assets/0a9d9147-ea8a-47fb-acb7-241e3055c7fb)

## 🚀 Features

- **TypeScript** - Type-safe React development
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **Storybook** - Component development and documentation
- **Yarn** - Fast, reliable package manager
- **Webpack** - Module bundler (via Create React App)
- **Testing** - Jest and React Testing Library setup

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

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
