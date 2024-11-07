import axios from "axios";

// const API_BASE_URL = "http://35.154.97.4:8002";
const API_BASE_URL = "http://35.154.97.4:8002";
// const API_BASE_URL = "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

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

export const sendPasswordResetOtp = async ({ email: userId }) => {
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

export const verifyOtp = async ({ email: userId, otp: otp }) => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/verify-otp/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({ email: userId, otp: otp }),
  });
  return response;
};

export const resetPassword = async ({
  email: userId,
  otp: otp,
  newPassword: password,
}) => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/reset-password/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({
      email: userId,
      otp: otp,
      new_password: password,
    }),
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
    `${API_BASE_URL}/allocations/license/history-report/${licenseId}/`,
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

export const fetchDisputes = async () => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/plugin/disputes-details/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
  });
  return response;
};

export const updateDisputeStatus = async (id, status) => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/dispute/${id}/update/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  return response;
};

export const addDisputeComment = async (id, adminComment) => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/dispute/${id}/comments/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({
      dispute: id,
      admin_comment: adminComment,
    }),
  });
  return response;
};

export const disputeStatusChange = async (
  newStatus,
  email,
  messageId,
  adminComment
) => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/disputes/update-status/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({
      status: newStatus,
      email: email,
      message_id: messageId,
      admin_comment: adminComment,
    }),
  });
  return response;
};

export const fetchUsers = async () => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/users/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
  });
  return response;
};

export const deleteUsers = async (id) => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/users/${id}/soft-delete/`, {
    method: "DELETE",
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
  const response = await fetch(`${API_BASE_URL}/license/${id}/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
  });
  return response;
};

export const reserveLicense = async (licenseId, action) => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(
    `${API_BASE_URL}/licenses/${licenseId}/reserve/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({ action }),
    }
  );
  return response;
};

export const fetchReports = async () => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/allocations/license-report/`, {
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

//  3 Api for Quarantine
export const fetchStatusData = async () => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/quarantine/status/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
  });
  return response;
};

export const fetchCheckLevelData = async () => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/quarantine/check-level/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
  });
  return response;
};

export const fetchImportTestData = async () => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/quarantine/import-test/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
  });
  return response;
};

// Apis for RogueDB

//URL Operations
export const fetchRoughUrl = async () => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/rough-url/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
  });
  return response;
};

export const createRoughUrl = async (urlData) => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/rough-url/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(urlData),
  });
  return response;
};

export const updateRoughUrl = async (id, urlData) => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/rough-url/${id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(urlData),
  });
  return response;
};

export const deleteRoughUrl = async (id) => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/rough-url/${id}/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
  });
  return response;
};

//Domain
export const fetchRoughDomain = async () => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/rough-domain/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
  });
  return response;
};

export const createRoughDomain = async (domainData) => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/rough-domain/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(domainData),
  });
  return response;
};

export const updateRoughDomain = async (id, domainData) => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/rough-domain/${id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(domainData),
  });
  return response;
};

export const deleteRoughDomain = async (id) => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/rough-domain/${id}/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
  });
  return response;
};

// Mail operations
export const fetchRoughMail = async () => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/rough-mail/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
  });
  return response;
};
export const createRoughMail = async (mailData) => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/rough-mail/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(mailData),
  });
  return response;
};

export const updateRoughMail = async (id, mailData) => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/rough-mail/${id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(mailData),
  });
  return response;
};

export const deleteRoughMail = async (id) => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/rough-mail/${id}/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
  });
  return response;
};


export const fetchDisabledPlugins = async (id) => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/disabled-plugins-count/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
  });
  return response;
};

export default api;
