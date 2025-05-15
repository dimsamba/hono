import { React, useState } from "react";
import supabase  from "../components/supabaseClient";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { tokens } from "../components/theme";
import { useTheme } from "@mui/material";
import { TextField } from "@mui/material";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setEmail("");
      setPassword("");
      return;
    }

    if (data) {
      navigate("/overview");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-900">
      <motion.div
        className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        {message && (
          <span className="block text-red-400 text-center mb-4">{message}</span>
        )}

        <h2 className="text-xl font-bold text-center text-blue-100 mb-6">
          Log In
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            required
            error={false} // Prevent red underline
            sx={{
              backgroundColor: "#E8F0FD",
              borderRadius: "10px",
              "& .MuiInputBase-root": {
                color: `${colors.primary[100]} !important`,
                borderRadius: "10px",
                borderColor: `${colors.redAccent[900]} !important`,
              },
              "& .MuiOutlinedInput-root": {
                "&:hover fieldset": {
                  border: "3px solid #18A198",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#A9A9A9",
                },
              },
            }}
          />

          <TextField
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            required
            sx={{
              backgroundColor: "#E8F0FD",
              borderRadius: "10px",
              "& .MuiInputBase-root": {
                color: `${colors.primary[100]} !important`,
                borderRadius: "10px",
                borderColor: `${colors.redAccent[900]} !important`,
              },
              "& .MuiOutlinedInput-root": {
                "&:hover fieldset": {
                  border: "3px solid #18A198",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#A9A9A9",
                },
              },
            }}
          />

          <button
            className="px-6 py-3 min-w-full text-lg font-semibold text-center text-blue-100 bg-gray-700 hover:bg-green-500 rounded-lg shadow-md hover:text-white transition"
            type="submit"
          >
            Log in
          </button>

          {/* <div className="flex flex-col sm:flex-row-2 items-center justify-center gap-4 mt-4">
            <Link
              to="/register"
              className="px-6 py-3 min-w-full sm:w-auto text-lg font-semibold text-center text-blue-100 bg-gray-700 hover:bg-blue-500 rounded-lg shadow-md hover:text-white transition"
              onClick={() => {
                setEmail("");
                setPassword("");
              }}
            >
              Create new Account
            </Link>
          </div> */}
        </form>
      </motion.div>
    </div>
  );
}
export default Login;
