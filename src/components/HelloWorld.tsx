import React from 'react';

interface HelloWorldProps {
  message?: string;
  className?: string;
}

export const HelloWorld: React.FC<HelloWorldProps> = ({ 
  message = "Hello World",
  className = ""
}) => {
  return (
    <div className={`min-h-screen bg-gray-100 flex items-center justify-center ${className}`}>
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {message}
        </h1>
        <p className="text-lg text-gray-600">
          Welcome to curios-browser - A TypeScript React app with Tailwind CSS
        </p>
      </div>
    </div>
  );
};

export default HelloWorld;