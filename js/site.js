const header = document.querySelector("[data-header]");
const menu = document.querySelector("[data-menu]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const year = document.querySelector("[data-year]");

function setMenu(open) {
  menu?.classList.toggle("open", open);
  menuToggle?.setAttribute("aria-expanded", String(open));
}

menuToggle?.addEventListener("click", () => {
  setMenu(!menu.classList.contains("open"));
});

menu?.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenu(false);
});

window.addEventListener(
  "scroll",
  () => header?.classList.toggle("scrolled", window.scrollY > 8),
  { passive: true },
);

if (year) year.textContent = new Date().getFullYear();
