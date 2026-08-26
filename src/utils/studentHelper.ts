/**
 * Lấy chữ cái đầu tiên của TÊN học sinh (chữ cái đầu của từ cuối cùng trong Họ và tên)
 * Ví dụ: 
 * - "Nguyễn Thảo An" -> "A"
 * - "Trần Gia Bảo" -> "B"
 * - "Phạm Thu Hà" -> "H"
 * - "Hoàng Thị Ánh" -> "Á"
 */
export const getStudentInitial = (fullName: string): string => {
  if (!fullName || typeof fullName !== 'string') return '?';
  const trimmed = fullName.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  const firstName = parts[parts.length - 1] || '';
  return (firstName.charAt(0) || trimmed.charAt(0)).toUpperCase();
};
