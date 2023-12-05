export const getToken = () => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      return atob(token);
    } catch (error) {
      return null;
    }
  }
  return null;
};

export const saveToken = (token: string) => {
  localStorage.setItem('token', btoa(token));
};

export const removeToken = () => {
  localStorage.removeItem('token');
};
