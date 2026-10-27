import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

// Backend address. Set VITE_API_URL in a .env file, or edit the fallback.
const API_URL = (import.meta.env.VITE_API_URL || "https://ecomerce-m62g.onrender.com/api").replace(/\/+$/, "")

// Route of your login page. Change it if yours is different.
const LOGIN_PATH = "/Signup"

const emptyForm = {
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
}

const Signup = () => {
    const [formData, setFormData] = useState(emptyForm)
    const [submitting, setSubmitting] = useState(false)
    const [status, setStatus] = useState({ type: "", text: "" })   // type: "success" | "error"
    const navigate = useNavigate()

    // runs on every keystroke: updates only the field being typed in
    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setStatus({ type: "", text: "" })

        if (formData.password.length < 8) {
            setStatus({ type: "error", text: "Password must be at least 8 characters." })
            return
        }

        setSubmitting(true)
        try {
            const res = await fetch(`${API_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })
            const data = await res.json().catch(() => ({}))

            if (!res.ok) {
                // e.g. "A user with such email exists"
                setStatus({ type: "error", text: data.message || "Could not create your account." })
                return
            }

            setStatus({ type: "success", text: data.message || "Account created successfully." })
            setFormData(emptyForm)
            setTimeout(() => navigate(LOGIN_PATH), 1500)
        } catch {
            setStatus({ type: "error", text: "Cannot reach the server. Check your connection and try again." })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <>
        <div className="signin-page">
            <form onSubmit={handleSubmit}>
            <div className="signin-header">
                <p>Welcome to Shoe Vista </p>
                <h3>Create Your Account</h3>
                <p>Your number one trusted Shoe platform</p>
            </div>
            <div className="form">
                <div className="div-group">
                    <div className="div2">
                        <label htmlFor="firstName">First Name</label>
                        <input
                            id="firstName"
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                            placeholder="eg. john"
                        />
                    </div>
                    <div className="div2">
                        <label htmlFor="lastName">Last Name</label>
                        <input
                            id="lastName"
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                            placeholder="eg. doe"
                        />
                    </div>
                </div>
                <div className="div">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                        id="phone"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        placeholder="eg. +254712345678"
                    />
                </div>

                <div className="div">
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="eg. john@gmail.com"
                    />
                </div>
                <div className="div">
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={8}
                        maxLength={72}
                        placeholder="create your password"
                    />
                </div>
            </div>

            <button type="submit" className="signup-btn" disabled={submitting}>
                {submitting ? "Creating your account…" : "Create your Account"}
            </button>

            {status.text && (
                <p className={`signin-status signin-status--${status.type}`} role="status">
                    {status.text}
                </p>
            )}

            <p className="p">Already have an account? <Link to={LOGIN_PATH}>Sign in</Link></p>
            </form>
        </div>
        </>
    )
}
export default Signup
