import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

type Option = {
  value: string | number;
  label: string;
  description?: string;
  disabled?: boolean;
};
/** Portaled, collision-aware RTL menu. Radix owns focus, typeahead and touch/keyboard navigation. */
export function StudioSelect({
  value,
  onValueChange,
  options,
  label,
  disabled = false,
}: {
  value: string | number;
  onValueChange: (value: string) => void;
  options: Option[];
  label: string;
  disabled?: boolean;
}) {
  return (
    <Select.Root
      dir="rtl"
      value={String(value)}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <Select.Trigger className="studio-select" aria-label={label}>
        <Select.Value />
        <Select.Icon>
          <ChevronDown size={16} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          data-studio-select-content=""
          className="studio-select-menu"
          position="popper"
          sideOffset={7}
          collisionPadding={12}
          align="start"
        >
          <Select.ScrollUpButton className="studio-select-scroll">
            <ChevronUp size={16} />
          </Select.ScrollUpButton>
          <Select.Viewport className="studio-select-viewport">
            {options.map((option) => (
              <Select.Item
                className="studio-select-option"
                key={option.value}
                value={String(option.value)}
                disabled={option.disabled}
                textValue={option.label}
              >
                <span className="studio-select-copy">
                  <Select.ItemText>{option.label}</Select.ItemText>
                  {option.description && <small>{option.description}</small>}
                </span>
                <Select.ItemIndicator>
                  <Check size={16} />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
          <Select.ScrollDownButton className="studio-select-scroll">
            <ChevronDown size={16} />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
