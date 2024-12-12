import axiosInstance from './axiosInstance';  // Import the axios instance with retry logic
import {
  LOGIN_REQUEST,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  CLEAR_ERRORS,
  REGISTER_REQUEST,
  REGISTER_SUCCESS,
  REGISTER_FAIL,
  VERIFY_OTP_REQUEST,
  VERIFY_OTP_SUCCESS,
  VERIFY_OTP_FAIL,
  FORGOT_PASSWORD_REQUEST,
  FORGOT_PASSWORD_SUCCESS,
  FORGOT_PASSWORD_FAIL,
  RESET_PASSWORD_REQUEST,
  RESET_PASSWORD_SUCCESS,
  RESET_PASSWORD_FAIL,
  LOGOUT_USER,
  LOGOUT_USER_FAIL,
  LOAD_USER_REQUEST,
  LOAD_USER_SUCCESS,
  LOAD_USER_FAIL,
  REFRESH_TOKEN_REQUEST,
  REFRESH_TOKEN_SUCCESS,
  REFRESH_TOKEN_FAIL,
  UPDATE_USER_REQUEST, 
  UPDATE_USER_SUCCESS, 
  UPDATE_USER_FAIL, 
  UPDATE_USER_PASSWORD_REQUEST,
  UPDATE_USER_PASSWORD_SUCCESS,
  UPDATE_USER_PASSWORD_FAIL,
} from '../constants/userConstants';

// Helper function for error handling
const getErrorMessage = (error) => {
  if (error.response) {
    return error.response.data?.message || 'Something went wrong';
  } else if (error.message) {
    return error.message;
  }
  return 'Something went wrong';
};

// Helper functions for token management
const getToken = () => localStorage.getItem('token');
const setToken = (token) => localStorage.setItem('token', token);
const removeToken = () => localStorage.removeItem('token');
const getRefreshToken = () => localStorage.getItem('refreshToken');
const setRefreshToken = (refreshToken) => localStorage.setItem('refreshToken', refreshToken);
const removeRefreshToken = () => localStorage.removeItem('refreshToken');

// Add timeout logic to each action
const handleTimeout = (dispatch) => {
  return setTimeout(() => {
    dispatch({ type: CLEAR_ERRORS });
  }, 15000); // 15 seconds timeout
};

// Action creators for user actions
export const register = (formData) => async (dispatch) => {
  dispatch({ type: REGISTER_REQUEST });

  const timeout = handleTimeout(dispatch); // Set the timeout

  try {
    const { data } = await axiosInstance.post('/register', formData);
    dispatch({ type: REGISTER_SUCCESS, payload: data });
    sessionStorage.setItem("userEmail", formData.email);
    window.location.href = "/validate-form";
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    dispatch({ type: REGISTER_FAIL, payload: errorMessage });
  } finally {
    clearTimeout(timeout); // Clear the timeout if the request completes
  }
};

export const login = (email, password) => async (dispatch) => {
  dispatch({ type: LOGIN_REQUEST });

  const timeout = handleTimeout(dispatch); // Set the timeout

  try {
    const { data } = await axiosInstance.post('/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    dispatch({ type: LOGIN_SUCCESS, payload: data });
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    dispatch({ type: LOGIN_FAIL, payload: errorMessage });
  } finally {
    clearTimeout(timeout); // Clear the timeout if the request completes
  }
};

export const verifyOtp = (otpData) => async (dispatch) => {
  dispatch({ type: VERIFY_OTP_REQUEST });

  const timeout = handleTimeout(dispatch); // Set the timeout

  try {
    const { data } = await axiosInstance.post('/verify-otp', otpData);
    dispatch({ type: VERIFY_OTP_SUCCESS, payload: data });
    if (data.token) {
      setToken(data.token);
      dispatch(loadUser());
      window.location.href = "/login";
    } else {
      dispatch({ type: VERIFY_OTP_FAIL, payload: 'OTP verification failed, please try again.' });
    }
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    dispatch({ type: VERIFY_OTP_FAIL, payload: errorMessage });
  } finally {
    clearTimeout(timeout); // Clear the timeout if the request completes
  }
};

export const forgotPassword = (email) => async (dispatch) => {
  dispatch({ type: CLEAR_ERRORS });
  dispatch({ type: FORGOT_PASSWORD_REQUEST });

  const timeout = handleTimeout(dispatch); // Set the timeout

  try {
    const { data } = await axiosInstance.post('/password/forgot', { email });
    dispatch({ type: FORGOT_PASSWORD_SUCCESS, payload: data.message });
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    dispatch({ type: FORGOT_PASSWORD_FAIL, payload: errorMessage });
  } finally {
    clearTimeout(timeout); // Clear the timeout if the request completes
  }
};

export const resetPassword = (token, newPassword, confirmPassword) => async (dispatch) => {
  dispatch({ type: CLEAR_ERRORS });
  dispatch({ type: RESET_PASSWORD_REQUEST });

  const timeout = handleTimeout(dispatch); // Set the timeout

  try {
    const { data } = await axiosInstance.put(`/password/reset/${token}`, { password: newPassword, confirmPassword });
    dispatch({ type: RESET_PASSWORD_SUCCESS, payload: data });
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    dispatch({ type: RESET_PASSWORD_FAIL, payload: errorMessage });
  } finally {
    clearTimeout(timeout); // Clear the timeout if the request completes
  }
};

export const loadUser = () => async (dispatch) => {
  dispatch({ type: CLEAR_ERRORS });
  dispatch({ type: LOAD_USER_REQUEST });

  const timeout = handleTimeout(dispatch); // Set the timeout

  try {
    const token = getToken();
    if (!token) {
      throw new Error('Please log in');
    }

    const { data } = await axiosInstance.get('/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    dispatch({ type: LOAD_USER_SUCCESS, payload: data });
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    dispatch({ type: LOAD_USER_FAIL, payload: errorMessage });
  } finally {
    clearTimeout(timeout); // Clear the timeout if the request completes
  }
};

export const logout = () => async (dispatch) => {
  dispatch({ type: CLEAR_ERRORS });

  const timeout = handleTimeout(dispatch); // Set the timeout

  try {
    await axiosInstance.post('/logout');
    removeToken();
    removeRefreshToken();
    dispatch({ type: LOGOUT_USER });
    window.location.reload();
  } catch (error) {
    console.error('Logout failed:', error);
    dispatch({ type: LOGOUT_USER_FAIL, payload: error.message || 'Logout failed due to an error.' });
  } finally {
    clearTimeout(timeout); // Clear the timeout if the request completes
  }
};

export const refreshToken = () => async (dispatch) => {
  dispatch({ type: CLEAR_ERRORS });
  dispatch({ type: REFRESH_TOKEN_REQUEST });

  const timeout = handleTimeout(dispatch); // Set the timeout

  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token, cannot refresh session');
    }

    const { data } = await axiosInstance.post('/refresh-token', { refreshToken });

    setToken(data.token);
    setRefreshToken(data.refreshToken);

    dispatch({ type: REFRESH_TOKEN_SUCCESS, payload: data });
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    dispatch({ type: REFRESH_TOKEN_FAIL, payload: errorMessage });
  } finally {
    clearTimeout(timeout); // Clear the timeout if the request completes
  }
};

export const updateUserProfile = (userData) => async (dispatch, getState) => {
  dispatch({ type: CLEAR_ERRORS });

  const timeout = handleTimeout(dispatch); // Set the timeout

  try {
    dispatch({ type: UPDATE_USER_REQUEST });

    const { user } = getState().user;

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user?.token}`,
      },
    };

    const { data } = await axiosInstance.put('/update-profile', userData, config);

    dispatch({ type: UPDATE_USER_SUCCESS, payload: data.user });
  } catch (error) {
    dispatch({ type: UPDATE_USER_FAIL, payload: error.response ? error.response.data.message : error.message });
  } finally {
    clearTimeout(timeout); // Clear the timeout if the request completes
  }
};

export const updateUserPassword = (oldPassword, newPassword) => async (dispatch, getState) => {
  dispatch({ type: CLEAR_ERRORS });

  const timeout = handleTimeout(dispatch); // Set the timeout

  try {
    dispatch({ type: UPDATE_USER_PASSWORD_REQUEST });

    const { user: { user } } = getState();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      },
    };

    const body = { oldPassword, newPassword };

    const response = await axiosInstance.put('/api/v1/user/update-password', body, config);

    dispatch({ type: UPDATE_USER_PASSWORD_SUCCESS, payload: response.data.message });
  } catch (error) {
    dispatch({ type: UPDATE_USER_PASSWORD_FAIL, payload: error.response ? error.response.data.message : error.message });
  } finally {
    clearTimeout(timeout); // Clear the timeout if the request completes
  }
};

// Clear errors action
export const clearErrors = () => (dispatch) => {
  dispatch({ type: CLEAR_ERRORS });
};
