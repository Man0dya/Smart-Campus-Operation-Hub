import { useContext, useState } from "react";
import AuthContext from "../context/auth-context";
import AuthenticatedLayout from "../components/common/AuthenticatedLayout";
import FloatingToast from "../components/common/FloatingToast";
import { updateMyAvailability, updateMySkills } from "../services/userApi";

function ProfilePage() {
  const { user, setUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", type: "success" });
  const [error, setError] = useState("");
  const [skills, setSkills] = useState(user?.skills || []);
  const [certifications, setCertifications] = useState(user?.certifications || []);
  const [skillsLoading, setSkillsLoading] = useState(false);

  const handleToggleAvailability = async () => {
    if (!user || loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await updateMyAvailability({ available: !user.available });
      setUser(res.data);
      setToast({
        open: true,
        message: `You are now ${res.data.available ? "available" : "unavailable"} for assignments.`,
        type: "success",
      });
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to update availability.");
      setToast({ open: true, message: "Unable to update availability.", type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSkills = async () => {
    if (!user || skillsLoading) return;
    setSkillsLoading(true);
    setError("");

    try {
      const validSkills = skills.filter(skill =>
        skill.name && skill.name.trim() &&
        skill.category && skill.category.trim() &&
        skill.level && skill.level.trim()
      );

      const res = await updateMySkills({
        skills: validSkills,
        certifications: certifications.filter(c => c.trim())
      });
      setUser(res.data);
      setToast({
        open: true,
        message: "Skills updated successfully.",
        type: "success",
      });
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to update skills.");
      setToast({ open: true, message: "Unable to update skills.", type: "danger" });
    } finally {
      setSkillsLoading(false);
    }
  };

  if (!user) {
    return (
      <AuthenticatedLayout title="Profile" subtitle="Account details and role permissions">
        <p className="panel text-sm text-slate-600">No user profile loaded.</p>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout title="Profile" subtitle="Account details and role permissions">
      <section className="panel max-w-2xl space-y-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          {user.profilePicture ? (
            <img
              src={user.profilePicture}
              alt="Profile"
              className="h-28 w-28 rounded-full border border-slate-200 object-cover"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-slate-100 text-3xl font-bold text-slate-500">
              {(user.name || "U").charAt(0).toUpperCase()}
            </div>
          )}

          <div className="space-y-1 text-sm text-slate-700">
            <p><span className="font-semibold text-slate-900">Name:</span> {user.name}</p>
            <p><span className="font-semibold text-slate-900">Email:</span> {user.email}</p>
            <p>
              <span className="font-semibold text-slate-900">Role:</span>
              <span className="ml-2 rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-semibold text-cyan-800">
                {user.role}
              </span>
            </p>
          </div>
        </div>

        {user.role === "TECHNICIAN" && (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Assignment Availability</p>
                <p className="mt-1 text-sm text-slate-600">
                  When unavailable, admins will not assign new tickets to you. Existing tickets remain unchanged.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.available ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                  {user.available ? "Available" : "Unavailable"}
                </span>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleToggleAvailability}
                  disabled={loading}
                >
                  {loading ? "Saving..." : user.available ? "Set Unavailable" : "Set Available"}
                </button>
              </div>
            </div>
          </div>
        )}

        {user.role === "TECHNICIAN" && (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Specialization & Skills</p>
                <p className="mt-1 text-sm text-slate-600">
                  Add your areas of expertise to help admins assign relevant tickets.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Skills</label>
                  <div className="space-y-2">
                    {skills.map((skill, index) => {
                      const isIncomplete = !skill.name?.trim() || !skill.category || !skill.level;
                      return (
                        <div key={index} className={`flex gap-2 items-center p-2 rounded ${isIncomplete ? 'bg-red-50 border border-red-200' : 'bg-slate-50'}`}>
                          <input
                            type="text"
                            className={`field flex-1 ${isIncomplete ? 'border-red-300' : ''}`}
                            placeholder="Skill name"
                            value={skill.name || ''}
                            onChange={(e) => {
                              const newSkills = [...skills];
                              newSkills[index] = { ...newSkills[index], name: e.target.value };
                              setSkills(newSkills);
                            }}
                          />
                          <select
                            className={`field w-32 ${isIncomplete && !skill.category ? 'border-red-300' : ''}`}
                            value={skill.category || ''}
                            onChange={(e) => {
                              const newSkills = [...skills];
                              newSkills[index] = { ...newSkills[index], category: e.target.value };
                              setSkills(newSkills);
                            }}
                          >
                            <option value="">Category</option>
                            <option value="ELECTRICAL">Electrical</option>
                            <option value="PLUMBING">Plumbing</option>
                            <option value="HVAC">HVAC</option>
                            <option value="CARPENTRY">Carpentry</option>
                            <option value="PAINTING">Painting</option>
                            <option value="CLEANING">Cleaning</option>
                            <option value="IT_SUPPORT">IT Support</option>
                            <option value="NETWORKING">Networking</option>
                            <option value="SECURITY">Security</option>
                            <option value="MAINTENANCE">General Maintenance</option>
                            <option value="LANDSCAPING">Landscaping</option>
                            <option value="OTHER">Other</option>
                          </select>
                          <select
                            className={`field w-32 ${isIncomplete && !skill.level ? 'border-red-300' : ''}`}
                            value={skill.level || ''}
                            onChange={(e) => {
                              const newSkills = [...skills];
                              newSkills[index] = { ...newSkills[index], level: e.target.value };
                              setSkills(newSkills);
                            }}
                          >
                            <option value="">Level</option>
                            <option value="BEGINNER">Beginner</option>
                            <option value="INTERMEDIATE">Intermediate</option>
                            <option value="ADVANCED">Advanced</option>
                            <option value="EXPERT">Expert</option>
                          </select>
                          <button
                            type="button"
                            className="btn-danger text-sm px-2 py-1"
                            onClick={() => setSkills(skills.filter((_, i) => i !== index))}
                          >
                            Remove
                          </button>
                          {skill.verified && (
                            <span className="text-green-600 text-sm">✓ Verified</span>
                          )}
                          {isIncomplete && (
                            <span className="text-red-600 text-sm">⚠ Incomplete</span>
                          )}
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      className="btn-secondary text-sm"
                      onClick={() => setSkills([...skills, { name: '', category: '', level: 'BEGINNER', verified: false }])}
                    >
                      Add Skill
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Certifications</label>
                  <textarea
                    className="field min-h-20"
                    value={certifications.join('\n')}
                    onChange={(e) => setCertifications(e.target.value.split('\n').filter(c => c.trim()))}
                    placeholder="Enter each certification on a new line (e.g. OSHA Certified, Licensed Electrician)"
                    rows={3}
                  />
                  <p className="mt-1 text-xs text-slate-500">One certification per line</p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleUpdateSkills}
                    disabled={skillsLoading || skills.some(skill => !skill.name?.trim() || !skill.category || !skill.level)}
                  >
                    {skillsLoading ? "Saving..." : "Update Skills"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}
      </section>

      <FloatingToast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </AuthenticatedLayout>
  );
}

export default ProfilePage;
