import React from 'react'
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="w-full h-screen flex flex-col justify-center items-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <Link
        to="/"
        className="text-sm font-semibold mt-5 border border-black px-3 py-2 rounded-lg"
      >
        Go back to home
      </Link>
    </div>
  );
}

export default NotFound
