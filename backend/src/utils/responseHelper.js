/**
 * File Name: responseHelper.js
 */
class ResponseHelper {
  static success(statusCode = 200, message = "", data = undefined, meta = undefined) {
    const filteredData = this.filterFields(data, this.excludeFields);

    return {
      statusCode,
      message,
      success: true,
      data: filteredData,
      meta,
    };
  }

  static error(statusCode = 500, message = "An error occurred", errors = undefined) {
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
      return data.map((item) => this.filterObject(item, excludeFields));
    } else if (typeof data === "object") {
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
