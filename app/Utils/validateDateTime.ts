export const validateDateTime = (selectedDateTime: Date): boolean => {
  const now = new Date();
  const tenSecondsFromNow = new Date(now.getTime() + 10 * 1000);

  return selectedDateTime > tenSecondsFromNow;
};
