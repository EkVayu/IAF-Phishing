import React, { useState, useEffect } from "react";
import { FaTrash, FaUserPlus } from "react-icons/fa";
import { toast } from "react-toastify";
import CreateUser from "../../components/popup/Createuser/CreateUser";
import { deleteUsers, fetchUsers } from "../../Api/api";
import Table3 from "../../components/Tables/Table3";
import generateDummyUsers from "../../Utils/Usergenerator";

function Users() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const columns = [
    { Header: "Id", accessor: "id" },
    { Header: "Name", accessor: "name" },
    { Header: "Email", accessor: "email" },
    {
      Header: "Actions",
      accessor: "actions",
      cell: (row, onAction) => (
        <button
          onClick={() => onAction(row.id, "delete")}
          className="text-red-600 hover:text-red-800 transition duration-300"
        >
          <FaTrash size={18} />
        </button>
      ),
    },
  ];

  const getUsers = async () => {
    try {
      const response = await fetchUsers();
      if (response.results) {
        setUsers(response.results);
      } else {
        setUsers(Array.isArray(response) ? response : []);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      const dummyUsers = generateDummyUsers(5);
      setUsers(dummyUsers);
      setLoading(false);
      toast.warning("Failed to load user data. Using dummy data.");
    }
  };

  useEffect(() => {
    getUsers();
  }, []);

  const handleAction = async (id, action) => {
    if (action === "delete") {
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
        setUsers(users.filter((user) => user.id !== id));
        console.error("Error deleting user:", error);
        toast.error(
          "An error occurred while deleting the user. Please try again."
        );
      }
    }
  };

  return (
    <>
      <div className="w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primary">User Management</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-white px-4 py-2 rounded-full hover:bg-secondary transition duration-300 flex items-center"
          >
            <FaUserPlus className="mr-2" />
            Add User
          </button>
        </div>
        <Table3
          data={users}
          columns={columns}
          onAction={handleAction}
          loading={loading}
          error={error}
        />
      </div>
      {showForm && <CreateUser setShowForm={setShowForm} getUsers={getUsers} />}
    </>
  );
}

export default Users;
