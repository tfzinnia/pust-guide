export default function Field({
  label,
  name,
  type = "text",
  value,
  onChange,
  options,
  required = false,
  ...rest
}) {
  const inputProps = {
    id: name,
    name,
    value: value ?? "",
    required,
    onChange: (event) =>
      onChange(type === "checkbox" ? event.target.checked : event.target.value),
    ...rest,
  };
  return (
    <label
      htmlFor={name}
      className={`field ${type === "checkbox" ? "flex items-center gap-3" : ""}`}
    >
      <span>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </span>
      {type === "textarea" ? (
        <textarea {...inputProps} rows={4} />
      ) : options ? (
        <select {...inputProps}>
          <option value="">
            {required ? "Select an option" : "All / not specified"}
          </option>
          {options.map((option) => (
            <option key={option.value ?? option} value={option.value ?? option}>
              {option.label ?? option}
            </option>
          ))}
        </select>
      ) : (
        <input
          {...inputProps}
          type={type}
          {...(type === "checkbox"
            ? { checked: !!value, value: undefined }
            : {})}
        />
      )}
    </label>
  );
}
