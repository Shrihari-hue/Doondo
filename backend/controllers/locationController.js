const {
  formatLookupResponse,
  getLocalPincodeRecord,
  fetchExternalPincodeRecord,
  validatePincodeLocation,
} = require("../utils/pincode");

const getPincodeDetails = async (req, res, next) => {
  try {
    const { pincode } = req.params;
    let record = await getLocalPincodeRecord(pincode);
    let source = "local";

    if (!record) {
      record = await fetchExternalPincodeRecord(pincode);
      source = "external";
    }

    if (!record) {
      return res.status(404).json({ message: "Pincode not found" });
    }

    return res.json(formatLookupResponse(record, source));
  } catch (error) {
    return next(error);
  }
};

const validatePincode = async (req, res, next) => {
  try {
    const result = await validatePincodeLocation(req.body);

    if (!result.record) {
      return res.status(404).json(result);
    }

    return res.status(result.isValid ? 200 : 400).json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getPincodeDetails,
  validatePincode,
};
