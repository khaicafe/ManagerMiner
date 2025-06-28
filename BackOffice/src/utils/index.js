export const parseFields = (data) => {
  // Mảng các tên trường cần chuyển đổi parefloat
  const fieldsToParse = [
    "price",
    "discount",
    "ID",
    "min_qty",
    "max_qty",
    "sort_index",
  ];
  const parsedData = { ...data };

  // Lặp qua các key của object
  for (const key in parsedData) {
    if (Object.prototype.hasOwnProperty.call(parsedData, key)) {
      // Kiểm tra xem key có nằm trong mảng fields cần chuyển đổi hay không
      if (fieldsToParse.includes(key.toLowerCase())) {
        parsedData[key] = parseFloat(parsedData[key]);
      }
    }
  }

  return parsedData;
};
