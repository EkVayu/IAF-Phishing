import axios from "axios";

const API_BASE_URL = "http://13.201.91.8000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const loginApi = async ({ email: userId, password: password }) => {
  const response = await fetch(`${API_BASE_URL}/login/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: userId, password: password }),
  });
  return response;
};

export const refreshToken = async () => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/refresh-token/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });
  return response;
};

export const sendPasswordResetRequest = async ({ email: userId }) => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/password-reset-request/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({ email: userId }),
  });
  return response;
};

export const changePassword = (oldPassword, newPassword) => {
  const token = sessionStorage.getItem("token");
  return api.post(
    "/change-password/",
    { old_password: oldPassword, new_password: newPassword },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
    }
  );
};

export const allocateLicense = async ({
  allocated_to: email,
  license: licenseId,
}) => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(
    `${API_BASE_URL}/licenses/${licenseId}/allocate/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({ allocated_to: email, license: licenseId }),
    }
  );
  return response;
};

export const revokeLicense = async ({
  allocated_to: email,
  license: licenseId,
}) => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(
    `${API_BASE_URL}/licenses/revoke-license/${licenseId}/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({ allocated_to: email, license: licenseId }),
    }
  );
  return response;
};

export const fetchLicenses = async () => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/licenses/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
  });
  return response;
};
export const createLicense = async (licenseData) => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/licenses/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({
      license_id: licenseData.licenseId,
      organization: licenseData.organisation,
      valid_from: `${licenseData.validFrom}T${licenseData.validFromTime}:00Z`,
      valid_till: `${licenseData.validTill}T${licenseData.validTillTime}:00Z`,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create license");
  }

  return response.json();
};

export const fetchLicensesHistory = async (licenseId) => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(
    `${API_BASE_URL}/licenses/${licenseId}/history/`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
    }
  );
  return response;
};

export const fetchCurrentUserData = async () => {
  const token = sessionStorage.getItem("token");
  const user = JSON.parse(sessionStorage.getItem("user"));
  const response = await fetch(`${API_BASE_URL}/profile/user_id/${user?.id}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
  });
  return response;
};

export const editUserProfile = async (formData) => {
  const token = sessionStorage.getItem("token");
  const user = JSON.parse(sessionStorage.getItem("user"));
  const response = await fetch(
    `${API_BASE_URL}/user-profiles/user_id/${user?.id}/`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify(formData),
    }
  );
  return response;
};

export const fetchPhishingMails = async () => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/emaildetails/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
  });
  return response;
};

export const updatePhishingMailStatus = async (
  newStatus,
  receiverEmail,
  messageId,
  adminComment
) => {
  const token = sessionStorage.getItem("token");

  const response = await fetch(`${API_BASE_URL}/emaildetails/update-status/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({
      status: newStatus,
      recievers_email: receiverEmail,
      message_id: messageId,
      admin_comment: adminComment,
    }),
  });

  return response;
};

export const fetchUsers = async () => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/staff/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
  });
  if (!response.ok) {
    console.error("Failed to fetch users:", response);
    throw new Error("Failed to fetch users");
  }
  return response.json(); // Ensure it's returning a JSON object
};

export const deleteUsers = async (id) => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/users/${id}/delete/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
  });
  return response;
};

export const createUser = async (formData) => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/register/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(formData),
  });
  return response;
};

export const deleteLicense = async (id) => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/license/${id}/delete/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
  });
  return response;
};

export const fetchReports = async () => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/reports/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
  });
  return response;
};

export const fetchRunTestData = async () => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/run-test-data/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
  });
  return response;
};

export const fetchFetchData = async () => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/fetch-data/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
  });
  return response;
};

export default api;
