const API_BASE = "https://taskphere-it-email.vercel.app";

export const sendOtpEmail = async ({ email, fullName, otp }) => {
  const res = await fetch(`${API_BASE}/sendOTP`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      name: fullName,
      otp,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Email API returned ${res.status}`);
  }
};
