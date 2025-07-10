import React, { useState } from "react";

interface ContextFormProps {
  onSubmit: (meetingTopic: string, userRole: string) => void;
  onClose: () => void;
}

const ContextForm: React.FC<ContextFormProps> = ({ onSubmit, onClose }) => {
  const [meetingTopic, setMeetingTopic] = useState("");
  const [userRole, setUserRole] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(meetingTopic, userRole);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-black/60 backdrop-blur-md rounded-xl shadow-lg shadow-black/30 max-w-sm w-full mx-auto p-6 border border-white/10">
        <h2 className="text-base font-semibold text-white/90 mb-4 text-center">Provide Context</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="meetingTopic" className="block text-xs font-medium text-white/80 mb-1">
              What is this meeting about?
            </label>
            <input
              type="text"
              id="meetingTopic"
              className="w-full p-2 rounded-md bg-white/10 border border-white/10 text-white/90 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition"
              value={meetingTopic}
              onChange={(e) => setMeetingTopic(e.target.value)}
              placeholder="e.g. System design interview"
              required
            />
          </div>
          <div>
            <label htmlFor="userRole" className="block text-xs font-medium text-white/80 mb-1">
              What is your role in this meeting?
            </label>
            <input
              type="text"
              id="userRole"
              className="w-full p-2 rounded-md bg-white/10 border border-white/10 text-white/90 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition"
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
              placeholder="e.g. Candidate, Interviewer, Observer"
              required
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-white/10 text-white/80 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-blue-500/80 text-white/90 hover:bg-blue-600/80 focus:outline-none focus:ring-2 focus:ring-blue-400/40 transition"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContextForm;
