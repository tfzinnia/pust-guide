import { ExternalLink, Mail, Phone, UserRound } from "lucide-react";
export function SourceNote({
  url,
  date,
  label = "Official source",
  notes = [],
}) {
  const display = date
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Dhaka",
      }).format(new Date(`${date}T00:00:00+06:00`))
    : "";
  return (
    <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {url && (
          <a
            className="inline-flex items-center gap-1 font-semibold text-blue-700"
            href={url}
            target="_blank"
            rel="noreferrer"
          >
            {label}
            <ExternalLink size={12} />
          </a>
        )}
        {display && <span>Checked {display}</span>}
      </div>
      {notes.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer font-semibold">
            Source notes
          </summary>
          <ul className="mt-2 list-disc space-y-2 pl-4 leading-5">
            {notes.map((note, index) => (
              <li key={index}>
                {typeof note === "string"
                  ? note
                  : note.note || "See the official listing for details."}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
export function ContactLinks({ emails = [], phones = [] }) {
  return (
    <div className="mt-3 space-y-2 text-sm">
      {emails.map((email) => (
        <a
          key={email}
          href={`mailto:${email}`}
          className="flex items-center gap-2 break-all text-blue-700"
        >
          <Mail size={15} className="shrink-0" />
          {email}
        </a>
      ))}
      {phones.map((phone) => (
        <div key={phone} className="flex items-center gap-2 text-slate-600">
          <Phone size={15} className="shrink-0" />
          {/^[+\d\s()-]+$/.test(phone) ? (
            <a href={`tel:${phone.replace(/[^+\d]/g, "")}`}>{phone}</a>
          ) : (
            <span>{phone}</span>
          )}
        </div>
      ))}
    </div>
  );
}
export function DirectoryPersonCard({ person, highlight = false }) {
  return (
    <article
      id={`person-${person.id}`}
      className={`card p-5 ${highlight ? "ring-2 ring-blue-500" : ""}`}
    >
      <div className="flex items-start gap-3">
        <UserRound
          size={35}
          className="shrink-0 rounded-full bg-blue-50 p-2 text-blue-600"
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-bold">{person.name}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {person.designation}
          </p>
          {(person.department_name || person.office_name) && (
            <p className="mt-1 text-xs text-slate-500">
              {person.department_name || person.office_name}
            </p>
          )}
          {!!person.is_head && (
            <span className="mt-2 inline-block rounded-full bg-teal-50 px-2 py-1 text-[10px] font-semibold text-teal-700">
              Published head / lead
            </span>
          )}
        </div>
      </div>
      <ContactLinks emails={person.emails} phones={person.phones} />
      {!person.emails?.length && !person.phones?.length && (
        <p className="mt-3 text-xs text-slate-500">
          Institutional contact not listed in the checked source.
        </p>
      )}
      {person.profile_url && (
        <a
          className="mt-3 inline-block text-xs font-semibold text-blue-700"
          href={person.profile_url}
          target="_blank"
          rel="noreferrer"
        >
          Official profile →
        </a>
      )}
      <SourceNote
        url={person.source_url}
        date={person.checked_at}
        notes={person.notes}
      />
    </article>
  );
}
