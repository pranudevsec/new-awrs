/**
 * File Name: paginationUtils.js
 */

async function getPaginationObject(
  dataLength,
  pageNumber,
  pageSize,
  totalResults
) {
  const totalPages = Math.ceil(totalResults / pageSize);
  const currentPage = Math.min(pageNumber, totalPages || 1);

  return {
    current: currentPage,
    total_pages: totalPages,
    total_results: totalResults,
    size: pageSize,
  };
}

module.exports = getPaginationObject;
