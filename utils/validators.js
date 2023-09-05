// function to validate email
const validateEmail = (data) => {
  let errors = {};

  // Check if the email field is empty
  if (data.trim() === "") {
    errors.email = "Email must not be empty";
  } else {
    // Check if the email format is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data)) {
      errors.email = "Email must be in the format 'example@example.com'.";
    }
  }
  return errors;
};

// function to validate password
const validatePassword = (data) => {
  let errors = {};

  if (data === "") {
    errors.password = "Password must not be empty";
  } else {
    // Check if the password meets the required criteria
    const passwordRegex = /^(?=.*\d)(?=.*[A-Z])(?=.*[^\w\s])[A-Za-z\d\S]{8,}$/;
    if (!passwordRegex.test(data)) {
      errors.password =
        "Password must be at least 8 characters long and contain at least one number, one uppercase letter, and one special character";
    }
  }

  return errors;
};

// Function to validate user auth data
const validateAuthData = (data) => {
  let errors = {};

  const emailRes = validateEmail(data.email);
  if (emailRes.email) {
    return { errors: { email: emailRes.email }, valid: false };
  }

  const passwordRes = validatePassword(data.password);
  if (passwordRes.password) {
    return {
      errors: { password: passwordRes.password },
      valid: false,
    };
  }

  // Return the validation results
  return {
    errors,
    valid: Object.keys(errors).length === 0, // Valid if there are no errors
  };
};

// function to validate userPassword
const validateUserPassword = (data) => {
  let errors = {};

  const passwordRes = validatePassword(data.password);
  if (passwordRes.password) {
    return {
      errors: { password: passwordRes.password },
      valid: false,
    };
  }

  // Return the validation results
  return {
    errors,
    valid: Object.keys(errors).length === 0, // Valid if there are no errors
  };
};

// function to validate email
const validateUserEmail = (data) => {
  let errors = {};

  const emailRes = validateEmail(data.email);
  if (emailRes.email) {
    return { errors: { email: emailRes.email }, valid: false };
  }

  // Return the validation results
  return {
    errors,
    valid: Object.keys(errors).length === 0, // Valid if there are no errors
  };
};

// function to validate userDetails
const validateUserDetails = (data) => {
  let errors = {};
  const { name, addInfo, address, phone } = data;

  if (!name || name === "") {
    errors.name = "Name must not be empty";
  }

  if (!addInfo || addInfo === "") {
    errors.addInfo = "Additional info must not be empty";
  }

  if (!address || address === "") {
    errors.address = "Address must not be empty";
  }

  if (!phone || phone.length === 0) {
    errors.phone = "Phone must not be empty";
  }

  // Return the validation results
  return {
    errors,
    valid: Object.keys(errors).length === 0, // Valid if there are no errors
  };
};

// Function to validate creating product details
const validateProduct = (data) => {
  const errors = {};

  const { title, description, price, color, size, categories } = data;
  if (!title || !description || !price || !color || !size || !categories) {
    errors.message = "Missing required fields";
  }

  if (
    title === "" ||
    description === "" ||
    price === "" ||
    color.length === 0 ||
    size.length === 0 ||
    categories.length === 0
  ) {
    errors.message = "Inputs cannot be empty";
  }

  return {
    errors,
    valid: Object.keys(errors).length === 0, // Valid if there are no errors
  };
};

const validateOrders = (data) => {
  const errors = {};
  const {
    products,
    totalPrice,
    shippingAddress,
    transactionId,
    paymentMethod,
  } = data;

  if (
    !products ||
    !totalPrice ||
    !shippingAddress ||
    !transactionId ||
    !paymentMethod
  ) {
    errors.message = "Missing required fields";
  }

  return {
    errors,
    valid: Object.keys(errors).length === 0, // Valid if there are no errors
  };
};

const validateAnnouncement = (data) => {
  const errors = {};
  const { title, text } = data;

  if (!title || !text) {
    errors.message = "Missing required fields";
  }

  return {
    errors,
    valid: Object.keys(errors).length === 0, // Valid if there are no errors
  };
};

module.exports = {
  validateAuthData,
  validateUserPassword,
  validateUserEmail,
  validateUserDetails,
  validateProduct,
  validateOrders,
  validateAnnouncement,
};
