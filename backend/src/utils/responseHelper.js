/**
 * File Name: responseHelper.js
 */
class ResponseHelper {
  static success(statusCode = 200, message = "", data, meta) {
    const filteredData = this.filterFields(data, this.excludeFields);

    return {
      statusCode,
      message,
      success: true,
      data: filteredData,
      meta,
    };
  }

  static error(statusCode = 500, message = "An error occurred", errors) {
    return {
      statusCode,
      message,
      success: false,
      errors,
    };
  }

  static filterFields(data, excludeFields) {
    if (!excludeFields || !Array.isArray(excludeFields)) {
      return data;
    }

    if (Array.isArray(data)) {
      // If data is an array, apply filtering to each object in the array
      return data.map((item) => this.filterObject(item, excludeFields));
    } else if (typeof data === "object") {
      // If data is an object, apply filtering to the object
      return this.filterObject(
        data && data._doc ? data._doc : data,
        excludeFields
      );
    } else {
      return data;
    }
  }

  static filterObject(obj, excludeFields) {
    const filteredObj = { ...(obj?._doc ? obj._doc : obj) };

    excludeFields.forEach((field) => {
      delete filteredObj[field];
    });

    return filteredObj;
  }
}
ResponseHelper.excludeFields = [];
module.exports = ResponseHelper;
