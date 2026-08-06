export function PlaceholderPhoto({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center bg-[#F1ECE2] text-center text-[13px] font-semibold text-faint ${className}`}
      style={{
        backgroundImage:
          "repeating-linear-gradient(45deg, #F1ECE2, #F1ECE2 10px, #EAE3D5 10px, #EAE3D5 20px)",
      }}
    >
      <span className="max-w-[70%]">{label}</span>
    </div>
  );
}
