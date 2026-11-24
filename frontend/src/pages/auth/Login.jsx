import { Link } from "react-router-dom";

const Login = () => {

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-5">

      <div className="bg-white border rounded-2xl p-8 w-full max-w-md shadow-sm">

        <h1 className="text-2xl font-bold text-center">
          Welcome to ResumeAI
        </h1>

        <p className="text-center text-slate-500 mt-2">
          AI-powered Resume Analyzer
        </p>

        <div className="mt-8 space-y-4">

          <input
            type="email"
            placeholder="Email address"
            disabled
            className="w-full border rounded-lg p-3"
          />

          <input
            type="password"
            placeholder="Password"
            disabled
            className="w-full border rounded-lg p-3"
          />

          <button
            disabled
            className="w-full bg-blue-600 text-white p-3 rounded-lg opacity-60"
          >
            Login — Coming in Module 2
          </button>

        </div>

        <p className="text-xs text-center text-slate-400 mt-5">
          Authentication will be implemented in Module 2.
        </p>

      </div>

    </div>
  );
};

export default Login;