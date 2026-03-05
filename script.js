const STORAGE_KEY = "ipt_demo_v1";
let currentUser = null;

let db = {
  accounts: [],
  departments: [],
  employees: [],
  requests: []
};

function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    db = JSON.parse(raw);
  } else {
    db.accounts.push({
      firstName: "Admin",
      lastName: "User",
      email: "admin@example.com",
      password: "Password123!",
      role: "Admin",
      verified: true
    });
    saveToStorage();
  }
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function setAuthState(user) {
  currentUser = user;

  if (user) {
    localStorage.setItem("auth_token", user.email);
    document.body.className =
      user.role === "Admin"
        ? "authenticated is-admin"
        : "authenticated";
    renderProfile();
  } else {
    localStorage.removeItem("auth_token");
    document.body.className = "not-authenticated";
  }
}

function navigateTo(path) {
  window.location.hash = "#/" + path;
}

function handleRouting() {
  let route = window.location.hash.replace("#/", "");
  let pageId = route ? route + "-page" : "dashboard-page";

  document.querySelectorAll(".page")
    .forEach(p => p.classList.remove("active"));

  const page = document.getElementById(pageId);
  if (page) page.classList.add("active");
}

window.addEventListener("hashchange", handleRouting);

function logout() {
  setAuthState(null);
  navigateTo("");
}

/* ========== REGISTER ========== */
document.addEventListener("DOMContentLoaded", () => {

  loadFromStorage();
  handleRouting();

  document.getElementById("registerForm")
    .addEventListener("submit", function(e) {
      e.preventDefault();

      const firstName = registerFirstName.value.trim();
      const lastName = registerLastName.value.trim();
      const email = registerEmail.value.trim();
      const password = registerPassword.value;

      if (db.accounts.some(acc => acc.email === email)) {
        alert("Email already exists!");
        return;
      }

      db.accounts.push({
        firstName,
        lastName,
        email,
        password,
        role: "User",
        verified: true
      });

      saveToStorage();
      alert("Registered successfully!");
      navigateTo("login");
    });

  document.getElementById("loginForm")
    .addEventListener("submit", function(e) {
      e.preventDefault();

      const email = loginEmail.value.trim();
      const password = loginPassword.value;

      const user = db.accounts.find(acc =>
        acc.email === email && acc.password === password
      );

      if (!user) {
        alert("Invalid credentials!");
        return;
      }

      setAuthState(user);
      navigateTo("profile");
    });
});

function renderProfile() {
  if (!currentUser) return;

  document.getElementById("profileName").innerText =
    "Name: " + currentUser.firstName + " " + currentUser.lastName;

  document.getElementById("profileEmail").innerText =
    "Email: " + currentUser.email;

  document.getElementById("profileRole").innerText =
    "Role: " + currentUser.role;
}