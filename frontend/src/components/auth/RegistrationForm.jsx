import { Link } from "react-router-dom";

const RegisterForm = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#eef2f7] to-[#f8fafc]">
      {/* 🔥 Brand */}
      <h1 className="text-2xl font-bold text-blue-700 mb-6">WardWatch</h1>

      {/* Card */}
      <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl w-[400px] p-8 border border-gray-200">
        {/* Left Accent */}
        <div className="absolute left-0 top-0 h-full w-[3px] bg-blue-700 rounded-l-2xl"></div>

        {/* Badge */}
        <div className="flex justify-center mb-4">
          <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">
            🔒 Secure Clinical Environment
          </span>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-800">Register Hospital</h2>
        <p className="text-sm text-gray-500 mb-6">
          Create a hospital account to manage wards and staff.
        </p>

        {/* Form */}
        <form className="space-y-4">
          {/* Hospital Name */}
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase">
              Hospital Name
            </label>
            <input
              type="text"
              placeholder="CityCare Hospital"
              className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Hospital ID */}
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase">
              Hospital ID
            </label>
            <input
              type="text"
              placeholder="HOSP-001"
              className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase">
              Admin Email
            </label>
            <input
              type="email"
              placeholder="admin@hospital.com"
              className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Wards */}
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase">
              Number of Wards
            </label>
            <input
              type="number"
              placeholder="10"
              className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Address */}
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase">
              Hospital Address
            </label>
            <textarea
              rows={2}
              placeholder="Enter hospital address..."
              className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Button */}
          <button
            type="button"
            className="w-full bg-gradient-to-r from-blue-700 to-blue-600 text-white py-2.5 rounded-lg font-semibold shadow-md hover:scale-[1.02] transition duration-300"
          >
            Register →
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-4">
          <div className="flex-grow h-px bg-gray-200"></div>
          <span className="px-2 text-xs text-gray-400">OR</span>
          <div className="flex-grow h-px bg-gray-200"></div>
        </div>

        {/* Login */}
        <p className="text-sm text-center text-gray-600">
          Already registered?{" "}
          <Link
            to="/login"
            className="text-blue-600 font-semibold hover:underline"
          >
            Login
          </Link>
        </p>

        {/* Warning */}
        <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs p-3 rounded-lg">
          ⚠ Only authorized admins should register hospitals.
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
