import { useState } from "react";
import { createTicket, uploadTicketAttachments } from "../services/ticketApi";
import AuthenticatedLayout from "../components/common/AuthenticatedLayout";

function CreateTicketPage() {
  const [form, setForm] = useState({
    resourceId: "",
    category: "",
    description: "",
    priority: "MEDIUM",
    contactDetails: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [files, setFiles] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const ticketRes = await createTicket(form);

      if (files.length > 0) {
        await uploadTicketAttachments(ticketRes.data.id, files);
      }

      setMessage("Ticket created successfully.");
      setError("");
      setFiles([]);
      setForm({
        resourceId: "",
        category: "",
        description: "",
        priority: "MEDIUM",
        contactDetails: "",
      });
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to create ticket.");
      setMessage("");
    }
  };

  return (
    <AuthenticatedLayout
      title="Create Incident Ticket"
      subtitle="Report maintenance issues and upload evidence for faster resolution"
    >
      <section className="panel max-w-3xl">
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Resource ID</label>
            <input className="field" name="resourceId" value={form.resourceId} onChange={handleChange} placeholder="e.g., projector-12" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
            <input className="field" name="category" value={form.category} onChange={handleChange} placeholder="Electrical, HVAC, Network..." />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Priority</label>
            <select className="field" name="priority" value={form.priority} onChange={handleChange}>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Preferred Contact</label>
            <input className="field" name="contactDetails" value={form.contactDetails} onChange={handleChange} placeholder="Email or phone" />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Issue Description</label>
            <textarea
              className="field min-h-28"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe what happened, where, and impact"
              rows={4}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Evidence Images (max 3)</label>
            <input
              className="field"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={(e) => {
                const selected = Array.from(e.target.files || []);
                if (selected.length > 3) {
                  setError("You can upload up to 3 images.");
                  return;
                }
                setError("");
                setFiles(selected);
              }}
            />
            {files.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                {files.map((file) => (
                  <li key={file.name}>{file.name}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="sm:col-span-2">
            <button className="btn-primary" type="submit">Submit Ticket</button>
          </div>
        </form>
      </section>

      {message && <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
    </AuthenticatedLayout>
  );
}

export default CreateTicketPage;
