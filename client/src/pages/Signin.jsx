import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "react-toastify"

// Set to false to silence the step-by-step logs in the browser console (F12).
const SHOW_DEBUG = true

// Backend address. Your server prints "listening on port 4000", so that is the default.
// To change it, create a .env file in the frontend root with: VITE_API_URL=http://localhost:4000/api
const API_URL = (import.meta.env.VITE_API_URL || "https://ecomerce-m62g.onrender.com//api").replace(/\/+$/, "")

// Where to go after a successful login. Change it if you want another page.
const AFTER_LOGIN_PATH = "/"

// Route of the register page (SignUp.jsx in your router).
const REGISTER_PATH = "/signup"

const emptyForm = {
    email: "",
    password: "",
}

const Signin = () => {
    const [formData, setFormData] = useState(emptyForm)
    const [showPassword, setShowPassword] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const navigate = useNavigate()

    // runs every time you type: copies the old values and replaces only the field you typed in
    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    // runs when you press "Sign in"
    const handleSubmit = async (e) => {
        e.preventDefault()   // stops the browser from reloading the page

        const url = `${API_URL}/login`
        const payload = {
            email: formData.email.trim(),
            password: formData.password,
        }

        if (SHOW_DEBUG) {
            console.log("[login] 1. sending to:", url)
            // the password is hidden in the log
            console.log("[login]    data:", { ...payload, password: "•".repeat(payload.password.length) })
        }

        setSubmitting(true)
        try {
            // send the email and password to the server as JSON
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            // read the server's reply (an empty object if it isn't JSON)
            const data = await res.json().catch(() => ({}))

            if (SHOW_DEBUG) {
                console.log("[login] 2. server replied with status:", res.status, data)
            }

            // res.ok is true only for status 200 to 299.
            // Wrong email or password comes back as 401 with "Incorrect email or password."
            if (!res.ok) {
                toast.error(data.message || "Could not sign you in.")
                return
            }

            toast.success(data.message || "Login successful.")
            setFormData(emptyForm)
            setTimeout(() => navigate(AFTER_LOGIN_PATH), 1000)
        } catch (err) {
            // only runs when fetch itself fails: server down, wrong port, CORS, no network
            console.error("[login] request failed before any reply:", err)
            toast.error("Cannot reach the server. Check your connection and try again.")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="rg-page">
            <div className="rg-card">
                <div className="rg-header">
                    <span className="rg-badge">Shoe Vista</span>
                    <h1>Welcome back</h1>
                    <p>Sign in to keep shopping</p>
                </div>

                <form onSubmit={handleSubmit} className="rg-form">
                    <div className="rg-field">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            autoComplete="email"
                            required
                            placeholder="eg. john@gmail.com"
                        />
                    </div>

                    <div className="rg-field">
                        <label htmlFor="password">Password</label>
                        <div className="rg-password">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                autoComplete="current-password"
                                required
                                placeholder="Enter your password"
                            />
                            <button
                                type="button"
                                className="rg-toggle"
                                onClick={() => setShowPassword((s) => !s)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="rg-btn" disabled={submitting}>
                        {submitting ? "Signing you in…" : "Sign in"}
                    </button>

                    <p className="rg-switch">
                        New to Shoe Vista? <Link to={REGISTER_PATH}>Create an account</Link>
                    </p>
                </form>
            </div>
        </div>
    )
}

export default Signin
