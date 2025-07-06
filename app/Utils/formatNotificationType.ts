export const formatNotificationType = (type: string) => {
  if (type === 'whatsappBusiness') return 'Whatsapp Business';
  return type
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
