"use client";

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="skip-link"
      onFocus={(e) => {
        e.target.classList.add("focus-within:top-4");
      }}
    >
      Skip to main content
    </a>
  );
}
