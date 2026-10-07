// Utility helper functions shared across the application

export const moveItemInArray = <T,>(arr: T[], index: number, direction: 'up' | 'down'): T[] => {
  const newArr = [...arr];
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= newArr.length) return newArr;
  const temp = newArr[index];
  newArr[index] = newArr[targetIndex];
  newArr[targetIndex] = temp;
  return newArr;
};

export const renderDate = (dateVal: any): string => {
  if (!dateVal) return '';
  try {
    if (dateVal.toDate) {
      return dateVal.toDate().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    return new Date(dateVal).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (e) {
    return '';
  }
};
