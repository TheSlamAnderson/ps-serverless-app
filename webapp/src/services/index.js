import axios from 'axios';
import createAuthRefreshInterceptor from 'axios-auth-refresh';
import { Auth } from 'aws-amplify';
import * as mock from './mockData';

let client;

const getAuthHeader = (session) => `Bearer ${session.getAccessToken().getJwtToken()}`;

// Handle token refreshing
const createAPIClient = async () => {
  console.log('Creating API Client');
  const session = await Auth.currentSession();
  client = axios.create({
    headers: {
      common: {
        Authorization: getAuthHeader(session),
      },
    },
  });
  createAuthRefreshInterceptor(client, async (request) => {
    // Recreate client and update for future requests
    await createAPIClient();
    const newSession = await Auth.currentSession();
    // Update the Auth header for current request
    request.response.config.headers.Authorization = getAuthHeader(newSession);
  });
};

const SERVICES_HOST = window.appConfig.apiEndpoint;

/* eslint-disable no-console */

// Documents ---------------------------------------------------------

export const getAllDocuments = async () => {
  if (!client) {
    await createAPIClient();
  }
  const { data } = await client.get(`${SERVICES_HOST}/documents/`);
  return data;
};

export const getDocument = async (id) => {
  if (!client) {
    await createAPIClient();
  }
  const { data } = await client.get(`${SERVICES_HOST}/documents/${id}`);
  console.log(`Data: ${JSON.stringify(data)}`);
  return data;
};

export const deleteDocument = async (id) => {
  if (!client) {
    await createAPIClient();
  }
  await client.delete(`${SERVICES_HOST}/documents/${id}`);
};

export const uploadDocument = async (name, tags, file) => {
  if (!client) {
    await createAPIClient();
  }
  const formData = new FormData();
  formData.append('name', name);
  formData.append('tags', tags.join(','));
  formData.append('file', file);
  const result = await client.post(`${SERVICES_HOST}/documents/`, formData);
  console.log(`Result from Upload: ${JSON.stringify(result)}`);
};

// Users

export const getAllUsers = async () => {
  console.log('[MOCK] Get all users');
  return mock.mockCall(mock.allUsers, 2500);
};

export const createNewUser = async (email, name, group) => {
  console.log(`[MOCK] Create New User: ${email} ${name} ${group}`);
  return mock.mockCall({}, 1000);
};

export const deleteUser = async (id) => {
  console.log(`[MOCK] Delete User: ${id}`);
  return mock.mockCall({}, 1000);
};

export const getAllUserProfiles = async () => {
  console.log('[MOCK] Get All User Profiles');
  return mock.mockCall(mock.profiles, 1000);
};

export const getCurrentUserProfile = async () => {
  console.log('[MOCK] Get current user profile');
  return mock.mockCall(mock.profile, 1000);
};

export const updateCurrentUserProfile = async (name, shouldDeletePicture, picture) => {
  console.log(
    `[MOCK] Update Current User ${name} Delete Pic: ${shouldDeletePicture} Pic: ${picture}`,
  );
  return mock.mockCall({}, 1000);
};

// Comments --------------------------------------------------------------

export const createComment = async (id, content) => {
  if (!client) {
    await createAPIClient();
  }
  const body = {
    Comment: content,
  };
  const results = await client.post(`${SERVICES_HOST}/comments/${id}`, body);
  console.log(`Results: ${JSON.stringify(results)}`);
};

export const getCommentsForDocument = async (id) => {
  if (!client) {
    await createAPIClient();
  }
  const results = await client.get(`${SERVICES_HOST}/comments/${id}`);
  const sortedResults = results.data.sort((a, b) => new Date(b.DateAdded) - new Date(a.DateAdded));
  return sortedResults;
};

export const reportCommentForModeration = async (id) => {
  if (!client) {
    await createAPIClient();
  }
  const body = {
    CommentId: id,
  };
  await client.post(`${SERVICES_HOST}/moderate`, body);
};

/* eslint-enable no-console */
