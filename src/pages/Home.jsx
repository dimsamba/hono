import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <div className="flex flex-col space-y-4">
        <Link
          to="/register"
          className="px-10 py-3 text-lg font-semibold text-center text-blue-300  bg-gray-700  rounded-lg shadow-lg hover:bg-gray-600 transition"
        >
          Sign in
        </Link>
        <Link
          to="/login"
          className="px-10 py-3 text-lg font-semibold text-center text-green-400  bg-gray-700  rounded-lg shadow-lg hover:bg-gray-600 transition"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}

export default Home;
