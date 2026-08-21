// src/api/authApi.js
// Frontend-only auth — no backend needed. Users are stored in localStorage.

const USERS_KEY = "mock_users";

function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function fakeToken(email) {
  return btoa(`${email}:${Date.now()}`);
}

export async function registerUser({ username, email, password, role }) {
  const users = getUsers();
  if (users.some((u) => u.email === email)) {
    throw new Error("An account with this email already exists.");
  }
  const user = { id: crypto.randomUUID(), username, email, password, role };
  users.push(user);
  saveUsers(users);

  const { password: _pw, ...safeUser } = user;
  return { token: fakeToken(email), user: safeUser };
}

export async function loginUser({ email, password }) {
  const users = getUsers();
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) {
    throw new Error("Invalid email or password.");
  }
  const { password: _pw, ...safeUser } = user;
  return { token: fakeToken(email), user: safeUser };
}