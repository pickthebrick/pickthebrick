"use client";

import { Fragment, useState } from "react";

type Application = {
  id: string;
  jobTitle: string;
  fullName: string;
  email: string;
  phone: string | null;
  coverNote: string | null;
  cvPath: string;
  createdAt: Date;
};

export default function ApplicantsClient({ applications }: { applications: Application[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (applications.length === 0) return <p className="sub">No applications yet.</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Role</th>
          <th>Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th>CV</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {applications.map((a) => (
          <Fragment key={a.id}>
            <tr>
              <td>{new Date(a.createdAt).toLocaleDateString()}</td>
              <td>{a.jobTitle}</td>
              <td>{a.fullName}</td>
              <td>{a.email}</td>
              <td>{a.phone ?? "-"}</td>
              <td>
                <a href={a.cvPath} target="_blank" rel="noreferrer">
                  Download
                </a>
              </td>
              <td>
                {a.coverNote && (
                  <button className="action" onClick={() => setExpanded(expanded === a.id ? null : a.id)}>
                    {expanded === a.id ? "Hide note" : "Cover note"}
                  </button>
                )}
              </td>
            </tr>
            {expanded === a.id && a.coverNote && (
              <tr>
                <td colSpan={7} style={{ whiteSpace: "pre-wrap" }}>
                  {a.coverNote}
                </td>
              </tr>
            )}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}
