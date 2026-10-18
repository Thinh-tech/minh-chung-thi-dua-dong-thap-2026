const allowedTypes = ['application/pdf','image/jpeg','image/png','image/webp','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
export function validateUpload(file) {
  if (!allowedTypes.includes(file.type)) throw Error('Chỉ nhận PDF, JPG, PNG, WEBP, DOCX, XLSX.');
  const image = file.type.startsWith('image/');
  const maxBytes = (image ? 5 : 10) * 1024 * 1024;
  if (!Number.isFinite(file.size) || file.size < 0) throw Error('Dung lượng tệp không hợp lệ.');
  if (file.size > maxBytes) throw Error(image ? 'Mỗi ảnh tối đa 5 MB. Vui lòng giảm dung lượng ảnh rồi tải lại.' : 'Mỗi tệp PDF, Word, Excel tối đa 10 MB.');
}
