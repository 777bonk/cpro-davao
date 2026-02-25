import { Button } from "../ui/button";

export type CarSide = "front and rear" | "left" | "right" | "top";

type Props = {
  value: CarSide;
  onChange: (side: CarSide) => void;
};

const sides: CarSide[] = ["front and rear", "left", "right", "top"];

export function CarSideSelector({ value, onChange }: Props) {
  return (
    <div className="absolute bottom-4 right-4 z-20 flex gap-2">
      {sides.map((side) => (
        <Button
          key={side}
          size="sm"
          onClick={() => onChange(side)}
          className={
            value === side
              ? "bg-[#E41E6A] text-white"
              : "bg-[#1A1A1A] text-[#C0C0C0] border border-white/10"
          }
        >
          {side}
        </Button>
      ))}
    </div>
  );
}
