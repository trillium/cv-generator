export interface TailwindColor {
  name: string;
  shade: string;
  hex: string;
  className: string;
}

export interface ColorPickerProps {
  selectedColor?: string;
  onColorSelect?: (color: TailwindColor) => void;
  className?: string;
  showAsModal?: boolean;
  buttonText?: string;
  buttonIcon?: React.ReactNode;
  modalTitle?: string;
  modalDescription?: string;
}
