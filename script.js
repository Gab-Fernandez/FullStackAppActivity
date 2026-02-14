let currentUser = null;

function navigateTo(hash) {
  window.location.hash = hash;
}

function handleRouting() {
  const hash = window.location.hash || "#/home";
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

  if (hash === "#/login") {
    document.getElementById("login-page").classList.add("active");
  } else if (hash === "#/register") {
    document.getElementById("register-page").classList.add("active");
  } else {
    document.getElementById("home-page").classList.add("active");
  }
}

window.addEventListener("hashchange", handleRouting);
window.addEventListener("load", handleRouting);
