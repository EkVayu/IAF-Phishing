import { Close } from "@mui/icons-material";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { createLicense } from "../../../Api/api";

function CreateLicense({ setShowForm, getLicenses }) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    licenseId: "",
    organisation: "",
    validFrom: "",
    validFromTime: "",
    validTill: "",
    validTillTime: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await createLicense(formData);
      if (response.license_id) {
        toast.success("License created successfully");
        setShowForm(false);
        getLicenses();
        setIsLoading(false);
      } else {
        toast.error("Failed to create license");
        setIsLoading(false);
      }
    } catch (error) {
      toast.error(error.message);
      setIsLoading(false);
    }
  };
  return (
    <div className="w-screen h-screen flex items-center justify-center absolute top-0 left-0">
      <div className="w-fit flex flex-col justify-center bg-background shadow rounded-lg overflow-hidden relative">
        <div className="">
          <Close
            className="absolute top-2 right-2 cursor-pointer text-gray-500"
            onClick={() => setShowForm(false)}
          />
        </div>
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="text-center text-3xl mt-4 font-extrabold text-primary">
            Create New License
          </h2>
        </div>

        <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="py-8 px-4 sm:px-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="licenseId"
                  className="block text-sm font-medium text-gray-700"
                >
                  License ID*
                </label>
                <div className="mt-1">
                  <input
                    id="licenseId"
                    name="licenseId"
                    type="text"
                    required
                    value={formData.licenseId}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="organisation"
                  className="block text-sm font-medium text-gray-700"
                >
                  Organisation*
                </label>
                <div className="mt-1">
                  <input
                    id="organisation"
                    name="organisation"
                    type="text"
                    required
                    value={formData.organisation}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-y-6 gap-x-4">
                <div>
                  <label
                    htmlFor="validFrom"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Valid From*
                  </label>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <input
                      id="validFrom"
                      name="validFrom"
                      type="date"
                      required
                      value={formData.validFrom}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                    <input
                      id="validFromTime"
                      name="validFromTime"
                      type="time"
                      required
                      value={formData.validFromTime}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="validTill"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Valid Till*
                  </label>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <input
                      id="validTill"
                      name="validTill"
                      type="date"
                      required
                      value={formData.validTill}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                    <input
                      id="validTillTime"
                      name="validTillTime"
                      type="time"
                      required
                      value={formData.validTillTime}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-background bg-primary hover:bg-secondary focus:outline-none transition duration-300 ease-in-out"
                >
                 {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    </div>
                  ) : (
                    "Create License"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateLicense;
