import React from "react";

function EditRogueDBModal({
  isOpen,
  onClose,
  onSubmit,
  item,
  activeTab,
  loading,
}) {
  const tabData = {
    url: ["url", "protocol"],
    domain: ["ip", "prototype"],
    mail: ["mailid"],
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-secondary-foreground">
          Edit {activeTab.toUpperCase()}
        </h2>
        <form onSubmit={onSubmit}>
          {tabData[activeTab].map((field) => (
            <div key={field} className="mb-4">
              <label
                htmlFor={field}
                className="block text-sm font-medium text-secondary-foreground"
              >
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <input
                type="text"
                id={field}
                name={field}
                defaultValue={item[field]}
                className="mt-1 block w-full rounded px-3 py-2 dark:bg-gray-700 text-secondary-foreground bg-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>
          ))}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditRogueDBModal;
