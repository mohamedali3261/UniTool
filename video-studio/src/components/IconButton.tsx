import { ButtonHTMLAttributes } from "react";
import { LucideIcon } from "lucide-react";
export function IconButton({
  icon: Icon,
  label,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button className="icon-button" title={label} aria-label={label} {...props}>
      <Icon size={18} />
    </button>
  );
}
