const generateDummyUsers = (count) => {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: `User${index + 1}`,
    email: `user${index + 1}@example.com`,
  }));
};

export default generateDummyUsers;
