import React, { useState, useEffect } from "react";
import { FaTrash, FaUserPlus, FaSearch, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import CreateUser from "../../components/popup/Createuser/CreateUser";
import { deleteUsers, fetchUsers } from "../../Api/api";

function Users() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true); // Add loading state
  const [error, setError] = useState(null); // For tracking errors

  const getUsers = async () => {
    try {
      const response = await fetchUsers();
      if (response.results) {
        setUsers(response.results);
        setLoading(false); // Stop loading on successful fetch
      } else {
        setUsers(Array.isArray(response) ? response : []);
        setLoading(false); // Stop loading on successful fetch
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setLoading(false); // Stop loading on error
      setError("Failed to load user data. Please try again.");
      toast.error("Failed to load user data. Please try again.");
    }
  };

  useEffect(() => {
    getUsers();
  }, []);

  const handleDelete = async (id) => {
    try {
      const response = await deleteUsers(id);
      if (response.ok) {
        setUsers(users.filter((user) => user.id !== id));
        toast.success(`User with id: ${id} has been deleted successfully`);
      } else {
        const errorData = await response.json();
        toast.error(
          `Failed to delete user: ${errorData.message || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(
        "An error occurred while deleting the user. Please try again."
      );
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchString = searchTerm.toLowerCase();
    return (
      user.first_name?.toLowerCase().includes(searchString) ||
      user.last_name?.toLowerCase().includes(searchString) ||
      user.email?.toLowerCase().includes(searchString)
    );
  });

  return (
    <>
      <div className="w-full">
        <h1 className="text-3xl font-bold mb-6 text-primary">
          User Management
        </h1>
        <div className="bg-background shadow-lg rounded-lg overflow-hidden">
          <div className="p-4 flex justify-between items-center bg-indigo-100">
            <h2 className="text-xl font-semibold text-primary">Users List</h2>
            <div className="flex items-center">
              <div className="relative max-w-sm mr-4">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 pl-12 pr-10 text-gray-700 bg-background border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-300 ease-in-out"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <FaSearch className="h-5 w-5 text-gray-400" />
                </div>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes className="h-5 w-5" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="bg-primary text-background px-4 py-2 rounded-full hover:bg-secondary transition duration-300 flex items-center"
              >
                <FaUserPlus className="mr-2" />
                Add User
              </button>
            </div>
          </div>
          <table className="w-full">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <p className="text-red-500 text-sm font-semibold p-5">{error}</p>
            ) : (
              <div className="w-full">
                <thead>
                  <tr className="bg-indigo-200 text-primary">
                    <th className="py-3 px-4 text-left">Id</th>
                    <th className="py-3 px-4 text-left">Name</th>
                    <th className="py-3 px-4 text-left">Email</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-indigo-100 hover:bg-indigo-50 transition duration-200"
                    >
                      <td className="py-3 px-4">{user.id}</td>
                      <td className="py-3 px-4">{`${user.first_name || ""} ${
                        user.last_name || ""
                      }`}</td>
                      <td className="py-3 px-4">{user.email}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-800 transition duration-300"
                        >
                          <FaTrash size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </div>
            )}
          </table>
        </div>
      </div>
      {showForm && <CreateUser setShowForm={setShowForm} getUsers={getUsers} />}
    </>
  );
}

export default Users;
