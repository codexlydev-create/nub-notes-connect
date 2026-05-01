import { cn } from "@/lib/utils";

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Round avatar that prefers an uploaded photoUrl, otherwise falls back to
 * gradient initials. Use this everywhere we used to render letter avatars
 * so updating a profile photo reflects across the whole app.
 */
export default function UserAvatar({
  name,
  photoUrl,
  className,
  rounded = "full",
  textClass = "text-sm",
}: {
  name: string;
  photoUrl?: string | null;
  className?: string;
  rounded?: "full" | "xl" | "2xl";
  textClass?: string;
}) {
  const radius =
    rounded === "xl" ? "rounded-xl" : rounded === "2xl" ? "rounded-2xl" : "rounded-full";
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={cn("object-cover bg-muted", radius, className)}
        loading="lazy"
        onError={(e) => {
          // Hide broken image so the parent can render a fallback if needed
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }
  return (
    <div
      className={cn(
        "bg-gradient-primary text-primary-foreground flex items-center justify-center font-bold shrink-0",
        radius,
        textClass,
        className
      )}
    >
      {initialsOf(name)}
    </div>
  );
}