export function validatePasswordChange(currentPassword, newPassword, confirmation) {
  if (!currentPassword) throw Error('Vui lòng nhập mật khẩu hiện tại.');
  if (typeof newPassword !== 'string' || newPassword.length < 10 || newPassword.length > 128) throw Error('Mật khẩu mới cần từ 10 đến 128 ký tự.');
  if (newPassword !== confirmation) throw Error('Mật khẩu xác nhận chưa trùng khớp.');
  if (newPassword === currentPassword) throw Error('Mật khẩu mới phải khác mật khẩu hiện tại.');
}

export async function changeCurrentPassword(auth, currentPassword, newPassword, confirmation, api) {
  validatePasswordChange(currentPassword, newPassword, confirmation);
  const user = auth.currentUser;
  if (!user?.email) throw Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  await api.reauthenticateWithCredential(user, api.EmailAuthProvider.credential(user.email, currentPassword));
  if (auth.currentUser !== user) throw Error('Tài khoản đăng nhập đã thay đổi. Vui lòng mở lại mục đổi mật khẩu.');
  await api.updatePassword(user, newPassword);
}

export function passwordErrorMessage(error) {
  const messages = {
    'auth/wrong-password': 'Mật khẩu hiện tại chưa đúng. Vui lòng kiểm tra lại.',
    'auth/invalid-credential': 'Mật khẩu hiện tại chưa đúng hoặc phiên đăng nhập không còn hợp lệ.',
    'auth/invalid-login-credentials': 'Mật khẩu hiện tại chưa đúng. Vui lòng kiểm tra lại.',
    'auth/weak-password': 'Mật khẩu mới chưa đáp ứng yêu cầu bảo mật của hệ thống.',
    'auth/password-does-not-meet-requirements': 'Mật khẩu mới chưa đáp ứng yêu cầu bảo mật của hệ thống.',
    'auth/requires-recent-login': 'Phiên xác thực đã hết hạn. Vui lòng đăng nhập lại rồi đổi mật khẩu.',
    'auth/too-many-requests': 'Bạn đã thử quá nhiều lần. Vui lòng chờ một lúc rồi thử lại.',
    'auth/network-request-failed': 'Không thể kết nối. Vui lòng kiểm tra mạng rồi thử lại.',
    'auth/user-token-expired': 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
  };
  return messages[error?.code] || (error?.code ? 'Chưa thể đổi mật khẩu. Vui lòng thử lại hoặc liên hệ quản trị viên.' : error?.message || 'Chưa thể đổi mật khẩu. Vui lòng thử lại.');
}
