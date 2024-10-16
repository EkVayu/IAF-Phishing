const generateDummyUsers = (count) => {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    first_name: `First${index + 1}`,
    last_name: `Last${index + 1}`,
    name: `First${index + 1} Last${index + 1}`,
    email: `user${index + 1}@example.com`,
  }));
};

export default generateDummyUsers;
