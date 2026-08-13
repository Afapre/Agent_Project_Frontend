import { request } from './httpClient';

export async function createUser(firstName, lastName, email, password, dateOfBirth) {
  return request('/api/v1/chat/users', {
    method: 'POST',
    body: JSON.stringify({
      first_name: firstName,
      last_name: lastName,
      email,
      password,
      date_of_birth: dateOfBirth,
    }),
  });
}

export async function loginUser(email, password) {
  return request('/api/v1/chat/users/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getUser(userId) {
  return request(`/api/v1/chat/users/${userId}`);
}

export async function deleteUser(userId) {
  return request(`/api/v1/chat/users/${userId}`, { method: 'DELETE' });
}
