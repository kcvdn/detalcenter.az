export function getStoredSession() {
  if (typeof window === "undefined") {
    return {
      token: "",
      role: "",
      userId: "",
      sellerId: "",
    };
  }

  return {
    token: localStorage.getItem("token") || "",
    role: localStorage.getItem("role") || "",
    userId: localStorage.getItem("userId") || "",
    sellerId: localStorage.getItem("sellerId") || "",
  };
}

export function setStoredSession({ token, role, userId, sellerId }) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem("token", token);
  localStorage.setItem("role", role);
  localStorage.setItem("userId", String(userId));
  localStorage.setItem("sellerId", sellerId ? String(sellerId) : "");
  window.dispatchEvent(new Event("sessionchange"));
}

export function clearStoredSession() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("userId");
  localStorage.removeItem("sellerId");
  window.dispatchEvent(new Event("sessionchange"));
}

export function getAuthHeaders() {
  const { token } = getStoredSession();

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}
