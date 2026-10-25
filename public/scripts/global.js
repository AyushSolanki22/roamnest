
document.addEventListener(
  "wheel",
  (event) => {
    const input = event.target;

    if (
      input instanceof HTMLInputElement &&
      input.type === "number" &&
      document.activeElement === input
    ) {
      event.preventDefault();
    }
  },
  { passive: false, capture: true }
);
