import http from 'k6/http';

export const API = __ENV.CORE_URL || 'http://core:3000';

/** RFC 4122 v4 (the API validates event ids as UUIDs) */
export const uuid = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

/** Registers a throw-away user; returns its token. */
export const register = (prefix) => {
  const name = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const res = http.post(`${API}/register`, {
    username: name,
    email: `${name}@k6.local`,
    password: 'loadtest',
  });
  if (res.status !== 201) throw new Error(`register: ${res.status} ${res.body}`);
  return res.json('data.token');
};

export const auth = (token) => ({ headers: { Authorization: `Bearer ${token}` } });
