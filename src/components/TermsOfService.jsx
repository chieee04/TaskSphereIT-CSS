// src/components/TermsOfService.jsx
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../supabaseClient";

// MUST match what dashboards query
const TOS_VERSION = "2025-05-09";
const ROLE_MANAGER = 1;

const TermsOfService = ({ open, onAccept, onDecline }) => {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // Read the logged-in user object
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("customUser") || "null");
    } catch {
      return null;
    }
  }, []);

  const role = Number(storedUser?.user_roles);
  const userId = storedUser?.user_id != null ? String(storedUser.user_id) : null;

  // A canonical key to store in tos_acceptance (doesn't affect your manager check)
  const userKey = useMemo(() => {
    const u = storedUser || {};
    return (
      (u.username && String(u.username)) ||
      (u.email && String(u.email)) ||
      (u.user_id != null && String(u.user_id)) ||
      (u.id != null && String(u.id)) ||
      null
    );
  }, [storedUser]);

  // Lock background scroll while modal is open
  useEffect(() => {
    if (!open) return;
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, [open]);

  if (!open) return null;

  const handleAgree = async () => {
    setErr("");
    setSaving(true);
    try {
      if (!userKey || !role) throw new Error("Missing user info");

      // 1) Write to tos_acceptance for history/audit (role-agnostic)
      const { error: acceptErr } = await supabase
        .from("tos_acceptance")
        .upsert(
          { user_key: String(userKey), role: Number(role), version: TOS_VERSION },
          { onConflict: "user_key,role,version" }
        );
      if (acceptErr) throw acceptErr;

      // 2) For MANAGER ONLY — flag the row on user_credentials by user_id
      if (Number(role) === ROLE_MANAGER) {
        if (!userId) {
          throw new Error("Cannot update manager ToS flag: missing user_id.");
        }
        const { error: updErr } = await supabase
          .from("user_credentials")
          .update({ tos_agree: true, tos_version: TOS_VERSION })
          .eq("user_id", userId);
        if (updErr) throw updErr;
      }

      onAccept?.(); // parent hides the modal
    } catch (e) {
      setErr(e.message || "Failed to save acceptance");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-[1001] w-[95vw] max-w-5xl rounded-xl bg-white shadow-2xl">
        <div className="px-6 pt-6">
          <h2 className="text-[28px] font-extrabold text-neutral-900">Terms of Service</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Effective Date: <span className="font-medium">May 09, 2025</span> • System Name:{" "}
            <span className="font-medium">TaskSphere IT</span>
          </p>
        </div>

        {/* Body */}
        <div className="mt-4 max-h-[70vh] overflow-y-auto px-6 pb-6">
          <style>{`.tos-h3{font-weight:600;font-size:15px;color:#111827}.tos-text{font-size:14px;line-height:1.6;color:#1f2937}.tos-ul{padding-left:1.25rem} .tos-ul li{margin:.25rem 0}`}</style>

          <section className="mb-6">
            <h3 className="tos-h3">Acceptance of Terms</h3>
            <hr className="my-2 border-neutral-300" />
            <p className="tos-text">
              By using TaskSphere IT, you agree to abide by these Terms of Service. If you do not
              agree to any part of these terms, you are not authorized to use the system.
            </p>
          </section>

          <section className="mb-6">
            <h3 className="tos-h3">User Roles and Responsibilities</h3>
            <hr className="my-2 border-neutral-300" />
            <div className="tos-text">
              <p className="mb-2">Users are assigned specific roles within the system:</p>
              <ul className="tos-ul list-disc">
                <li><strong>Capstone Instructor:</strong> Full administrative control over users, schedules, and team assignments.</li>
                <li><strong>Capstone Adviser:</strong> Guides teams, assigns and monitors tasks, and reviews progress.</li>
                <li><strong>Project Manager:</strong> Assigns tasks to members, tracks progress, and oversees team deliverables.</li>
                <li><strong>Member:</strong> Completes tasks assigned by Project Managers and Advisers.</li>
                <li><strong>Solo User:</strong> Works independently on tasks without a team.</li>
              </ul>
              <p className="mt-2">All users are expected to use the system ethically and responsibly.</p>
            </div>
          </section>

          <section className="mb-6">
            <h3 className="tos-h3">Account Security</h3>
            <hr className="my-2 border-neutral-300" />
            <ul className="tos-ul list-disc tos-text">
              <li>You are responsible for safeguarding your login credentials.</li>
              <li>Report any unauthorized use immediately to your Capstone Instructor.</li>
              <li>Some accounts (e.g., Project Manager, Member) require in-person password reset requests.</li>
            </ul>
          </section>

          <section className="mb-6">
            <h3 className="tos-h3">Privacy and Data Protection</h3>
            <hr className="my-2 border-neutral-300" />
            <p className="tos-text">
              TaskSphere IT collects and stores data relevant to academic and task progress. All
              data is managed securely and used solely for system functionality. Users must not
              misuse or distribute any data obtained through the system.
            </p>
          </section>

          <section className="mb-6">
            <h3 className="tos-h3">Prohibited Activities</h3>
            <hr className="my-2 border-neutral-300" />
            <ul className="tos-ul list-disc tos-text">
              <li>Tamper with system functionalities.</li>
              <li>Use the system for any illegal or unauthorized purpose.</li>
              <li>Upload malicious files or offensive content.</li>
              <li>Misrepresent roles or falsify academic data.</li>
            </ul>
          </section>

          <section className="mb-6">
            <h3 className="tos-h3">Intellectual Property</h3>
            <hr className="my-2 border-neutral-300" />
            <p className="tos-text">
              All system content, including templates, UI, schedules, and underlying software, is
              the property of TaskSphere IT. Users are granted limited access for educational use
              only and may not copy, reproduce, or repurpose system elements.
            </p>
          </section>

          <section className="mb-6">
            <h3 className="tos-h3">System Access and Termination</h3>
            <hr className="my-2 border-neutral-300" />
            <div className="tos-text">
              <p className="mb-2">TaskSphere IT reserves the right to suspend or terminate accounts for:</p>
              <ul className="tos-ul list-disc">
                <li>Violating these Terms.</li>
                <li>Abusing system functionality.</li>
                <li>Compromising security or academic integrity.</li>
              </ul>
              <p className="mt-2">Upon termination, access to account data may be lost permanently.</p>
            </div>
          </section>

          <section className="mb-6">
            <h3 className="tos-h3">Changes to Terms or System</h3>
            <hr className="my-2 border-neutral-300" />
            <p className="tos-text">
              TaskSphere IT may modify these Terms at any time. Notice will be provided within the
              system or via email. Continued use after changes indicates acceptance.
            </p>
          </section>

          <section className="mb-6">
            <h3 className="tos-h3">Limitation of Liability</h3>
            <hr className="my-2 border-neutral-300" />
            <div className="tos-text">
              <p className="mb-2">TaskSphere IT is not liable for:</p>
              <ul className="tos-ul list-disc">
                <li>Data loss due to user error or technical malfunction.</li>
                <li>Missed deadlines or academic issues resulting from non-use of the system.</li>
                <li>Security breaches caused by user negligence.</li>
              </ul>
              <p className="mt-2">The system is provided “as is” without warranties of any kind.</p>
            </div>
          </section>

          <section className="mb-6">
            <h3 className="tos-h3">Indemnification</h3>
            <hr className="my-2 border-neutral-300" />
            <p className="tos-text">
              You agree to hold harmless TaskSphere IT, its developers, instructors, and affiliates
              from any claims or damages resulting from your misuse of the system or breach of these
              Terms.
            </p>
          </section>

          <section className="mb-6">
            <h3 className="tos-h3">Governing Law and Dispute Resolution</h3>
            <hr className="my-2 border-neutral-300" />
            <p className="tos-text">
              These Terms shall be governed by the laws of the Republic of the Philippines. Any
              legal disputes shall be settled under the jurisdiction of the courts located in Capas,
              Tarlac, Philippines.
            </p>
          </section>

          <section>
            <h3 className="tos-h3">Contact Information</h3>
            <hr className="my-2 border-neutral-300" />
            <div className="tos-text">
              <p>For questions, feedback, or issues, please contact us:</p>
              <p className="mt-1">
                <strong>Email:</strong> tasksphereit@gmail.com<br />
                <strong>Location:</strong> Capas, Tarlac, Philippines
              </p>
            </div>
          </section>
        </div>

        {err && <div className="px-6 text-sm text-red-600 -mt-2">{err}</div>}

        <div className="flex items-center justify-end gap-3 border-t border-neutral-200 px-6 py-4 rounded-b-xl">
          <button
            type="button"
            disabled={saving}
            onClick={onDecline}
            className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-100 disabled:opacity-50"
          >
            Disagree
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleAgree}
            className="rounded-md bg-[#611A11] px-4 py-2 text-sm font-semibold text-white hover:opacity-95 active:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Agree"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TermsOfService;
