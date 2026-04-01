function getToken() {
  try {
    return localStorage.getItem('token');
  } catch (e) {
    return null;
  }
}

function authHeaders() {
  const t = getToken();
  return {
    Authorization: 'Bearer ' + (t || ''),
    'Content-Type': 'application/json',
  };
}

function redirectIfNoToken() {
  const t = getToken();
  if (!t) window.location.href = '/index.html';
}

window.App = { getToken, authHeaders, redirectIfNoToken };
