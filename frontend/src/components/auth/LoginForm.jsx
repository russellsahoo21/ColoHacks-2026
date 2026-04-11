import { Link } from "react-router-dom";

const LoginForm = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#eef2f7] to-[#f8fafc]">
      {/* Background Glow */}
      <div className="absolute w-[500px] h-[500px] bg-blue-100 rounded-full blur-3xl opacity-30"></div>

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
        <h2 className="text-2xl font-bold text-gray-800">Clinician Access</h2>
        <p className="text-sm text-gray-500 mb-6">
          Please authenticate to access patient records and ward management
          tools.
        </p>

        {/* Form */}
        <form className="space-y-5">
          {/* ID */}
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase">
              Clinician ID
            </label>

            <div className="flex items-center border border-gray-200 rounded-lg mt-1 px-3 py-2 bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500 transition">
              <span className="text-gray-400 mr-2">👤</span>
              <input
                type="text"
                placeholder="WW-00000"
                className="w-full bg-transparent outline-none text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between">
              <label className="text-[11px] font-semibold text-gray-500 uppercase">
                Password
              </label>
              <span className="text-xs text-blue-600 cursor-pointer hover:underline">
                Forgot Password?
              </span>
            </div>

            <div className="flex items-center border border-gray-200 rounded-lg mt-1 px-3 py-2 bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500 transition">
              <span className="text-gray-400 mr-2">🔒</span>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-transparent outline-none text-sm"
              />
              <span className="text-gray-400 cursor-pointer">👁️</span>
            </div>
          </div>

          {/* Button */}
          <button
            type="button"
            className="w-full bg-gradient-to-r from-blue-700 to-blue-600 text-white py-2.5 rounded-lg font-semibold shadow-lg hover:scale-[1.02] transition duration-300"
          >
            Sign In →
          </button>
        </form>

        {/* Warning */}
        <div className="mt-5 bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-lg">
          ⚠ Unauthorized access to this terminal is strictly prohibited. All
          activities are monitored and logged for clinical auditing purposes.
        </div>

        {/* Footer */}
        <p className="text-sm text-center mt-5 text-gray-600">
          Don’t have an account?{" "}
          <Link
            to="/register"
            className="text-blue-600 font-semibold hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
